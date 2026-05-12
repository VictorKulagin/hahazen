"use client";

import React from "react";
import { BriefcaseBusiness, Clock3, Pencil, ReceiptText } from "lucide-react";
import { Employee } from "@/services/employeeApi";
import { useEmployeeServices } from "@/hooks/useServices";

type EmployeeServicesTabProps = {
    employee: Employee;
    canEdit: boolean;
    onEdit: () => void;
};

function formatMoney(value?: number | null) {
    return `${new Intl.NumberFormat("ru-RU", {
        maximumFractionDigits: 0,
    }).format(Number(value ?? 0))} ₽`;
}

export default function EmployeeServicesTab({
    employee,
    canEdit,
    onEdit,
}: EmployeeServicesTabProps) {
    const {
        data: services = [],
        isLoading,
        error,
    } = useEmployeeServices(employee.id);

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Услуги сотрудника
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Индивидуальная цена и длительность отображаются рядом с услугой.
                        </p>
                    </div>

                    <span className="inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">
                        {services.length} услуг
                    </span>
                </div>

                {isLoading ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                        Загрузка услуг...
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
                        Не удалось загрузить услуги сотрудника.
                    </div>
                ) : services.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                        Услуги пока не назначены.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        {services.map((service) => (
                            <div
                                key={service.service_id}
                                className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                            >
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <BriefcaseBusiness className="h-5 w-5 shrink-0 text-green-500" />
                                        <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                                            {service.name}
                                        </h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                        <ReceiptText className="h-4 w-4" />
                                        <span>{formatMoney(service.individual_price)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                        <Clock3 className="h-4 w-4" />
                                        <span>
                                            {service.duration_minutes
                                                ? `${service.duration_minutes} мин`
                                                : "Длительность не задана"}
                                        </span>
                                    </div>
                                </div>
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
                    <span>Настроить услуги</span>
                </button>
            )}
        </div>
    );
}
