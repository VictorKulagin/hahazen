"use client";

import React from "react";
import {
    ClipboardPlus,
    FileText,
    Gift,
    LayoutGrid,
    UserRound,
    Users,
} from "lucide-react";

export type ClientDetailsTab =
    | "overview"
    | "visits"
    | "bonuses"
    | "proCard"
    | "notes"
    | "referrals";

type ClientDetailsTabsProps = {
    activeTab: ClientDetailsTab;
    onChange: (tab: ClientDetailsTab) => void;
};

const tabs: Array<{
    id: ClientDetailsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}> = [
    { id: "overview", label: "Общее", icon: UserRound },
    { id: "visits", label: "Визиты", icon: ClipboardPlus },
    { id: "proCard", label: "Профкарта", icon: LayoutGrid },
    { id: "bonuses", label: "Бонусы", icon: Gift },
    //{ id: "notes", label: "Заметки", icon: FileText },
    //{ id: "referrals", label: "Рефералы", icon: Users },
];

export default function ClientDetailsTabs({
    activeTab,
    onChange,
}: ClientDetailsTabsProps) {
    return (
        <div className="overflow-x-auto">
            <div className="inline-flex min-w-full gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 dark:border-white/10 dark:bg-white/[0.03]">
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
