"use client";

import { useState } from "react";
import AdminDialogPortal from "@/components/AdminDialogPortal";
import { getApiErrorMessage } from "@/services/apiError";
import type { ScheduleResource } from "@/services/resourcesApi";
import type {
    ResourceSchedule,
    ResourceSchedulePeriod,
    ResourceSchedulePeriodTuple,
} from "@/services/resourceScheduleApi";
import {
    useResourceSchedules,
    useSaveResourceSchedule,
} from "@/hooks/useResourceSchedules";

type ResourceScheduleDialogProps = {
    resource: ScheduleResource;
    onClose: () => void;
};

type DayValue = {
    weekday: number;
    label: string;
    enabled: boolean;
    startTime: string;
    endTime: string;
};

const WEEKDAYS = [
    { weekday: 1, label: "Понедельник" },
    { weekday: 2, label: "Вторник" },
    { weekday: 3, label: "Среда" },
    { weekday: 4, label: "Четверг" },
    { weekday: 5, label: "Пятница" },
    { weekday: 6, label: "Суббота" },
    { weekday: 0, label: "Воскресенье" },
] as const;

const getToday = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const getPeriodValue = (period: ResourceSchedulePeriod) => {
    if (Array.isArray(period)) {
        return {
            weekday: Number(period[0]),
            startTime: period[1],
            endTime: period[2],
        };
    }

    return {
        weekday: Number(
            period.weekday ?? period.day_of_week ?? period.day_key ?? -1
        ),
        startTime: period.start_time,
        endTime: period.end_time,
    };
};

const createInitialDays = (schedule?: ResourceSchedule): DayValue[] => {
    const periods = new Map(
        (schedule?.periods ?? []).map((period) => {
            const value = getPeriodValue(period);
            return [value.weekday, value] as const;
        })
    );

    return WEEKDAYS.map((day) => {
        const period = periods.get(day.weekday);
        return {
            ...day,
            enabled: Boolean(period),
            startTime: period?.startTime ?? "11:00",
            endTime: period?.endTime ?? "20:00",
        };
    });
};

const inputClass =
    "rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:disabled:bg-white/[0.03] dark:disabled:text-white/30";

export default function ResourceScheduleDialog({
    resource,
    onClose,
}: ResourceScheduleDialogProps) {
    const schedulesQuery = useResourceSchedules(resource.id);

    return (
        <AdminDialogPortal onEscape={onClose}>
            <div className="admin-dialog-overlay fixed inset-0 z-50 flex justify-end bg-black/50">
                <div className="admin-dialog-panel flex h-full w-full flex-col overflow-hidden bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-xl sm:w-[42rem] sm:rounded-l-2xl">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-white/95 px-5 py-4 dark:border-white/10 dark:bg-[rgb(var(--card))]/95">
                        <div>
                            <h2 className="text-lg font-semibold">График ресурса</h2>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {resource.name}: дни и часы для онлайн-записи
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition hover:bg-gray-200 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
                            aria-label="Закрыть"
                        >
                            ✕
                        </button>
                    </div>

                    {schedulesQuery.isLoading ? (
                        <div className="flex flex-1 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                            Загружаем график…
                        </div>
                    ) : schedulesQuery.error ? (
                        <div className="m-5 rounded-xl bg-red-50 px-3 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
                            {getApiErrorMessage(
                                schedulesQuery.error,
                                "Не удалось загрузить график ресурса."
                            )}
                        </div>
                    ) : (
                        <ResourceScheduleForm
                            key={`${resource.id}-${schedulesQuery.data?.[0]?.id ?? "new"}`}
                            resourceId={resource.id}
                            schedule={schedulesQuery.data?.[0]}
                            onClose={onClose}
                        />
                    )}
                </div>
            </div>
        </AdminDialogPortal>
    );
}

