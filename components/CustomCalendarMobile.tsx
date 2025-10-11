import React, { useState, useMemo } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

const DAYS_OF_WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface CustomCalendarMobileProps {
    year: number;
    month: number;
    daysWithAppointments: number[];
    onDateSelect?: (date: Date) => void;
    onPrevMonth?: () => void;
    onNextMonth?: () => void;
}

const CustomCalendarMobile: React.FC<CustomCalendarMobileProps> = ({
                                                                       year,
                                                                       month,
                                                                       daysWithAppointments,
                                                                       onDateSelect,
                                                                       onPrevMonth,
                                                                       onNextMonth,
                                                                   }) => {
    const today = new Date();
    const currentDay =
        today.getFullYear() === year && today.getMonth() + 1 === month
            ? today.getDate()
            : null;

    const [selectedDay, setSelectedDay] = useState<number | null>(currentDay);
    const [expanded, setExpanded] = useState(false);

    // Вычисляем массив дней месяца
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayWeek = new Date(year, month - 1, 1).getDay();
    const shift = firstDayWeek === 0 ? 6 : firstDayWeek - 1;

    const calendarCells = useMemo(() => {
        const arr = [];
        for (let i = 0; i < shift; i++) arr.push(null);
        for (let day = 1; day <= daysInMonth; day++) arr.push(day);
        return arr;
    }, [year, month]);

    // Разбиваем календарь на недели
    const weeks = useMemo(() => {
        const result: (number | null)[][] = [];
        for (let i = 0; i < calendarCells.length; i += 7) {
            result.push(calendarCells.slice(i, i + 7));
        }
        return result;
    }, [calendarCells]);

    // Определяем неделю для текущего дня
    const currentWeekIndex = weeks.findIndex((week) =>
        week.includes(selectedDay)
    );

    const handleDayClick = (day: number | null) => {
        if (!day) return;
        setSelectedDay(day);
        onDateSelect?.(new Date(year, month - 1, day));
    };

    const visibleWeeks = expanded
        ? weeks
        : currentWeekIndex >= 0
            ? [weeks[currentWeekIndex]]
            : [weeks[0]];

    return (
        <div className="bg-white rounded-lg shadow-md p-4 w-full">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-2">
                <button onClick={onPrevMonth} className="text-gray-500">←</button>
                <div className="font-semibold text-gray-700 capitalize cursor-default hover:text-green-600 transition">
                    {new Date(year, month - 1).toLocaleString("ru-RU", {
                        month: "long",
                        year: "numeric",
                    })}
                </div>
                <button onClick={onNextMonth} className="text-gray-500">→</button>
            </div>

            {/* Заголовки дней недели */}
            <div className="grid grid-cols-7 text-center mb-1">
                {DAYS_OF_WEEK.map((d) => (
                    <div key={d} className="text-sm font-medium text-gray-500">
                        {d}
                    </div>
                ))}
            </div>

            {/* Отображение недель */}
            <div
                key={`${year}-${month}`} // ключ меняется при переключении месяца
                className="transition-opacity duration-300 ease-in-out opacity-100 animate-fadeIn"
            >
            <div className="flex flex-col gap-1">
                {visibleWeeks.map((week, wIdx) => (
                    <div key={wIdx} className="grid grid-cols-7 gap-1">
                        {week.map((day, idx) => {
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
                ))}
            </div>
            </div>

            {/* Кнопка свернуть/развернуть */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-2 text-gray-500 flex items-center justify-center gap-1 text-sm"
            >
                {expanded ? (
                    <>
                        <span>Свернуть</span> <ChevronUpIcon className="w-4 h-4" />
                    </>
                ) : (
                    <>
                        <span>Развернуть</span> <ChevronDownIcon className="w-4 h-4" />
                    </>
                )}
            </button>
        </div>
    );
};

export default CustomCalendarMobile;
