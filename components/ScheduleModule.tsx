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
    const [selectedMaster, setSelectedMaster] = useState<number | "all">("all");

    const filteredEmployees =
        selectedMaster === "all"
            ? employees
            : employees.filter((_, idx) => idx === selectedMaster);

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

        return "bg-[rgba(255,255,255,0.02)] border border-[rgb(var(--border))] dark:border-[rgba(255,255,255,0.08)] border-l-4 border-l-gray-500";
    };

    const getEventAccentLine = (event: ScheduleEvent) => {
        if (event.visit_status === "no_show") return "bg-red-500";
        if (event.payment_status === "paid") return "bg-green-500";
        if (event.payment_status === "partial") return "bg-yellow-500";
        if (event.visit_status === "arrived") return "bg-emerald-500";
        if (event.visit_status === "expected") return "bg-blue-500";

        return "bg-white/20";
    };


    const avatarColors = [
        "bg-indigo-500",
        "bg-pink-500",
        "bg-orange-500",
        "bg-green-500",
        "bg-blue-500",
        "bg-purple-500",
        "bg-emerald-500",
        "bg-rose-500",
    ];

    function getAvatarColor(name: string = "") {
        let hash = 0;

        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % avatarColors.length;
        return avatarColors[index];
    }

    const getEventStatusLabel = (event: ScheduleEvent) => {
        if (event.visit_status === "no_show") {
            return {
                text: "Не пришёл",
                className: "bg-red-50 text-red-600 border border-red-200",
            };
        }

        if (event.payment_status === "paid") {
            return {
                text: "Оплачено",
                className: "bg-green-50 text-green-600 border border-green-200",
            };
        }

        if (event.payment_status === "partial") {
            return {
                text: "Частично",
                className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
            };
        }

        if (event.visit_status === "arrived") {
            return {
                text: "Пришел",
                className: "bg-emerald-50 text-emerald-600 border border-emerald-200",
            };
        }

        if (event.visit_status === "expected") {
            return {
                text: "Ожидается",
                className: "bg-blue-50 text-blue-600 border border-blue-200",
            };
        }

        return null;
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

    useLayoutEffect(() => {
        if (viewMode === "grid") {
            recalcColRects();
        }
    }, [masters.length, viewMode]);

    useEffect(() => {
        if (viewMode !== "grid") return;

        const id = requestAnimationFrame(() => {
            recalcColRects();
        });

        return () => cancelAnimationFrame(id);
    }, [viewMode, employees.length, appointments.length]);

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

            if (!col) continue;

            const colLeft = col.left;
            const colWidth = col.width;

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
                <div className="relative inline-flex items-center rounded-2xl bg-white dark:bg-[#182235] p-1 shadow-sm border border-gray-200 dark:border-white/10">
                    <div
                        className={`absolute top-1 bottom-1 w-[112px] rounded-xl bg-green-500 dark:bg-green-500 shadow-sm dark:shadow-[0_0_12px_rgba(34,197,94,0.18)] transition-all duration-300 ${
                            viewMode === "list" ? "left-1" : "left-[113px]"
                        }`}
                    />

                    <button
                        type="button"
                        onClick={() => handleViewModeChange("list")}
                        className={`relative z-10 inline-flex w-[112px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                            viewMode === "list"
                                ? "text-white"
                                : "text-gray-600 dark:text-white/75 hover:text-black dark:hover:text-white"
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
                                : "text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white"
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

                    <div className="overflow-x-auto pb-1">
                        <div className="flex gap-2 min-w-max">
                            <button
                                type="button"
                                onClick={() => setSelectedMaster("all")}
                                className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                                    selectedMaster === "all"
                                        ? "bg-green-500 text-white shadow-sm"
                                        : "bg-white text-gray-700 border border-gray-200 dark:bg-[#1f2937] dark:text-white/80 dark:border-white/10"
                                }`}
                            >
                                Все
                            </button>

                            {employees.map((employee, idx) => (
                                <button
                                    key={employee.id}
                                    type="button"
                                    onClick={() => setSelectedMaster(idx)}
                                    className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                                        selectedMaster === idx
                                            ? "bg-green-500 text-white shadow-sm"
                                            : "bg-white text-gray-700 border border-gray-200 dark:bg-[#1f2937] dark:text-white/80 dark:border-white/10"
                                    }`}
                                >
                                    {employee.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredEmployees.map((employee) => {
                        const masterIdx = employees.findIndex((e) => e.id === employee.id);
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
                            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden"
                        >
                            {/* 👤 Заголовок мастера Анимация на мастера */}
                            <div
                                className="
        flex items-center justify-between gap-3
        px-4 py-3
        border-b border-[rgb(var(--border))]
        bg-[rgba(255,255,255,0.02)]
        transition-colors duration-200
        hover:bg-[rgba(255,255,255,0.04)]
        active:bg-[rgba(255,255,255,0.05)]
    "
                            >
                                <button
                                    type="button"
                                    className="flex min-w-0 flex-1 items-center gap-3 text-left rounded-xl transition-all duration-150 active:scale-[0.99]
        "
                                    onClick={
                                        authStorage.has("master:update")
                                            ? () => onMasterClick?.(employee)
                                            : undefined
                                    }
                                    title="Редактировать сотрудника"
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white group-active:-translate-x-0.5 group-active:scale-95 ${getAvatarColor(employee.name)}`}
                                    >
                                        {employee.name
                                            ?.split(" ")
                                            .map((part) => part[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase()}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold text-[rgb(var(--foreground))]">
                                            {employee.name}
                                        </div>
                                        <div className="truncate text-xs text-[rgb(var(--foreground))]/55">
                                            {employee.specialty || "Роль не указана"}
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className="
            shrink-0 rounded-xl px-3 py-1.5
            text-sm font-medium text-green-500
            transition-colors duration-150
            hover:bg-green-500/10
            active:scale-[0.98]
        "
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
                                    employeeEvents.map((event) => {
                                        const currentStart = toMins(event.start);
                                        const currentEnd = toMins(event.end);

                                        const statusLabel = getEventStatusLabel(event);
                                        const accentLine = getEventAccentLine(event);

                                        const overlapEvent = employeeEvents.find((e) => {

                                            if (e.id === event.id) return false;

                                            const s = toMins(e.start);
                                            const eEnd = toMins(e.end);

                                            return currentStart < eEnd && currentEnd > s;
                                        });

                                        return (
                                            <button
                                                key={event.id}
                                                onClick={() => onEventClick?.(event)}
                                                className={`w-full text-left rounded-2xl border px-3 py-3 transition-all duration-200 hover:shadow-md ${getEventColors(event)}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Время */}
                                                    <div className="flex w-12 shrink-0 flex-col items-center leading-none">
            <span className="text-[22px] font-semibold tracking-tight text-black">
                {event.start}
            </span>

                                                        <div className="my-1 h-5 w-px bg-black/10" />

                                                        <span className="text-[12px] text-black/45">
                {event.end}
            </span>
                                                    </div>

                                                    {/* Цветовой акцент */}
                                                    <div className={`mt-0.5 h-14 w-1 shrink-0 rounded-full ${accentLine}`} />

                                                    {/* Контент */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-semibold text-[16px] leading-5 text-black">
                                                            {event.text}
                                                        </div>

                                                        {/* 👉 ВОТ СЮДА */}
                                                        {statusLabel && (
                                                            <div className="mt-2">
            <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${statusLabel.className}`}
            >
                {statusLabel.text}
            </span>
                                                            </div>
                                                        )}

                                                        {typeof event.cost === "number" && (
                                                            <div className="mt-1 text-[12px] text-black/55">
                                                                {event.cost} сом
                                                            </div>
                                                        )}

                                                        {overlapEvent && (
                                                            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] text-red-600">
                                                                <span>⚠</span>
                                                                <span>Пересечение</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-[rgb(var(--foreground))]/70 border border-dashed border-[rgb(var(--border))] dark:border-[rgba(255,255,255,0.08)] rounded-xl">
                                        <span className="text-xl mb-1">📭</span>
                                        <span className="text-sm">Нет записей</span>
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
                                                className="px-2 py-1 text-xs rounded-full border border-[rgb(var(--border))] dark:border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[rgb(var(--foreground))]/70"
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
            <div  className="relative border border-[rgb(var(--border))] dark:border-[rgba(255,255,255,0.08)] rounded bg-[rgba(255,255,255,0.02)] min-w-max">
                {/* Заголовок */}
                <div ref={headerRowRef} className="flex sticky top-0 z-20 h-14 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] backdrop-blur-sm">
                    <div className="
    flex-none w-[70px] sm:w-[80px] md:w-[90px]
    border-r border-[rgb(var(--border))]
    bg-[rgb(var(--card))]
    px-3 py-3
    sticky left-0 z-30
">
                        <div className="text-xs uppercase tracking-wide text-[rgb(var(--foreground))]/55">
                            Время
                        </div>
                    </div>
                    {employees.map((employee, i) => (
                        <button
                            key={employee.id}
                            type="button"
                            className="
    col-master group flex flex-1 min-w-[220px] items-center justify-between
    border-r border-[rgb(var(--border))]
    px-4 py-2 text-left
    bg-[rgba(255,255,255,0.02)]
    transition-all duration-150
    active:scale-[0.99]
        "
                            onClick={
                                authStorage.has("master:update")
                                    ? () => onMasterClick?.(employee)
                                    : undefined
                            }
                            title="Редактировать сотрудника"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <div
                                    className={`
        flex h-9 w-9 shrink-0 items-center justify-center
        rounded-full text-xs font-semibold text-white
        transition-transform duration-150
        group-active:-translate-x-0.5
        group-active:scale-95
        ${getAvatarColor(employee.name)}
    `}
                                >
                                    {employee.name
                                        ?.split(" ")
                                        .map((part) => part[0])
                                        .slice(0, 2)
                                        .join("")
                                        .toUpperCase()}
                                </div>

                                <div className="min-w-0 transition-transform duration-150 group-active:-translate-x-0.5">
                                    <div className="truncate text-sm font-semibold text-[rgb(var(--foreground))]">
                                        {employee.name}
                                    </div>
                                    <div className="truncate text-xs text-[rgb(var(--foreground))]/55">
                                        {employee.specialty || "Роль не указана"}
                                    </div>
                                </div>
                            </div>

                            {authStorage.has("master:update") && (
                                <span className="
    ml-3 shrink-0 rounded-lg p-1 opacity-30
    transition-all duration-150
    group-hover:opacity-100
    group-hover:bg-white/5
    group-active:scale-90
">
                <Pencil size={14} className="text-[rgb(var(--foreground))]/60" />
            </span>
                            )}
                        </button>
                    ))}
                    {/* 👉 ОТДЕЛЬНАЯ КОЛОНКА */}
                    {authStorage.has("master:create") && (
                        <div
                            className="hidden sm:flex flex-none min-w-[180px] border-r border-[rgba(255,255,255,0.08)] p-2 justify-center">
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
  border-t border-[rgba(255,255,255,0.08)]
  border-r border-[rgba(255,255,255,0.08)]
  flex items-center justify-end pr-3
  text-[13px] font-medium text-[rgb(var(--foreground))] tabular-nums
 bg-[rgba(255,255,255,0.02)]
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
                                            masterIdx % 2 === 0 ? "border-[rgb(var(--border))] dark:border-[rgba(255,255,255,0.08)]" : "border-[rgb(var(--border))] dark:border-[rgba(255,255,255,0.08)]"
                                        } ${
                                            working
                                                ? "bg-white dark:bg-[rgba(255,255,255,0.02)] hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.04)]"
                                                : "bg-[repeating-linear-gradient(135deg,#fafafa_0,#fafafa_2px,#f5f5f5_2px,#f5f5f5_4px)] dark:bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.02)_0px,rgba(255,255,255,0.02)_2px,rgba(255,255,255,0.04)_2px,rgba(255,255,255,0.04)_4px)]"
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
                                    className="hidden sm:block flex-none min-w-[180px] h-[40px] border-t border-l border-[rgb(var(--border))] dark:border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]"/>
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
        bg-[rgba(255,255,255,0.02)] px-1
    ">
        {currentTime}
    </span>
                            </div>

                            {/* линия */}
                            <div className="flex-1 h-[2px] bg-red-300 shadow-[0_0_6px_rgba(248,113,113,0.5)]" />

                            {/* 👈 правый маркер (можно оставить или убрать) */}
                            <div className="ml-2 px-1.5 py-[1px] text-[10px] text-red-400 bg-[rgba(255,255,255,0.02)]/80 rounded">
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

                    const statusLabel = getEventStatusLabel(c.ev);
                    const accentLine = getEventAccentLine(c.ev);

                    const isCompactCard = c.height < 60;
                    const isVeryCompactCard = c.height < 44;

                    return (
                        <div
                            key={c.id}
                            className={`absolute border rounded-2xl shadow-sm px-3.5 py-2.5 flex flex-col justify-between cursor-pointer transition hover:shadow-md text-xs overflow-hidden ${getEventColors(c.ev)}`}
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

                            <div className="relative z-10 h-full flex flex-col">
                                <div className="flex items-start gap-2">

                                    <div className="flex w-12 shrink-0 flex-col items-center leading-none">
    <span className="text-[14px] font-semibold text-black">
        {c.ev.start}
    </span>

                                        {!isVeryCompactCard && (
                                            <>
                                                <div className="my-0.5 h-4 w-px bg-black/20" />
                                                <span className="text-[10px] text-black/50">
                {c.ev.end}
            </span>
                                            </>
                                        )}
                                    </div>


                                    <div className={`mt-0.5 h-8 w-1 shrink-0 rounded-full ${accentLine}`} />

                                    <div className="min-w-0 flex-1">
                <span className="font-semibold text-black leading-tight block truncate">
        {c.ev.text}
    </span>


                                        {!isCompactCard && (statusLabel || typeof c.ev.cost === "number") && (
                                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                                                {statusLabel && (
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusLabel.className}`}
                                                    >
                {statusLabel.text}
            </span>
                                                )}

                                                {typeof c.ev.cost === "number" && (
                                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-white/60 text-black/70 border border-black/10">
                {c.ev.cost} сом
            </span>
                                                )}
                                            </div>
                                        )}

                                    </div>
                                </div>

                                {!isCompactCard && (
                                    <div className="mt-auto flex items-center justify-end pt-1">
                                        <div className="flex items-center gap-1">
                                            {c.ev.visit_status === "expected" && <span title="Ожидается">🕒</span>}
                                            {c.ev.visit_status === "arrived" && <span title="Пришел">✅</span>}
                                            {c.ev.visit_status === "no_show" && <span title="Не пришел">❌</span>}
                                            {c.ev.payment_status === "paid" && <span title="Оплачено">💰</span>}
                                            {c.ev.payment_status === "partial" && <span title="Частично">🟡</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 👇 FAB для мобильных */}
            {authStorage.has("master:create") && (
                <button
                    onClick={onAddEntity}
                    className="
    md:hidden px-3 py-2 rounded-xl
    bg-green-500 text-white
    shadow-sm
    hover:bg-green-600
    transition-all duration-200
    active:scale-[0.98]
    flex items-center gap-2
"
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