function ResourceScheduleForm({
    resourceId,
    schedule,
    onClose,
}: {
    resourceId: number;
    schedule?: ResourceSchedule;
    onClose: () => void;
}) {
    const saveMutation = useSaveResourceSchedule();
    const [startDate, setStartDate] = useState(schedule?.start_date ?? getToday());
    const [endDate, setEndDate] = useState(schedule?.end_date ?? "2099-12-31");
    const [days, setDays] = useState<DayValue[]>(() =>
        createInitialDays(schedule)
    );
    const [error, setError] = useState("");

    const updateDay = (weekday: number, patch: Partial<DayValue>) => {
        setDays((current) =>
            current.map((day) =>
                day.weekday === weekday ? { ...day, ...patch } : day
            )
        );
    };

    const handleSave = async () => {
        const enabledDays = days.filter((day) => day.enabled);

        if (!startDate || !endDate || endDate < startDate) {
            setError("Проверьте период действия графика.");
            return;
        }

        if (enabledDays.length === 0) {
            setError("Выберите хотя бы один рабочий день.");
            return;
        }

        if (enabledDays.some((day) => day.endTime <= day.startTime)) {
            setError("Время окончания должно быть позже времени начала.");
            return;
        }

        const periods: ResourceSchedulePeriodTuple[] = enabledDays.map(
            (day) => [day.weekday, day.startTime, day.endTime]
        );

        setError("");
        try {
            await saveMutation.mutateAsync({
                id: schedule?.id,
                resourceId,
                data: {
                    resource_id: resourceId,
                    schedule_type: "weekly",
                    start_date: startDate,
                    end_date: endDate,
                    periods,
                },
            });
            onClose();
        } catch (err) {
            setError(
                getApiErrorMessage(err, "Не удалось сохранить график ресурса.")
            );
        }
    };

    return (
        <>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-400/[0.06] dark:text-emerald-200">
                    Клиент ресурс не выбирает. Система использует этот график,
                    чтобы автоматически найти свободный бокс или кабинет.
                </div>

                <section>
                    <h3 className="text-sm font-semibold">Период действия</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label>
                            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                                С даты
                            </span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(event) => setStartDate(event.target.value)}
                                className={`${inputClass} w-full`}
                            />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                                По дату
                            </span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(event) => setEndDate(event.target.value)}
                                className={`${inputClass} w-full`}
                            />
                        </label>
                    </div>
                </section>

                <section>
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold">Рабочие дни</h3>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Время можно задать отдельно для каждого дня.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setDays((current) =>
                                    current.map((day) => ({
                                        ...day,
                                        enabled: true,
                                        startTime: "11:00",
                                        endTime: "20:00",
                                    }))
                                )
                            }
                            className="shrink-0 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-300"
                        >
                            Все дни 11:00–20:00
                        </button>
                    </div>

                    <div className="mt-3 divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 dark:divide-white/10 dark:border-white/10">
                        {days.map((day) => (
                            <div
                                key={day.weekday}
                                className="grid gap-3 bg-white p-3 dark:bg-white/[0.03] sm:grid-cols-[minmax(0,1fr)_8rem_8rem] sm:items-center"
                            >
                                <label className="flex items-center gap-3 text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        checked={day.enabled}
                                        onChange={(event) =>
                                            updateDay(day.weekday, {
                                                enabled: event.target.checked,
                                            })
                                        }
                                        className="h-4 w-4"
                                    />
                                    {day.label}
                                </label>
                                <input
                                    type="time"
                                    value={day.startTime}
                                    onChange={(event) =>
                                        updateDay(day.weekday, {
                                            startTime: event.target.value,
                                        })
                                    }
                                    disabled={!day.enabled}
                                    aria-label={`Начало, ${day.label}`}
                                    className={inputClass}
                                />
                                <input
                                    type="time"
                                    value={day.endTime}
                                    onChange={(event) =>
                                        updateDay(day.weekday, {
                                            endTime: event.target.value,
                                        })
                                    }
                                    disabled={!day.enabled}
                                    aria-label={`Окончание, ${day.label}`}
                                    className={inputClass}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {error && (
                    <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
                        {error}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 bg-white/95 px-5 py-4 dark:border-white/10 dark:bg-[rgb(var(--card))]/95">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={saveMutation.isPending}
                    className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-medium transition hover:bg-gray-100 disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/5"
                >
                    Отмена
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="h-11 rounded-xl bg-green-500 px-5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
                >
                    {saveMutation.isPending ? "Сохранение…" : "Сохранить график"}
                </button>
            </div>
        </>
    );
}

