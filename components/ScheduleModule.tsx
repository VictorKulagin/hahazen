"use client";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { isWorkingSlot } from "@/components/utils/isWorkingSlot";
import type { EmployeeSchedule } from "@/services/employeeScheduleApi";
import { Employee } from "@/services/employeeApi";
import { PlusIcon } from "@heroicons/react/24/solid";
import { UserPlusIcon } from "@heroicons/react/24/solid";
import {authStorage} from "@/services/authStorage"; // 👈 вместо PlusIcon
import { Pencil, List, LayoutGrid } from "lucide-react";
/*export interface ScheduleEvent {
    id: string;
    start: string;
    end: string;
    text: string;
    master: number;
}*/

export interface ScheduleEvent {
    id: string;
    start: string;
    end: string;
    text: string;
    master: number;
    payment_status?: "unpaid" | "paid" | "partial";
    payment_method?: "cash" | "card" | "transfer" | null;
    visit_status?: "expected" | "arrived" | "no_show";
    cost?: number;
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
    schedules?: EmployeeSchedule[];
    onMasterClick?: (employee: Employee) => void;
    onAddEntity?: () => void; // 👈 новый пропс
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

function getAvailableSlotsForEmployee(
    masterIdx: number,
    employeeId: number,
    selectedDate: Date,
    appointments: ScheduleEvent[],
    schedules: EmployeeSchedule[],
    slotStepMin: number,
    startHour: number,
    endHour: number
) {
    const minMinutes = startHour * 60;
    const maxMinutes = endHour * 60;

    const allSlots = rangeSlots(minMinutes, maxMinutes, slotStepMin);

    const employeeAppointments = appointments.filter(
        (event) => event.master === masterIdx
    );

    return allSlots
        .filter((slotStart) => {
            const slotEnd = slotStart + slotStepMin;

            const working = isWorkingSlot(
                employeeId,
                toTime(slotStart),
                selectedDate,
                schedules
            );

            if (!working) return false;

            const intersects = employeeAppointments.some((event) => {
                const eventStart = toMins(event.start);
                const eventEnd = toMins(event.end);

                return slotStart < eventEnd && slotEnd > eventStart;
            });

            return !intersects;
        })
        .map((slotStart) => ({
            start: toTime(slotStart),
            end: toTime(slotStart + slotStepMin),
        }));
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
                                           onMasterClick,
                                           onAddEntity, // 👈 новый пропс
                                       }: ScheduleModuleProps) {
    const masters = employees.map((e) => e.name);
    const minMinutes = startHour * 60;
    const maxMinutes = endHour * 60;
    const slots = useMemo(() => rangeSlots(minMinutes, maxMinutes, slotStepMin), [minMinutes, maxMinutes, slotStepMin]);

    const [events, setEvents] = useState<ScheduleEvent[]>(appointments);
    const [colRects, setColRects] = useState<{ left: number; width: number }[]>([]);
    const scheduleRef = useRef<HTMLDivElement | null>(null);
    const headerRowRef = useRef<HTMLDivElement | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");

    useEffect(() => setEvents(appointments), [appointments]);

    const getEventColors = (event: ScheduleEvent) => {
        if (event.visit_status === "no_show") {
            return "bg-red-100 border border-red-300 border-l-4 border-l-red-500";
        }

        if (event.payment_status === "paid") {
            return "bg-green-100 border border-green-300 border-l-4 border-l-green-500";
        }

        if (event.payment_status === "partial") {
            return "bg-yellow-100 border border-yellow-300 border-l-4 border-l-yellow-500";
        }

        if (event.visit_status === "arrived") {
            return "bg-emerald-100 border border-emerald-300 border-l-4 border-l-emerald-500";
        }

        if (event.visit_status === "expected") {
            return "bg-blue-100 border border-blue-300 border-l-4 border-l-blue-500";
        }

        return "bg-gray-100 border border-gray-300 border-l-4 border-l-gray-500";
    };


    const recalcColRects = () => {
        if (!headerRowRef.current || !scheduleRef.current) return;
        const scheduleBox = scheduleRef.current.getBoundingClientRect();
        const cols = Array.from(headerRowRef.current.querySelectorAll<HTMLDivElement>(".col-master"));
        setColRects(cols.map((c) => {
            const r = c.getBoundingClientRect();
            return { left: r.left - scheduleBox.left, width: r.width };
        }));
    };

    useLayoutEffect(() => recalcColRects(), [masters.length]);
    useEffect(() => {
        window.addEventListener("resize", recalcColRects);
        return () => window.removeEventListener("resize", recalcColRects);
    }, []);

    useEffect(() => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (currentMinutes < minMinutes || currentMinutes > maxMinutes) return;

        const top =
            ((currentMinutes - minMinutes) / slotStepMin) * rowHeightPx + rowHeightPx;

        scheduleRef.current?.scrollTo({
            top: Math.max(top - 160, 0),
            behavior: "smooth",
        });
    }, [minMinutes, maxMinutes, slotStepMin, rowHeightPx, viewMode]);

    useEffect(() => {
        const getInitialViewMode = () => {
            const isDesktop = window.innerWidth >= 768;

            if (!isDesktop) return "list";

            const saved = localStorage.getItem("scheduleDesktopViewMode");
            return saved === "list" || saved === "grid" ? saved : "grid";
        };

        setViewMode(getInitialViewMode());

        const handleResize = () => {
            const isDesktop = window.innerWidth >= 768;

            if (!isDesktop) {
                setViewMode("list");
                return;
            }

            const saved = localStorage.getItem("scheduleDesktopViewMode");
            setViewMode(saved === "list" || saved === "grid" ? saved : "grid");
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleViewModeChange = (mode: "grid" | "list") => {
        setViewMode(mode);

        if (window.innerWidth >= 768) {
            localStorage.setItem("scheduleDesktopViewMode", mode);
        }
    };

    /*const cards = useMemo(() => {
        return events.map((ev) => {
            const sm = toMins(ev.start);
            const em = toMins(ev.end);
            const duration = Math.max(0, em - sm);
            //const top = ((sm - minMinutes) / slotStepMin) * rowHeightPx + rowHeightPx;
            const top = ((sm - minMinutes) / slotStepMin) * rowHeightPx + rowHeightPx + 2;
            const height = (duration / slotStepMin) * rowHeightPx;
            const col = colRects[ev.master];
            const left = col ? col.left : 100;
            const width = col ? col.width : 120;
            return { id: ev.id, top, height, left, width, ev };
        });
    }, [events, colRects, minMinutes, rowHeightPx, slotStepMin]);*/


    const cards = useMemo(() => {
        const result: Array<{
            id: string;
            top: number;
            height: number;
            left: number;
            width: number;
            ev: ScheduleEvent;
        }> = [];

        const eventsByMaster = new Map<number, ScheduleEvent[]>();

        for (const ev of events) {
            if (!eventsByMaster.has(ev.master)) {
                eventsByMaster.set(ev.master, []);
            }
            eventsByMaster.get(ev.master)!.push(ev);
        }

        for (const [masterIdx, masterEvents] of eventsByMaster.entries()) {
            const col = colRects[masterIdx];
            const colLeft = col ? col.left : 100;
            const colWidth = col ? col.width : 180;

            const sorted = [...masterEvents].sort(
                (a, b) => toMins(a.start) - toMins(b.start)
            );

            type LaneItem = {
                ev: ScheduleEvent;
                start: number;
                end: number;
                lane: number;
                lanesCount: number;
            };

            const placed: LaneItem[] = [];
            let group: LaneItem[] = [];
            let active: LaneItem[] = [];

            const flushGroup = () => {
                if (!group.length) return;

                const lanesCount = Math.max(...group.map((item) => item.lane)) + 1;
                const gap = 6;
                const itemWidth = (colWidth - gap * (lanesCount - 1)) / lanesCount;

                for (const item of group) {
                    const duration = Math.max(0, item.end - item.start);
                    const top =
                        ((item.start - minMinutes) / slotStepMin) * rowHeightPx + rowHeightPx + 2;
                    const height = (duration / slotStepMin) * rowHeightPx;

                    result.push({
                        id: item.ev.id,
                        ev: item.ev,
                        top,
                        height,
                        left: colLeft + item.lane * (itemWidth + gap),
                        width: itemWidth,
                    });
                }

                group = [];
                active = [];
            };

            for (const ev of sorted) {
                const start = toMins(ev.start);
                const end = toMins(ev.end);

                active = active.filter((item) => item.end > start);

                if (active.length === 0) {
                    flushGroup();
                }

                const usedLanes = new Set(active.map((item) => item.lane));
                let lane = 0;
                while (usedLanes.has(lane)) lane++;

                const current: LaneItem = {
                    ev,
                    start,
                    end,
                    lane,
                    lanesCount: 1,
                };

                active.push(current);
                group.push(current);
            }

            flushGroup();
        }

        return result;
    }, [events, colRects, minMinutes, rowHeightPx, slotStepMin]);



    return (
        <>

            <div className="mb-3 hidden md:flex items-center justify-end">
                <div className="relative inline-flex items-center rounded-2xl bg-gray-100 p-1 shadow-sm border border-gray-200">
                    <div
                        className={`absolute top-1 bottom-1 w-[112px] rounded-xl bg-green-500 shadow-sm transition-all duration-300 ${
                            viewMode === "list" ? "left-1" : "left-[113px]"
                        }`}
                    />

                    <button
                        type="button"
                        onClick={() => handleViewModeChange("list")}
                        className={`relative z-10 inline-flex w-[112px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                            viewMode === "list"
                                ? "text-white"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        <List size={16} className="transition-transform duration-200 group-hover:scale-110" />
                        <span>Список</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleViewModeChange("grid")}
                        className={`relative z-10 inline-flex w-[112px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                            viewMode === "grid"
                                ? "text-white"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        <LayoutGrid size={16} className="transition-transform duration-200" />
                        <span>Сетка</span>
                    </button>
                </div>
            </div>


            {/* 📱 МОБИЛЬНЫЙ РЕЖИМ */}
            {viewMode === "list" && (
                <div className="block md:block space-y-3">
                {employees.map((employee, masterIdx) => {
                    const employeeEvents = appointments
                        .filter((event) => event.master === masterIdx)
                        .sort((a, b) => toMins(a.start) - toMins(b.start));

                    const freeSlots = getAvailableSlotsForEmployee(
                        masterIdx,
                        employee.id,
                        selectedDate,
                        appointments,
                        schedules,
                        slotStepMin,
                        startHour,
                        endHour
                    );



                    return (
                        <div
                            key={employee.id}
                            className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                        >
                            {/* 👤 Заголовок мастера */}
                            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                                <button
                                    type="button"
                                    className="font-semibold text-gray-900 text-left"
                                    onClick={
                                        authStorage.has("master:update")
                                            ? () => onMasterClick?.(employee)
                                            : undefined
                                    }
                                    title="Редактировать сотрудника"
                                >
                                    {employee.name}
                                </button>

                                <button
                                    type="button"
                                    className="text-sm text-green-600 font-medium"
                                    //onClick={() => onCellClick?.(9 * 60, masterIdx)}
                                    onClick={() =>
                                        onCellClick?.(
                                            freeSlots.length > 0 ? toMins(freeSlots[0].start) : 9 * 60,
                                            masterIdx
                                        )
                                    }
                                >
                                    + Запись
                                </button>
                            </div>

                            <div className="p-3 space-y-2">
                                {/* 📋 Записи */}
                                {employeeEvents.length > 0 ? (
                                    employeeEvents.map((event) => (
                                        <button
                                            key={event.id}
                                            onClick={() => onEventClick?.(event)}
                                            className={`w-full text-left rounded-xl border p-3 ${getEventColors(event)}`}
                                        >
                                            <div className="text-xs text-gray-500">
                                                {event.start} – {event.end}
                                            </div>

                                            <div className="font-semibold text-gray-900">
                                                {event.text}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-400">
                                        Нет записей
                                    </div>
                                )}

                                {/* 🟢 Свободные слоты */}
                                {freeSlots.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {freeSlots.slice(0, 3).map((slot) => (
                                            <button
                                                key={slot.start}
                                                onClick={() =>
                                                    onCellClick?.(
                                                        toMins(slot.start),
                                                        masterIdx
                                                    )
                                                }
                                                className="px-2 py-1 text-xs rounded-full border border-gray-200 bg-white text-gray-600"
                                            >
                                                {slot.start}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                <button
                    onClick={onAddEntity}
                    className="sm:hidden fixed bottom-6 right-6 z-40 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 active:scale-95 transition"
                    title="Добавить"
                >
                    <UserPlusIcon className="h-6 w-6" />
                </button>
            </div>
            )}

            {viewMode === "grid" && (
                <div ref={scheduleRef} className="hidden md:block overflow-x-auto overflow-y-auto relative max-h-[75vh]">
            <div  className="relative border border-gray-300 rounded bg-gradient-to-b from-white to-gray-50 min-w-max">
                {/* Заголовок */}
                <div ref={headerRowRef} className="flex sticky top-0 bg-gray-50 z-10 h-10 border-b shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                    <div className="flex-none w-[70px] sm:w-[80px] md:w-[90px] bg-gray-100 border-r border-gray-300 text-center font-semibold p-1 sticky left-0 z-30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                        <span className="sm:hidden">⏱</span>
                        <span className="hidden sm:block">Время</span>
                    </div>
                    {masters.map((m, i) => (

                            <div
                                key={i}
                                className="col-master flex-1 min-w-[180px] border-r border-gray-300 p-1 text-center font-semibold text-gray-800 cursor-pointer hover:bg-gray-100"
                                onClick={authStorage.has("master:create")
                                    ? () => onMasterClick?.(employees[i])
                                    : undefined
                                }
                                title="Редактировать сотрудника"
                            >

                                {authStorage.has("master:update") && (
                                    <button className="p-1 rounded opacity-40 group-hover:opacity-100 hover:bg-slate-100 transition">
                                        <Pencil
                                            size={14}
                                            className="text-slate-500 hover:text-slate-700 transition"
                                        />
                                    </button>
                                )} {m}
                        </div>
                    ))}
                    {/* 👉 ОТДЕЛЬНАЯ КОЛОНКА */}
                    {authStorage.has("master:create") && (
                        <div
                            className="hidden sm:flex flex-none min-w-[180px] border-r border-gray-300 p-2 justify-center">
                            <button
                                onClick={onAddEntity}
                                className="px-3 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition flex items-center gap-2"
                                title="Добавить"
                            >
                                <UserPlusIcon className="h-5 w-5"/>
                                <span className="hidden md:inline">Добавить</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Сетка */}
                <div className="relative">
                    {slots.map((min, rowIdx) => (
                        <div className="flex" key={rowIdx}>
                            <div className="
  flex-none w-[70px] sm:w-[80px] md:w-[90px] h-[40px]
  border-t border-gray-100
  border-r border-gray-100
  flex items-center justify-end pr-3
  text-[13px] font-medium text-gray-700 tabular-nums
  bg-white
  sticky left-0 z-10
">
                                {toTime(min)}
                            </div>
                            {masters.map((_, masterIdx) => {
                                const employee = employees[masterIdx];
                                const working = employee
                                    ? isWorkingSlot(employee.id, toTime(min), selectedDate, schedules)
                                    : true;

                                return (
                                    <div
                                        key={masterIdx}
                                        className={`col-master flex-1 min-w-[180px] h-[40px] border-t border-l ${
                                            masterIdx % 2 === 0 ? "border-gray-200" : "border-gray-100"
                                        } ${
                                            working
                                                ? "bg-white hover:bg-blue-50"
                                                : "bg-[repeating-linear-gradient(135deg,#fafafa_0,#fafafa_2px,#f5f5f5_2px,#f5f5f5_4px)]"
                                        }`}

                                        onClick={
                                            authStorage.has("master:create")
                                            ? () => onCellClick?.(min, masterIdx)
                                            : undefined
                                        }
                                    />
                                );
                            })}
                            {/* 👇 ВАЖНО: добавляем пустую колонку внутри flex */}
                            {authStorage.has("master:create") && (
                                <div
                                    className="hidden sm:block flex-none min-w-[180px] h-[40px] border-t border-l border-gray-200 bg-white"/>
                            )}
                        </div>
                    ))}
                </div>

                {/* События */}

                {(() => {
                    const now = new Date();
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();

                    if (currentMinutes < minMinutes || currentMinutes > maxMinutes) return null;

                    const top =
                        ((currentMinutes - minMinutes) / slotStepMin) * rowHeightPx + rowHeightPx + 2;

                    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

                    return (
                        <div
                            className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                            style={{ top }}
                        >
                            {/* 👈 левый маркер */}
                            <div className="w-[70px] sm:w-[80px] md:w-[90px] relative">
    <span className="
        absolute right-1 top-[45%] -translate-y-1/2
        text-[10px] text-red-500/80 font-medium
        bg-white px-1
    ">
        {currentTime}
    </span>
                            </div>

                            {/* линия */}
                            <div className="flex-1 h-[2px] bg-red-300 shadow-[0_0_6px_rgba(248,113,113,0.5)]" />

                            {/* 👈 правый маркер (можно оставить или убрать) */}
                            <div className="ml-2 px-1.5 py-[1px] text-[10px] text-red-400 bg-white/80 rounded">
                                {currentTime}
                            </div>
                        </div>
                    );
                })()}

                {cards.map((c) => {
                    const currentStart = toMins(c.ev.start);
                    const currentEnd = toMins(c.ev.end);

                    const overlapEvent = events.find((e) => {
                        if (e.id === c.ev.id) return false;
                        if (e.master !== c.ev.master) return false;

                        const eventStart = toMins(e.start);
                        const eventEnd = toMins(e.end);

                        return currentStart < eventEnd && currentEnd > eventStart;
                    });

                    let overlapTop = 0;
                    let overlapHeight = 0;

                    if (overlapEvent) {
                        const overlapStart = Math.max(currentStart, toMins(overlapEvent.start));
                        const overlapEnd = Math.min(currentEnd, toMins(overlapEvent.end));

                        overlapTop =
                            ((overlapStart - currentStart) / slotStepMin) * rowHeightPx;

                        overlapHeight =
                            ((overlapEnd - overlapStart) / slotStepMin) * rowHeightPx;
                    }

                    return (
                        <div
                            key={c.id}
                            className={`absolute border rounded-xl shadow-sm p-2 flex flex-col justify-center cursor-pointer transition hover:shadow-md text-xs overflow-hidden ${getEventColors(c.ev)}`}
                            style={{
                                top: isNaN(c.top) ? 0 : c.top,
                                left: isNaN(c.left) ? 0 : c.left,
                                width: isNaN(c.width) ? 120 : c.width,
                                height: isNaN(c.height) ? rowHeightPx : c.height,
                            }}
                            onClick={() => onEventClick?.(c.ev)}
                        >
                            {overlapEvent && (
                                <div
                                    className="absolute left-0 right-0 pointer-events-none
                    bg-[repeating-linear-gradient(135deg,rgba(239,68,68,0.22)_0px,rgba(239,68,68,0.22)_6px,rgba(239,68,68,0.05)_6px,rgba(239,68,68,0.05)_12px)]"
                                    style={{
                                        top: overlapTop,
                                        height: overlapHeight,
                                    }}
                                />
                            )}

                            {overlapEvent && (
                                <span className="absolute top-1 right-1 z-10 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                    Наложение
                </span>
                            )}

                            <div className="relative z-10">
                <span className="font-semibold text-gray-900 leading-tight block">
                    {c.ev.text}
                </span>

                                <span className="text-[11px] text-gray-500 block">
                    {c.ev.start} – {c.ev.end}
                </span>

                                <div className="flex items-center justify-between mt-1">
                                    {typeof c.ev.cost === "number" && (
                                        <span className="text-[11px] text-gray-500">
                            {c.ev.cost} сом
                        </span>
                                    )}

                                    <div className="flex items-center gap-1">
                                        {c.ev.visit_status === "expected" && <span title="Ожидается">🕒</span>}
                                        {c.ev.visit_status === "arrived" && <span title="Пришел">✅</span>}
                                        {c.ev.visit_status === "no_show" && <span title="Не пришел">❌</span>}

                                        {c.ev.payment_status === "paid" && <span title="Оплачено">💰</span>}
                                        {c.ev.payment_status === "partial" && <span title="Частично">🟡</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 👇 FAB для мобильных */}
            {authStorage.has("master:create") && (
                <button
                    onClick={onAddEntity}
                    className="sm:hidden fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition"
                    title="Добавить"
                >
                    <UserPlusIcon className="h-6 w-6"/>
                </button>
            )}
        </div>
            )}
        </>
    );
}
