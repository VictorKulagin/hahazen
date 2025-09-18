"use client";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useEmployees } from "@/hooks/useEmployees";

export interface ScheduleEvent {
    id: string;
    start: string;
    end: string;
    text: string;
    master: number;
    client?: {
        id: number;
        name: string;
        last_name?: string;
        phone?: string;
    };
    services?: Array<{
        id: number;
        name: string;
        base_price: number;
        individual_price: number;
        service_duration_minutes: number;
    }>;
}

export type ScheduleModuleProps = {
    employees: ReturnType<typeof useEmployees>["data"]; // ✅ правильный тип
    appointments: ScheduleEvent[];
    selectedDate: Date;
    onDateSelect: React.Dispatch<React.SetStateAction<Date>>;
    startHour?: number;
    endHour?: number;
    slotStepMin?: number;
    rowHeightPx?: number;
    onCellClick?: (startMinutes: number, masterIndex: number) => void;
    onEventClick?: (event: ScheduleEvent) => void;
};

export function toMins(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

export function toTime(mins: number): string {
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
                                           employees,
                                           appointments,
                                           selectedDate,
                                           onDateSelect,
                                           startHour = 0,
                                           endHour = 24,
                                           slotStepMin = 30,
                                           rowHeightPx = 40,
                                           onCellClick,
                                           onEventClick,
                                       }: ScheduleModuleProps) {
    const masters = employees.map(e => e.name);
    const minMinutes = startHour * 60;
    const maxMinutes = endHour * 60;
    const slots = useMemo(() => rangeSlots(minMinutes, maxMinutes, slotStepMin), [minMinutes, maxMinutes, slotStepMin]);

    // Локальное состояние событий
    const [events, setEvents] = useState<ScheduleEvent[]>(appointments);

    // Синхронизация с пропсами appointments
    useEffect(() => {
        setEvents(appointments);
    }, [appointments]);

    useEffect(() => {
        console.log("Events raw:", events);
    }, [events]);

    // refs для измерений колонок
    const scheduleRef = useRef<HTMLDivElement | null>(null);
    const headerRowRef = useRef<HTMLDivElement | null>(null);
    const [colRects, setColRects] = useState<{ left: number; width: number }[]>([]);

    useLayoutEffect(() => {
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
    }, [masters.length]);

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
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // вычисление позиций карточек событий
    const cards = useMemo(() => {
        return events.map(ev => {
            const sm = toMins(ev.start);
            const em = toMins(ev.end);
            const duration = Math.max(0, em - sm);
            const top = ((sm - minMinutes) / slotStepMin) * rowHeightPx + rowHeightPx;
            const height = (duration / slotStepMin) * rowHeightPx;
            const col = colRects[ev.master];
            const left = col ? col.left : 100;
            const width = col ? col.width : 120;
            return { id: ev.id, top, height, left, width, ev };
        });
    }, [events, colRects, minMinutes, rowHeightPx, slotStepMin]);

    // клик по ячейке
    const handleCellClick = (startMin: number, masterIndex: number) => {
        // создаём новое событие локально
        const newEvent: ScheduleEvent = {
            id: `e-${Date.now()}`,
            start: toTime(startMin),
            end: toTime(startMin + slotStepMin),
            text: "Новое событие",
            master: masterIndex
        };
        setEvents(prev => [...prev, newEvent]);

        // синхронизация с внешним обработчиком (Timetable/сервер)
        onCellClick?.(startMin, masterIndex);
    };
    return (
        <div className="schedule-wrapper">
            <div className="schedule" ref={scheduleRef}>
                {/* Header */}
                <div className="header-row" ref={headerRowRef}>
                    <div className="col-time">Время</div>
                    {masters.map((m, i) => (
                        <div className="col-master" key={i}>{m}</div>
                    ))}
                </div>


                <div className="body" style={{ position: "relative" }}>
                    {slots.map((min, rowIdx) => (
                        <div className="slot-row" key={rowIdx}>
                            <div className="col-time cell-slot">{toTime(min)}</div>
                            {masters.map((_, masterIdx) => (
                                <div
                                    key={masterIdx}
                                    className="col-master cell-slot"
                                    onClick={() => handleCellClick(min, masterIdx)}
                                    role="button"
                                    aria-label={`Создать событие: ${toTime(min)} — ${masters[masterIdx]}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
                {/* Event cards overlay */}
                {cards.map(c => (
                    <div
                        key={c.id}
                        className={`
    absolute bg-blue-100 border border-blue-300 rounded-lg shadow-sm
    p-1.5 flex flex-col justify-center cursor-pointer
    hover:bg-blue-200 transition-colors text-xs
  `}
                        style={{
                            top: isNaN(c.top) ? 0 : c.top,
                            left: isNaN(c.left) ? 0 : c.left,
                            width: isNaN(c.width) ? 120 : c.width,
                            height: isNaN(c.height) ? rowHeightPx : c.height,
                        }}

                        onClick={() => onEventClick?.(c.ev)} // 👈 передаем event наружу
                    >
                        <span className="event-title">{c.ev.text}</span>
                        <span className="event-time">{c.ev.start} – {c.ev.end}</span>
                    </div>
                ))}
            </div>

            <style jsx>{`
        .schedule-wrapper { overflow-x: auto; }
        .schedule { position: relative; min-width: calc(100px + ${masters.length}*120px); border:1px solid #dee2e6; border-radius:.25rem; background:#fff; }
        .header-row, .slot-row { display:flex; }
        .col-time { flex:0 0 100px; background:#f8f9fa; border-right:1px solid #dee2e6; text-align:center; font-weight:600; padding:.5rem; box-sizing:border-box; }
        .col-master { flex:1; border-right:1px solid #dee2e6; padding:.5rem; box-sizing:border-box; min-width:190px; position:relative; }
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
