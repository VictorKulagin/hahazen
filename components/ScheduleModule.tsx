"use client";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// =============================
// ScheduleModule — Step 1
// - чистый React без сторонних модулей
// - рендер сетки расписания и карточек событий
// - без модалок, без drag&drop (появятся на шагах 2+)
// =============================

export type ScheduleEvent = {
    id: string;
    start: string; // HH:MM
    end: string;   // HH:MM
    text: string;
    master: number; // индекс мастера
};

export type ScheduleModuleProps = {
    masters?: string[];
    startHour?: number; // 8 → 08:00
    endHour?: number;   // 20 → 20:00
    slotStepMin?: number; // шаг сетки (мин), по умолчанию 30
    rowHeightPx?: number; // высота строки слота
    initialEvents?: ScheduleEvent[];
    onCellClick?: (startMinutes: number, masterIndex: number) => void; // зарезервировано для шага 2
    onEventClick?: (event: ScheduleEvent) => void;                      // зарезервировано для шага 3
};

const defaultMasters = [
    "Мастер A",
    "Мастер B",
    "Мастер C",
    "Мастер D",
    "Мастер E",
    "Мастер F",
];

function toMins(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function toTime(mins: number): string {
    const hh = String(Math.floor(mins / 60)).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    return `${hh}:${mm}`;
}

function rangeSlots(minMinutes: number, maxMinutes: number, step: number) {
    const slots: number[] = [];
    for (let m = minMinutes; m < maxMinutes; m += step) slots.push(m);
    return slots;
}

export default function ScheduleModule({
                                           masters = defaultMasters,
                                           startHour = 0,
                                           endHour = 24,
                                           slotStepMin = 30,
                                           rowHeightPx = 40,
                                           initialEvents = [
                                               { id: "e1", start: "08:15", end: "09:00", text: "Зарядка", master: 0 },
                                               { id: "e2", start: "09:00", end: "10:00", text: "Завтрак", master: 1 },
                                           ],
                                           onCellClick,
                                           onEventClick,
                                       }: ScheduleModuleProps) {
    const [events] = useState<ScheduleEvent[]>(initialEvents);

    const minMinutes = startHour * 60;
    const maxMinutes = endHour * 60;
    const slots = useMemo(
        () => rangeSlots(minMinutes, maxMinutes, slotStepMin),
        [minMinutes, maxMinutes, slotStepMin]
    );

    // refs для измерений колонок
    const scheduleRef = useRef<HTMLDivElement | null>(null);
    const headerRowRef = useRef<HTMLDivElement | null>(null);
    const [colRects, setColRects] = useState<{ left: number; width: number }[]>([]);

    // пересчёт позиций колонок
    useLayoutEffect(() => {
        const schedule = scheduleRef.current;
        const header = headerRowRef.current;
        if (!schedule || !header) return;

        const scheduleBox = schedule.getBoundingClientRect();
        // .col-master в хедере: первый столбец времени пропускаем
        const cols = Array.from(header.querySelectorAll<HTMLDivElement>(".col-master"));
        const rects = cols.map((c) => {
            const r = c.getBoundingClientRect();
            return { left: r.left - scheduleBox.left, width: r.width };
        });
        setColRects(rects);
    }, [masters.length]);

    // слушатель ресайза окна → обновить измерения
    useEffect(() => {
        function onResize() {
            const schedule = scheduleRef.current;
            const header = headerRowRef.current;
            if (!schedule || !header) return;
            const scheduleBox = schedule.getBoundingClientRect();
            const cols = Array.from(header.querySelectorAll<HTMLDivElement>(".col-master"));
            const rects = cols.map((c) => {
                const r = c.getBoundingClientRect();
                return { left: r.left - scheduleBox.left, width: r.width };
            });
            setColRects(rects);
        }
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // вычисление позиций карточек событий
    const cards = useMemo(() => {
        const pixelsPerMin = rowHeightPx / slotStepMin;
        const results = events.map((ev) => {
            const sm = toMins(ev.start);
            const em = toMins(ev.end);
            const duration = Math.max(0, em - sm);
            const top = ((sm - minMinutes) / slotStepMin) * rowHeightPx + rowHeightPx; // + высота заголовка
            const height = (duration / slotStepMin) * rowHeightPx;
            const col = colRects[ev.master];
            const left = col ? col.left : 100; // fallback
            const width = col ? col.width : 120;
            return { id: ev.id, top, height, left, width, ev };
        });
        return results;
    }, [events, colRects, minMinutes, rowHeightPx, slotStepMin]);

    // обработчик клика по ячейке сетки (будет использован на шаге 2)
    const handleCellClick = (startMin: number, masterIndex: number) => () => {
        if (onCellClick) onCellClick(startMin, masterIndex);
    };

    return (
        <div className="schedule-wrapper">
            <div className="schedule" ref={scheduleRef}>
                {/* Header */}
                <div className="header-row" ref={headerRowRef}>
                    <div className="col-time">Время</div>
                    {masters.map((m, i) => (
                        <div className="col-master" key={i}>
                            {m}
                        </div>
                    ))}
                </div>

                {/* Body */}
                <div className="body" style={{ position: "relative" }}>
                    {slots.map((min, rowIdx) => (
                        <div className="slot-row" key={rowIdx}>
                            <div className="col-time cell-slot">{toTime(min)}</div>
                            {masters.map((_, masterIdx) => (
                                <div
                                    key={masterIdx}
                                    className="col-master cell-slot"
                                    onClick={handleCellClick(min, masterIdx)}
                                    role="button"
                                    aria-label={`Создать событие: ${toTime(min)} — ${masters[masterIdx]}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {/* Event cards overlay */}
                {cards.map((c) => (
                    <div
                        key={c.id}
                        className="event-card"
                        style={{ top: c.top, left: c.left, width: c.width, height: c.height }}
                        onClick={() => onEventClick?.(c.ev)}
                        role="button"
                        aria-label={`Открыть событие ${c.ev.text}`}
                    >
                        <span className="event-title">{c.ev.text}</span>
                        <span className="event-time">{c.ev.start}–{c.ev.end}</span>
                    </div>
                ))}
            </div>

            <style jsx>{`
        .schedule-wrapper { overflow-x: auto; }
        .schedule { position: relative; min-width: calc(100px + ${masters.length}*120px); border:1px solid #dee2e6; border-radius:.25rem; background:#fff; }
        .header-row, .slot-row { display:flex; }
        .col-time { flex:0 0 100px; background:#f8f9fa; border-right:1px solid #dee2e6; text-align:center; font-weight:600; padding:.5rem; box-sizing:border-box; }
        .col-master { flex:1; border-right:1px solid #dee2e6; padding:.5rem; box-sizing:border-box; min-width:120px; position:relative; }
        .col-master:last-child { border-right:none; }
        .cell-slot { height:${rowHeightPx}px; border-top:1px solid #dee2e6; cursor:pointer; }
        .cell-slot:hover { background: rgba(0,0,0,.03); }
        .event-card { position:absolute; background:rgba(0,123,255,0.18); border:1px solid #0d6efd; border-radius:.25rem; padding:.25rem .5rem; font-size:.85rem; box-sizing:border-box; cursor:default; user-select:none; }
        .event-title { font-weight:600; display:block; margin-bottom:2px; }
        .event-time { font-size:.8rem; opacity:.9; }
      `}</style>
        </div>
    );
}
