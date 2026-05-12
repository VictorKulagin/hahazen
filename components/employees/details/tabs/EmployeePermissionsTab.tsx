"use client";

import React from "react";
import { Pencil, ShieldCheck } from "lucide-react";
import { Employee, EmployeePermissionCell } from "@/services/employeeApi";
import { useEmployeePermissions } from "@/hooks/useEmployees";

type EmployeePermissionsTabProps = {
    employee: Employee;
    canEdit: boolean;
    onEdit: () => void;
};

const ROLE_LABELS: Record<string, string> = {
    gd: "Руководитель",
    admin: "Администратор",
    master: "Мастер",
};

function getRoleLabel(role?: string) {
    return role ? ROLE_LABELS[role] ?? role : "Роль не указана";
}

function getModeLabel(cell: EmployeePermissionCell) {
    if (cell.mode === "allow") return "Разрешено";
    if (cell.mode === "deny") return "Запрещено";
    return "Наследуется";
}

function getEffectiveLabel(cell: EmployeePermissionCell) {
    if (cell.mode === "allow") return "Разрешено индивидуально";
    if (cell.mode === "deny") return "Запрещено индивидуально";
    return cell.inheritedGranted ? "По роли: разрешено" : "По роли: не разрешено";
}

function getCellClass(cell: EmployeePermissionCell) {
    if (cell.mode === "allow") {
        return "border-green-200 bg-green-50 text-green-700 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-200";
    }

    if (cell.mode === "deny") {
        return "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200";
    }

    if (cell.inheritedGranted) {
        return "border-green-200 bg-white text-green-700 dark:border-green-400/20 dark:bg-white/[0.04] dark:text-green-200";
    }

    return "border-gray-200 bg-gray-50 text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300";
}

export default function EmployeePermissionsTab({
    employee,
    canEdit,
    onEdit,
}: EmployeePermissionsTabProps) {
    const {
        data: permissions,
        isLoading,
        error,
    } = useEmployeePermissions(employee.id);

    const matrix = permissions?.matrix;
    const roleLabel = getRoleLabel(permissions?.employeeRole ?? employee.role);
    const changedCells =
        matrix?.rows.reduce((total, row) => {
            return (
                total +
                Object.values(row.cells).filter((cell) => cell && cell.mode !== "inherit").length
            );
        }, 0) ?? 0;

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-green-200 bg-green-50/60 p-4 shadow-sm dark:border-green-400/20 dark:bg-green-400/10 dark:shadow-none">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-600 text-white shadow-sm">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Индивидуальные разрешения
                            </h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                Базовая роль: {roleLabel}. Индивидуальные настройки показывают, где права отличаются от роли.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-semibold text-green-700 shadow-sm dark:bg-white/10 dark:text-green-200">
                            {changedCells} изм.
                        </span>

                        {permissions?.canEdit === false && (
                            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-600 shadow-sm dark:bg-white/10 dark:text-gray-300">
                                Только просмотр
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                    Загрузка разрешений...
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
                    Не удалось загрузить разрешения сотрудника.
                </div>
            ) : !matrix || matrix.rows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                    Матрица разрешений пока недоступна.
                </div>
            ) : (
                <div className="space-y-4">
                    {matrix.rows.map((row) => (
                        <section
                            key={row.rowKey}
                            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none"
                        >
                            <div className="mb-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {row.moduleLabel}
                                </h3>
                                {row.hint && (
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {row.hint}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {matrix.columns.map((column) => {
                                    const cell = row.cells[column.key];

                                    if (!cell) {
                                        return (
                                            <div
                                                key={`${row.rowKey}-${column.key}`}
                                                className="rounded-2xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400 dark:border-white/10 dark:text-gray-500"
                                            >
                                                <div className="font-semibold">{column.label}</div>
                                                <div className="mt-1">-</div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={`${row.rowKey}-${column.key}`}
                                            className={`rounded-2xl border px-4 py-3 text-sm ${getCellClass(cell)}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate font-semibold">
                                                        {column.label}
                                                    </div>
                                                    <div className="mt-1 text-xs opacity-80">
                                                        {getEffectiveLabel(cell)}
                                                    </div>
                                                </div>

                                                <span className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-xs font-semibold dark:bg-black/10">
                                                    {getModeLabel(cell)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {canEdit && permissions?.canEdit !== false && (
                <button
                    type="button"
                    onClick={onEdit}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
                >
                    <Pencil size={16} />
                    <span>Редактировать разрешения</span>
                </button>
            )}
        </div>
    );
}
