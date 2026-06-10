"use client";

import React from "react";
import {
    BadgeCheck,
    BriefcaseBusiness,
    CalendarDays,
    IdCard,
    Mail,
    Pencil,
    Phone,
    Sparkles,
    UserRound,
} from "lucide-react";
import { Employee } from "@/services/employeeApi";
import { LEVEL_OPTIONS } from "@/lib/employee-levels";
import { normalizePhoneInput } from "@/components/utils/phone";

type InfoItem = {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value?: string | number | null;
};

type EmployeeOverviewTabProps = {
    employee: Employee;
    canEdit: boolean;
    onEdit: () => void;
};

const ROLE_LABELS: Record<string, string> = {
    gd: "Руководитель",
    admin: "Администратор",
    master: "Мастер",
};

function getDisplayValue(value?: string | number | null) {
    return value === 0 || value ? value : "-";
}

function getLevelLabel(value?: string | null) {
    return (
        LEVEL_OPTIONS.find((option) => option.value === (value == null ? "" : String(value)))
            ?.label ?? "-"
    );
}

function InfoSection({ title, items }: { title: string; items: InfoItem[] }) {
    return (
        <div className="admin-details-section rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                {title}
            </h2>

            <div className="space-y-3">
                {items.map((item, idx) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={`${item.label}-${idx}`}
                            className="flex items-center justify-between gap-4"
                        >
                            <div className="flex min-w-0 items-center gap-2 text-gray-500 dark:text-gray-400">
                                <Icon className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-400" />
                                <span className="truncate">{item.label}</span>
                            </div>

                            <div className="min-w-0 max-w-[62%] truncate text-right font-medium text-gray-900 dark:text-white">
                                {getDisplayValue(item.value)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function EmployeeOverviewTab({
    employee,
    canEdit,
    onEdit,
}: EmployeeOverviewTabProps) {
    const roleLabel = ROLE_LABELS[employee.role] ?? employee.role;

    const mainInfo: InfoItem[] = [
        { icon: IdCard, label: "ID", value: employee.id },
        { icon: UserRound, label: "Имя", value: employee.name },
        { icon: UserRound, label: "Фамилия", value: employee.last_name },
        { icon: BriefcaseBusiness, label: "Специализация", value: employee.specialty },
        { icon: Sparkles, label: "Уровень", value: getLevelLabel(employee.lvl) },
        { icon: BadgeCheck, label: "Роль", value: roleLabel },
    ];

    const contactInfo: InfoItem[] = [
        { icon: Phone, label: "Телефон", value: normalizePhoneInput(employee.phone ?? "") },
        { icon: Mail, label: "Email", value: employee.email },
    ];

    const workInfo: InfoItem[] = [
        { icon: IdCard, label: "Филиал", value: employee.branch_id },
        {
            icon: BadgeCheck,
            label: "Онлайн-запись",
            value: employee.online_booking === 1 ? "Да" : "Нет",
        },
        { icon: CalendarDays, label: "Дата найма", value: employee.hire_date },
        { icon: BriefcaseBusiness, label: "Описание", value: employee.description },
    ];

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <InfoSection title="Основное" items={mainInfo} />
                <InfoSection title="Контакты" items={contactInfo} />

                <div className="xl:col-span-2">
                    <InfoSection title="Работа" items={workInfo} />
                </div>
            </div>

            {canEdit && (
                <button
                    type="button"
                    onClick={onEdit}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
                >
                    <Pencil size={16} />
                    <span>Редактировать</span>
                </button>
            )}
        </div>
    );
}
