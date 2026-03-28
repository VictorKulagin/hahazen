"use client";

import React, { useMemo, useState } from "react";
import { formatDateLocal } from "@/components/utils/date";
import { usePeriodStats } from "@/hooks/useAppointments";
import { ChevronDown, CalendarDays, Banknote, BarChart3 } from "lucide-react";



type Props = {
    branchId?: number | null;
};

type RangeType = "day" | "week" | "month";

function getRangeDates(type: RangeType) {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (type === "day") {
        // текущий день
    } else if (type === "week") {
        const day = start.getDay();
        const diff = day === 0 ? 6 : day - 1;

        start.setDate(start.getDate() - diff);

        end.setTime(start.getTime());
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    } else {
        start.setDate(1);

        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
    }

    return {
        start: formatDateLocal(start),
        end: formatDateLocal(end),
    };
}

const PeriodStatsModule: React.FC<Props> = ({ branchId }) => {
    const [rangeType, setRangeType] = useState<RangeType>("day");
    const [isMobileStatsCollapsed, setIsMobileStatsCollapsed] = useState(true);

    const range = useMemo(() => getRangeDates(rangeType), [rangeType]);

    const { data, isLoading, isError, error } = usePeriodStats(
        range.start,
        range.end,
        branchId ?? null
    );

    const avgCheck = useMemo(() => {
        const count = data?.period_totals?.appointments_count ?? 0;
        const paid = data?.period_totals?.paid_amount ?? 0;

        if (!count) return 0;
        return Math.round(paid / count);
    }, [data]);

    const sortedDays = useMemo(() => {
        if (!data?.days) return [];
        return [...data.days].sort((a, b) => a.date.localeCompare(b.date));
    }, [data]);

    return (
        <section className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm md:px-5 md:py-4">
            <div className="mb-3">
                <div className="hidden md:flex items-center justify-between gap-6">
                    <div className="min-w-0">
                        <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
                            {rangeType === "day" && "Сегодня"}
                            {rangeType === "week" && `Неделя: ${range.start} — ${range.end}`}
                            {rangeType === "month" && `Месяц: ${range.start} — ${range.end}`}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Записи и оплаченная сумма за выбранный период
                        </p>
                    </div>

                    <div className="shrink-0">
                        <div className="inline-flex rounded-2xl border border-gray-200 bg-gray-50 p-1 shadow-sm">
                            {[
                                { key: "day", label: "Сегодня" },
                                { key: "week", label: "Неделя" },
                                { key: "month", label: "Месяц" },
                            ].map((item) => {
                                const isActive = rangeType === item.key;

                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => setRangeType(item.key as RangeType)}
                                        className={`min-w-[110px] rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                                            isActive
                                                ? "bg-green-600 text-white shadow-sm"
                                                : "text-gray-700 hover:bg-white"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="md:hidden">
                    <button
                        type="button"
                        onClick={() => setIsMobileStatsCollapsed((prev) => !prev)}
                        className="flex w-full items-start justify-between gap-3 rounded-2xl"
                    >
                        <div>
                            <h2 className="text-left text-lg font-semibold text-gray-900">
                                {rangeType === "day" && "Сегодня"}
                                {rangeType === "week" && "Неделя"}
                                {rangeType === "month" && "Месяц"}
                            </h2>
                            <p className="mt-1 text-left text-xs text-gray-400">
                                {range.start} — {range.end}
                            </p>
                        </div>

                        <ChevronDown
                            className={`mt-1 h-5 w-5 shrink-0 text-gray-500 transition-transform ${
                                isMobileStatsCollapsed ? "" : "rotate-180"
                            }`}
                        />
                    </button>
                </div>
            </div>

            <div className="mb-4 hidden md:flex items-center rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <CalendarDays className="h-5 w-5" />
                    </div>
                    <span className="text-sm text-gray-500">Записей:</span>
                    <span className="text-3xl font-semibold text-gray-900">
      {isLoading ? "..." : data?.period_totals?.appointments_count ?? 0}
    </span>
                </div>

                <div className="mx-8 h-10 w-px bg-gray-200" />

                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
                        <Banknote className="h-5 w-5" />
                    </div>
                    <span className="text-sm text-gray-500">Выручка:</span>
                    <span className="text-3xl font-semibold text-gray-900">
      {isLoading
          ? "..."
          : `${(data?.period_totals?.paid_amount ?? 0).toLocaleString("ru-RU")} сом`}
    </span>
                </div>

                <div className="mx-8 h-10 w-px bg-gray-200" />

                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                    <span className="text-sm text-gray-500">Средний чек:</span>
                    <span className="text-3xl font-semibold text-gray-900">
      {isLoading ? "..." : `${avgCheck.toLocaleString("ru-RU")} сом`}
    </span>
                </div>
            </div>

            {isLoading && (
                <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
                    Загружаем статистику...
                </div>
            )}

            {isError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-600">
                    Не удалось загрузить статистику
                    {error instanceof Error ? `: ${error.message}` : ""}
                </div>
            )}

            {!isLoading && !isError && data && (
                <>
                {rangeType !== "day" && (
                    <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 md:block">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">
                                    Дата
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">
                                    Записи
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">
                                    Оплачено
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {sortedDays.length > 0 ? (
                                sortedDays.map((day) => (
                                    <tr key={day.date} className="border-t border-gray-100">
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                                            {day.date}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {day.appointments_count}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                            {day.paid_amount.toLocaleString("ru-RU")} сом
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={3}
                                        className="px-4 py-8 text-center text-gray-500"
                                    >
                                        Нет данных за выбранный период
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
                    {!isMobileStatsCollapsed && (
                        <div className="mt-3 space-y-3 md:hidden">
                            <div className="grid grid-cols-3 rounded-2xl bg-gray-100 p-1">
                                {[
                                    { key: "day", label: "Сегодня" },
                                    { key: "week", label: "Неделя" },
                                    { key: "month", label: "Месяц" },
                                ].map((item) => {
                                    const isActive = rangeType === item.key;

                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => setRangeType(item.key as RangeType)}
                                            className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                                                isActive
                                                    ? "bg-green-600 text-white shadow-sm"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl bg-gray-50 p-3 text-center">
                                    <div className="mb-1 text-sm text-gray-500">Записей</div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {data?.period_totals?.appointments_count ?? 0}
                                    </div>
                                </div>

                                <div className="rounded-xl bg-gray-50 p-3 text-center">
                                    <div className="mb-1 text-sm text-gray-500">Оплачено</div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {(data?.period_totals?.paid_amount ?? 0).toLocaleString("ru-RU")} сом
                                    </div>
                                </div>

                                <div className="rounded-xl bg-gray-50 p-3 text-center col-span-2">
                                    <div className="mb-1 text-sm text-gray-500">Средний чек</div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {avgCheck.toLocaleString("ru-RU")} сом
                                    </div>
                                </div>
                            </div>

                            {rangeType !== "day" && (
                                sortedDays.length > 0 ? (
                                    sortedDays.map((day) => (
                                        <div
                                            key={day.date}
                                            className="rounded-2xl border border-gray-200 bg-white p-4"
                                        >
                                            <div className="mb-3 text-sm font-semibold text-gray-900">
                                                {day.date}
                                            </div>

                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="text-gray-500">Записи</span>
                                                <span className="font-medium text-gray-900">
                        {day.appointments_count}
                    </span>
                                            </div>

                                            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                                                <span className="text-gray-500">Оплачено</span>
                                                <span className="font-medium text-gray-900">
                        {day.paid_amount.toLocaleString("ru-RU")} сом
                    </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                                        Нет данных за выбранный период
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default PeriodStatsModule;
