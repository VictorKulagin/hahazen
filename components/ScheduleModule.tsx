"use client";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { isWorkingSlot } from "@/components/utils/isWorkingSlot";
import type { EmployeeSchedule } from "@/services/еmployeeScheduleApi";
import {Employee} from "@/services/employeeApi";

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
    selectedDate: Date;                                 // ← уже есть в твоём коде
    onDateSelect: React.Dispatch<React.SetStateAction<Date>>;
    startHour?: number;
    endHour?: number;
    slotStepMin?: number;
    rowHeightPx?: number;
    onCellClick?: (startMinutes: number, masterIndex: number) => void;
    onEventClick?: (event: ScheduleEvent) => void;
    schedules?: EmployeeSchedule[];                     // ← НОВОЕ: массив графиков
    onMasterClick?: (employee: any) => void; // 👈 новый пропс
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
                                           schedules = [],
                                           onMasterClick,   // 👈 добавляем сюда!// ← дефолт: пустой массив
                                       }: ScheduleModuleProps) {
    const masters = employees.map((e) => e.name);
    const minMinutes = startHour * 60;
    const maxMinutes = endHour * 60;
    const slots = useMemo(
        () => rangeSlots(minMinutes, maxMinutes, slotStepMin),
        [minMinutes, maxMinutes, slotStepMin]
    );

    const [events, setEvents] = useState<ScheduleEvent[]>(appointments);
    const [colRects, setColRects] = useState<{ left: number; width: number }[]>([]);
    const scheduleRef = useRef<HTMLDivElement | null>(null);
    const headerRowRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => setEvents(appointments), [appointments]);

    // измерения колонок
    const recalcColRects = () => {
        if (!headerRowRef.current || !scheduleRef.current) return;
        const scheduleBox = scheduleRef.current.getBoundingClientRect();
        const cols = Array.from(
            headerRowRef.current.querySelectorAll<HTMLDivElement>(".col-master")
        );
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

    // карточки событий
    const cards = useMemo(() => {
        return events.map((ev) => {
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

    const handleCellClick = (startMin: number, masterIndex: number) => {
        onCellClick?.(startMin, masterIndex);
    };

    return (
        <div className="overflow-x-auto">
            <div
                ref={scheduleRef}
                className="relative border border-gray-300 rounded bg-white min-w-max"
            >
                {/* Заголовок */}
                <div ref={headerRowRef} className="flex sticky top-0 bg-white z-20 border-b">
                    <div className="flex-none w-[90px] bg-gray-100 border-r border-gray-300 text-center font-semibold p-2 sticky left-0 z-30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                        Время
                    </div>
                    {masters.map((m, i) => (
                        <div
                            key={i}
                            className="col-master flex-1 min-w-[180px] border-r border-gray-300 p-2 text-center font-medium cursor-pointer hover:bg-gray-100"
                            onClick={() => onMasterClick?.(employees[i])}  // 👈 передаём весь объект Employee
                            title="Редактировать сотрудника"
                        >
                            ✏️ {m}
                        </div>
                    ))}
                </div>

                {/* Сетка */}
                <div className="relative">
                    {slots.map((min, rowIdx) => (
                        <div className="flex" key={rowIdx}>
                            {/* колонка времени */}
                            <div className="flex-none w-[90px] h-[40px] border-t border-gray-300 flex items-center justify-center text-sm bg-white sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                                {toTime(min)}
                            </div>
                            {/* колонки мастеров */}
                            {masters.map((_, masterIdx) => {
                                const employee = employees[masterIdx];
                                const working = employee
                                    ? isWorkingSlot(employee.id, toTime(min), selectedDate, schedules)
                                    : true;

                                return (
                                    <div
                                        key={masterIdx}
                                        className={`col-master flex-1 min-w-[180px] h-[40px] border-t border-l border-gray-200 cursor-pointer ${
                                            working
                                                ? "bg-white hover:bg-gray-50"
                                                : "bg-[repeating-linear-gradient(45deg,#fafafa_0,#fafafa_6px,#f0f0f0_6px,#f0f0f0_12px)]"
                                        }`}
                                        onClick={() => handleCellClick(min, masterIdx)}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* События */}
                {cards.map((c) => (
                    <div
                        key={c.id}
                        className="absolute bg-blue-100 border border-blue-300 rounded-lg shadow-sm p-1.5 flex flex-col justify-center cursor-pointer hover:bg-blue-200 transition-colors text-xs"
                        style={{
                            top: isNaN(c.top) ? 0 : c.top,
                            left: isNaN(c.left) ? 0 : c.left,
                            width: isNaN(c.width) ? 120 : c.width,
                            height: isNaN(c.height) ? rowHeightPx : c.height,
                        }}
                        onClick={() => onEventClick?.(c.ev)}
                    >
                        <span className="font-semibold">{c.ev.text}</span>
                        <span className="text-[11px] opacity-80">
              {c.ev.start} – {c.ev.end}
            </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
