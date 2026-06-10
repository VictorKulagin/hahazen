"use client";
import React, { useState } from "react";

const DAYS_OF_WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface CustomCalendarDesktopProps {
    year: number;
    month: number; // 1-12
    daysWithAppointments: number[];
    onDateSelect?: (date: Date) => void;
    onPrevMonth?: () => void;
    onNextMonth?: () => void;
}

export const CustomCalendarDesktop: React.FC<CustomCalendarDesktopProps> = ({
                                                                                year,
                                                                                month,
                                                                                daysWithAppointments,
                                                                                onDateSelect,
                                                                                onPrevMonth,
                                                                                onNextMonth,
                                                                            }) => {
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayWeek = new Date(year, month - 1, 1).getDay();
    const shift = firstDayWeek === 0 ? 6 : firstDayWeek - 1;

    const calendarCells: (number | null)[] = [];
    for (let i = 0; i < shift; i++) calendarCells.push(null);
    for (let day = 1; day <= daysInMonth; day++) calendarCells.push(day);

    const handleDayClick = (day: number | null) => {
        if (!day) return;
        setSelectedDay(day);
        onDateSelect?.(new Date(year, month - 1, day));
    };

    return (
        <div className="admin-mini-calendar w-full rounded-2xl border border-gray-200 bg-white p-3 text-slate-900 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100">
            {/* Навигация */}
            <div className="flex justify-between items-center mb-3">
                <button
                    onClick={onPrevMonth}
                    className="admin-calendar-arrow flex h-8 w-8 items-center justify-center rounded-xl font-semibold text-[rgb(var(--foreground))]/70 transition hover:text-emerald-500"
                >
                    ←
                </button>
                <div className="cursor-default capitalize font-semibold text-[rgb(var(--foreground))] transition hover:text-emerald-500">
                    {new Date(year, month - 1).toLocaleString("ru-RU", {
                        month: "long",
                        year: "numeric",
                    })}
                </div>
                <button
                    onClick={onNextMonth}
                    className="admin-calendar-arrow flex h-8 w-8 items-center justify-center rounded-xl font-semibold text-[rgb(var(--foreground))]/70 transition hover:text-emerald-500"
                >
                    →
                </button>
            </div>

            {/* Дни недели */}
            <div className="grid grid-cols-7 text-center font-semibold text-[rgb(var(--foreground))]/60 mb-2">
                {DAYS_OF_WEEK.map((d) => (
                    <div key={d}>{d}</div>
                ))}
            </div>

            {/* Календарные ячейки */}
            <div
                key={`${year}-${month}`} // ключ меняется при переключении месяца
                className="transition-opacity duration-300 ease-in-out opacity-100 animate-fadeIn"
            >
            <div className="grid grid-cols-7 gap-1 text-center">
                {calendarCells.map((day, idx) => {
                    const isHighlighted =
                        day !== null && daysWithAppointments.includes(day);
                    const isSelected = day === selectedDay;

                    return (
                        <div
                            key={idx}
                            onClick={() => handleDayClick(day)}
                            className={`
    w-9 h-9 flex items-center justify-center rounded-full
    cursor-pointer select-none
    transition-all duration-200
    ${day
                                ? isSelected
                                    ? "bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-[0_0_18px_rgba(45,212,191,0.38)] scale-105"
                                    : isHighlighted
                                        ? "border border-emerald-400/20 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 dark:text-emerald-300"
                                        : "text-slate-900 hover:bg-emerald-50 dark:text-slate-100 dark:hover:bg-white/[0.07]"
                                : "cursor-default"
                            }
  `}
                        >
                            {day || ""}
                        </div>
                    );
                })}
            </div>
            </div>
        </div>
    );
};

export default CustomCalendarDesktop;
