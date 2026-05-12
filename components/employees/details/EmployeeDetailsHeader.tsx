"use client";

import React from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { BadgeCheck } from "lucide-react";
import { Employee } from "@/services/employeeApi";

type EmployeeDetailsHeaderProps = {
    employee: Employee;
    onBack: () => void;
    getAvatarColor: (name?: string) => string;
};

const ROLE_LABELS: Record<string, string> = {
    gd: "Руководитель",
    admin: "Администратор",
    master: "Мастер",
};

function getFullName(employee: Employee) {
    return [employee.name, employee.last_name, employee.patronymic]
        .filter(Boolean)
        .join(" ");
}

export default function EmployeeDetailsHeader({
    employee,
    onBack,
    getAvatarColor,
}: EmployeeDetailsHeaderProps) {
    const fullName = getFullName(employee) || "Сотрудник";
    const initials =
        `${employee.name?.[0] ?? ""}${employee.last_name?.[0] ?? ""}`.toUpperCase() ||
        "?";
    const roleLabel = ROLE_LABELS[employee.role] ?? employee.role ?? "Роль не указана";

    return (
        <>
            <button
                type="button"
                onClick={onBack}
                className="flex items-center space-x-2 font-semibold text-green-600 transition hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
            >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Назад</span>
            </button>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-5">
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(
                            employee.name,
                        )}`}
                    >
                        {initials}
                    </div>

                    <div className="min-w-0">
                        <h1 className="truncate text-2xl font-semibold leading-tight text-gray-900 dark:text-white">
                            {fullName}
                        </h1>
                        <p className="truncate text-base text-gray-500 dark:text-gray-400">
                            {employee.specialty || "Специализация не указана"}
                        </p>
                    </div>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-200">
                    <BadgeCheck className="h-4 w-4" />
                    <span>{roleLabel}</span>
                </div>
            </div>
        </>
    );
}
