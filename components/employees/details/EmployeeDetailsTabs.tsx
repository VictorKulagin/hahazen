"use client";

import React from "react";
import {
    BriefcaseBusiness,
    CalendarDays,
    ShieldCheck,
    UserRound,
} from "lucide-react";

export type EmployeeDetailsTab =
    | "overview"
    | "schedule"
    | "services"
    | "permissions";

type EmployeeDetailsTabsProps = {
    activeTab: EmployeeDetailsTab;
    onChange: (tab: EmployeeDetailsTab) => void;
};

const tabs: Array<{
    id: EmployeeDetailsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}> = [
    { id: "overview", label: "Общее", icon: UserRound },
    { id: "schedule", label: "График", icon: CalendarDays },
    { id: "services", label: "Услуги", icon: BriefcaseBusiness },
    { id: "permissions", label: "Разрешения", icon: ShieldCheck },
];

export default function EmployeeDetailsTabs({
    activeTab,
    onChange,
}: EmployeeDetailsTabsProps) {
    return (
        <div className="overflow-x-auto">
            <div className="admin-details-tabs inline-flex min-w-full gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 dark:border-white/10 dark:bg-white/[0.03]">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.id === activeTab;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChange(tab.id)}
                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                                isActive
                                    ? "bg-green-600 text-white shadow-sm"
                                    : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
