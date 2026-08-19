"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import AdminDialogPortal from "@/components/AdminDialogPortal";
import { getApiErrorMessage } from "@/services/apiError";
import type {
    ResourceServiceInput,
    ResourceServiceResponse,
    ScheduleResource,
} from "@/services/resourcesApi";
import type { Services } from "@/services/servicesApi";
import {
    useResourceServices,
    useSyncResourceServices,
} from "@/hooks/useResources";
import { useServices } from "@/hooks/useServices";

type ResourceServicesDialogProps = {
    branchId: number;
    resource: ScheduleResource;
    onClose: () => void;
};

const fieldClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:disabled:bg-white/[0.03] dark:disabled:text-white/30";

export default function ResourceServicesDialog({
    branchId,
    resource,
    onClose,
}: ResourceServicesDialogProps) {
    const servicesQuery = useServices(branchId);
    const resourceServicesQuery = useResourceServices(resource.id);

    return (
        <AdminDialogPortal onEscape={onClose}>
            <div className="admin-dialog-overlay fixed inset-0 z-50 flex justify-end bg-black/50">
                <div className="admin-dialog-panel flex h-full w-full flex-col overflow-hidden bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-xl sm:w-[46rem] sm:rounded-l-2xl">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-white/95 px-5 py-4 dark:border-white/10 dark:bg-[rgb(var(--card))]/95">
                        <div>
                            <h2 className="text-lg font-semibold">Услуги ресурса</h2>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {resource.name}: отметьте услуги, доступные в этом ресурсе
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

                    {servicesQuery.isLoading || resourceServicesQuery.isLoading ? (
                        <div className="flex flex-1 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                            Загружаем услуги…
                        </div>
                    ) : servicesQuery.error || resourceServicesQuery.error ? (
                        <div className="m-5 rounded-xl bg-red-50 px-3 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
                            {getApiErrorMessage(
                                servicesQuery.error ?? resourceServicesQuery.error,
                                "Не удалось загрузить услуги ресурса."
                            )}
                        </div>
                    ) : (
                        <ResourceServicesForm
                            key={`${resource.id}-${resourceServicesQuery.data?.length ?? 0}`}
                            resourceId={resource.id}
                            services={servicesQuery.data ?? []}
                            assignedServices={resourceServicesQuery.data ?? []}
                            onClose={onClose}
                        />
                    )}
                </div>
            </div>
        </AdminDialogPortal>
    );
}

type ServiceOverrides = Record<
    number,
    { individualPrice: string; durationMinutes: string }
>;

