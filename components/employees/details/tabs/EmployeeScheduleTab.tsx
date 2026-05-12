"use client";

import React, { useMemo } from "react";
import { CalendarDays, Clock3, Moon, Pencil } from "lucide-react";
import { Employee } from "@/services/employeeApi";
import { useEmployeeSchedules } from "@/hooks/useEmployeeSchedules";

type EmployeeScheduleTabProps = {
    employee: Employee;
    canEdit: boolean;
    onEdit: () => void;
};

const DAY_LABELS: Record<string, string> = {
    "1": "Понедельник",
    "2": "Вторник",
    "3": "Среда",
    "4": "Четверг",
    "5": "Пятница",
    "6": "Суббота",
    "7": "Воскресенье",
    monday: "Понедельник",
    tuesday: "Вторник",
    wednesday: "Среда",
    thursday: "Четверг",
    friday: "Пятница",
    saturday: "Суббота",
    sunday: "Воскресенье",
};

function toDateInput(date: Date) {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
}

function formatDate(value?: string) {
    if (!value) return "-";

    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

function formatDay(value: string) {
    return DAY_LABELS[String(value).toLowerCase()] ?? value;
}

export default function EmployeeScheduleTab({
    employee,
    canEdit,
    onEdit,
}: EmployeeScheduleTabProps) {
    const { startDate, endDate } = useMemo(() => {
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + 30);

        return {
            startDate: toDateInput(start),
            endDate: toDateInput(end),
        };
    }, []);

    const {
        data: schedules = [],
        isLoading,
        error,
    } = useEmployeeSchedules(employee.branch_id, employee.id, startDate, endDate);

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            График на ближайшие 30 дней
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(startDate)} - {formatDate(endDate)}
                        </p>
                    </div>

                    <span className="inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">
                        {schedules.length} записей
                    </span>
                </div>

                {isLoading ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                        Загрузка графика...
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
                        Не удалось загрузить график сотрудника.
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                        График пока не настроен.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {schedules.map((schedule) => (
                            <div
                                key={schedule.id}
                                className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                            >
                                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                            <CalendarDays className="h-5 w-5 text-green-500" />
                                            {formatDate(schedule.start_date)} - {formatDate(schedule.end_date)}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Тип: {schedule.schedule_type === "weekly" ? "еженедельный" : schedule.schedule_type}
                                        </p>
                                    </div>

                                    {schedule.night_shift === 1 && (
                                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700 dark:bg-violet-400/10 dark:text-violet-200">
                                            <Moon className="h-4 w-4" />
                                            Ночная смена
                                        </span>
                                    )}
                                </div>

                                {Array.isArray(schedule.periods) && schedule.periods.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                                        {schedule.periods.map((period, idx) => (
                                            <div
                                                key={`${schedule.id}-${idx}`}
                                                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-300"
                                            >
                                                <Clock3 className="h-4 w-4 shrink-0 text-gray-400" />
                                                <span className="truncate">
                                                    {formatDay(period[0])}: {period[1]} - {period[2]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Периоды не указаны.
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {canEdit && (
                <button
                    type="button"
                    onClick={onEdit}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
                >
                    <Pencil size={16} />
                    <span>Редактировать график</span>
                </button>
            )}
        </div>
    );
}
