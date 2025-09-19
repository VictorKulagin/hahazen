"use client";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useEmployees } from "@/hooks/useEmployees";

export interface ScheduleEvent {
    id: string;
    start: string;
    end: string;
    text: string;
    master: number;
}

export type ScheduleModuleProps = {
    employees: ReturnType<typeof useEmployees>["data"];
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
    const masters = employees.map((e) => e.name);
    const minMinutes = startHour * 60;
    const maxMinutes = endHour * 60;
    const slots = useMemo(() => rangeSlots(minMinutes, maxMinutes, slotStepMin), [minMinutes, maxMinutes, slotStepMin]);

    const [events, setEvents] = useState<ScheduleEvent[]>(appointments);
    const [colRects, setColRects] = useState<{ left: number; width: number }[]>([]);
    const scheduleRef = useRef<HTMLDivElement | null>(null);
    const headerRowRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => setEvents(appointments), [appointments]);

    // вычисляем реальные размеры колонок
    const recalcColRects = () => {
        if (!headerRowRef.current || !scheduleRef.current) return;
        const scheduleBox = scheduleRef.current.getBoundingClientRect();
        const cols = Array.from(headerRowRef.current.querySelectorAll<HTMLDivElement>(".col-master"));
        setColRects(
            cols.map((c) => {
                const r = c.getBoundingClientRect();
                return { left: r.left - scheduleBox.left, width: r.width };
            })
        );
    };

    useLayoutEffect(() => recalcColRects(), [masters.length]);
    useEffect(() => {
        window.addEventListener("resize", recalcColRects);
        return () => window.removeEventListener("resize", recalcColRects);
    }, []);

    return (
        <div className="overflow-x-auto">
            <div ref={scheduleRef} className="relative border border-gray-300 rounded bg-white min-w-max">
                {/* Заголовок */}
                <div ref={headerRowRef} className="flex sticky top-0 bg-white z-20 border-b">
                    <div className="flex-none w-[90px] bg-gray-100 border-r border-gray-300 text-center font-semibold p-2 sticky left-0 z-30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                        Время
                    </div>
                    {masters.map((m, i) => (
                        <div
                            key={i}
                            className="col-master flex-1 min-w-[180px] border-r border-gray-300 p-2 text-center font-medium"
                        >
                            {m}
                        </div>
                    ))}
                </div>

                {/* Сетка */}
                <div className="relative">
                    {slots.map((min, rowIdx) => (
                        <div className="flex" key={rowIdx}>
                            {/* Левая колонка с временем */}
                            <div className="flex-none w-[90px] h-[40px] border-t border-gray-300 flex items-center justify-center text-sm bg-white sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                                {toTime(min)}
                            </div>
                            {/* Ячейки мастеров */}
                            {masters.map((_, masterIdx) => (
                                <div
                                    key={masterIdx}
                                    className="col-master flex-1 min-w-[180px] h-[40px] border-t border-l border-gray-200 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => onCellClick?.(min, masterIdx)}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {/* События */}
                {events.map((ev) => {
                    const sm = toMins(ev.start);
                    const em = toMins(ev.end);
                    const top = ((sm - minMinutes) / slotStepMin) * rowHeightPx + rowHeightPx;
                    const height = ((em - sm) / slotStepMin) * rowHeightPx;
                    const col = colRects[ev.master];
                    if (!col) return null;

                    return (
                        <div
                            key={ev.id}
                            className="absolute bg-blue-100 border border-blue-300 rounded-lg shadow-sm p-1.5 flex flex-col justify-center cursor-pointer hover:bg-blue-200 transition-colors text-xs"
                            style={{
                                top,
                                left: col.left,
                                width: col.width,
                                height,
                            }}
                            onClick={() => onEventClick?.(ev)}
                        >
                            <span className="font-semibold">{ev.text}</span>
                            <span className="text-[11px] opacity-80">
                                {ev.start} – {ev.end}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