function ResourceServicesForm({
    resourceId,
    services,
    assignedServices,
    onClose,
}: {
    resourceId: number;
    services: Services[];
    assignedServices: ResourceServiceResponse[];
    onClose: () => void;
}) {
    const syncMutation = useSyncResourceServices();
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<number>>(
        () => new Set(assignedServices.map((item) => item.service_id))
    );
    const [overrides, setOverrides] = useState<ServiceOverrides>(() =>
        Object.fromEntries(
            assignedServices.map((item) => [
                item.service_id,
                {
                    individualPrice: String(item.individual_price ?? 0),
                    durationMinutes: String(item.duration_minutes ?? 0),
                },
            ])
        )
    );
    const [error, setError] = useState("");

    const filteredServices = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return services;
        return services.filter((service) =>
            `${service.group_name ?? ""} ${service.name}`
                .toLowerCase()
                .includes(query)
        );
    }, [search, services]);

    const groupedServices = useMemo(() => {
        const groups = new Map<string, Services[]>();
        filteredServices.forEach((service) => {
            const group = service.group_name?.trim() || "Без группы";
            groups.set(group, [...(groups.get(group) ?? []), service]);
        });
        return [...groups.entries()];
    }, [filteredServices]);

    const toggleService = (serviceId: number) => {
        setSelectedIds((current) => {
            const next = new Set(current);
            if (next.has(serviceId)) next.delete(serviceId);
            else next.add(serviceId);
            return next;
        });
    };

    const updateOverride = (
        serviceId: number,
        field: "individualPrice" | "durationMinutes",
        value: string
    ) => {
        setOverrides((current) => ({
            ...current,
            [serviceId]: {
                individualPrice:
                    field === "individualPrice"
                        ? value
                        : current[serviceId]?.individualPrice ?? "0",
                durationMinutes:
                    field === "durationMinutes"
                        ? value
                        : current[serviceId]?.durationMinutes ?? "0",
            },
        }));
    };

    const handleSave = async () => {
        const payload: ResourceServiceInput[] = [...selectedIds]
            .sort((a, b) => a - b)
            .map((serviceId) => ({
                service_id: serviceId,
                individual_price: Number(
                    overrides[serviceId]?.individualPrice || 0
                ),
                duration_minutes: Number(
                    overrides[serviceId]?.durationMinutes || 0
                ),
            }));

        const hasInvalidValue = payload.some(
            (item) =>
                !Number.isInteger(item.individual_price) ||
                item.individual_price < 0 ||
                !Number.isInteger(item.duration_minutes) ||
                item.duration_minutes < 0
        );

        if (hasInvalidValue) {
            setError("Цена и длительность должны быть целыми числами от 0.");
            return;
        }

        setError("");
        try {
            await syncMutation.mutateAsync({ resourceId, services: payload });
            onClose();
        } catch (err) {
            setError(
                getApiErrorMessage(err, "Не удалось сохранить услуги ресурса.")
            );
        }
    };

    return (
        <>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="relative flex-1">
                        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Поиск услуги"
                            className={`${fieldClass} pl-10`}
                        />
                    </label>
                    <button
                        type="button"
                        onClick={() =>
                            setSelectedIds(new Set(services.map((item) => item.id)))
                        }
                        className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium transition hover:bg-gray-100 dark:border-white/10 dark:hover:bg-white/5"
                    >
                        Выбрать все
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedIds(new Set())}
                        className="h-10 rounded-xl border border-gray-200 px-3 text-sm font-medium transition hover:bg-gray-100 dark:border-white/10 dark:hover:bg-white/5"
                    >
                        Снять все
                    </button>
                </div>

                <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Значение 0 использует базовую цену или длительность услуги.
                    Выбрано: {selectedIds.size} из {services.length}.
                </p>

                {services.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500 dark:border-white/15 dark:text-gray-400">
                        В филиале пока нет услуг.
                    </div>
                ) : groupedServices.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500 dark:border-white/15 dark:text-gray-400">
                        По вашему запросу ничего не найдено.
                    </div>
                ) : (
                    groupedServices.map(([group, groupServices]) => (
                        <section
                            key={group}
                            className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10"
                        >
                            <div className="bg-gray-50 px-4 py-2 text-sm font-semibold dark:bg-white/5">
                                {group}
                            </div>
                            <div className="divide-y divide-gray-200 dark:divide-white/10">
                                {groupServices.map((service) => {
                                    const selected = selectedIds.has(service.id);
                                    const values = overrides[service.id];

                                    return (
                                        <div
                                            key={service.id}
                                            className={`grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem] sm:items-center ${
                                                selected
                                                    ? "bg-emerald-50/70 dark:bg-emerald-400/[0.06]"
                                                    : "bg-white dark:bg-transparent"
                                            }`}
                                        >
                                            <label className="flex min-w-0 items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => toggleService(service.id)}
                                                    className="mt-1 h-4 w-4"
                                                />
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm font-medium">
                                                        {service.name}
                                                    </span>
                                                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                                                        База: {service.base_price} · {service.duration_minutes} мин
                                                    </span>
                                                </span>
                                            </label>
                                            <label>
                                                <span className="mb-1 block text-xs text-gray-500">
                                                    Своя цена
                                                </span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    value={values?.individualPrice ?? "0"}
                                                    onChange={(event) =>
                                                        updateOverride(
                                                            service.id,
                                                            "individualPrice",
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={!selected}
                                                    className={fieldClass}
                                                />
                                            </label>
                                            <label>
                                                <span className="mb-1 block text-xs text-gray-500">
                                                    Своя длительность
                                                </span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    value={values?.durationMinutes ?? "0"}
                                                    onChange={(event) =>
                                                        updateOverride(
                                                            service.id,
                                                            "durationMinutes",
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={!selected}
                                                    className={fieldClass}
                                                />
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))
                )}

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
                    disabled={syncMutation.isPending}
                    className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-medium transition hover:bg-gray-100 disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/5"
                >
                    Отмена
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={syncMutation.isPending}
                    className="h-11 rounded-xl bg-green-500 px-5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
                >
                    {syncMutation.isPending ? "Сохранение…" : "Сохранить услуги"}
                </button>
            </div>
        </>
    );
}
