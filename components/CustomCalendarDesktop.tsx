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
        <div className="w-full bg-white rounded-lg shadow-md p-4">
            {/* Навигация */}
            <div className="flex justify-between items-center mb-3">
                <button
                    onClick={onPrevMonth}
                    className="text-gray-600 hover:text-green-600 font-semibold"
                >
                    ←
                </button>
                <div className="font-semibold text-gray-700 capitalize cursor-default hover:text-green-600 transition">
                    {new Date(year, month - 1).toLocaleString("ru-RU", {
                        month: "long",
                        year: "numeric",
                    })}
                </div>
                <button
                    onClick={onNextMonth}
                    className="text-gray-600 hover:text-green-600 font-semibold"
                >
                    →
                </button>
            </div>

            {/* Дни недели */}
            <div className="grid grid-cols-7 text-center font-semibold text-gray-500 mb-2">
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
                                    ? "bg-green-500 text-white shadow-md scale-105"
                                    : isHighlighted
                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                        : "hover:bg-gray-100"
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
