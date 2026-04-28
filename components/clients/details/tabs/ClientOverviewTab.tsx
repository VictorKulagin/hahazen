"use client";

import React from "react";
import {
    CakeIcon,
    ChatBubbleLeftRightIcon,
    CreditCardIcon,
    GiftIcon,
    IdentificationIcon,
    PhoneIcon,
    StarIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import { Pencil } from "lucide-react";
import { Client } from "@/services/clientApi";

type InfoItem = {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value?: string | number | null;
};

type ClientOverviewTabProps = {
    client: Client;
    canEdit: boolean;
    onEdit: () => void;
};

function InfoSection({ title, items }: { title: string; items: InfoItem[] }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                {title}
            </h2>

            <div className="space-y-3">
                {items.map((item, idx) => {
                    const Icon = item.icon;

                    return (
                        <div key={`${item.label}-${idx}`} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <Icon className="h-5 w-5 text-gray-400 dark:text-gray-400" />
                                <span>{item.label}</span>
                            </div>

                            <div className="text-right font-medium text-gray-900 dark:text-white">
                                {item.value || "-"}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function ClientOverviewTab({
    client,
    canEdit,
    onEdit,
}: ClientOverviewTabProps) {
    const mainInfo: InfoItem[] = [
        { icon: IdentificationIcon, label: "ID", value: client.user_id },
        { icon: UserIcon, label: "Имя", value: client.name },
        { icon: UserIcon, label: "Фамилия", value: client.last_name },
        { icon: UserIcon, label: "Отчество", value: client.patronymic },
        { icon: UserIcon, label: "Пол", value: client.gender },
    ];

    const contactInfo: InfoItem[] = [
        { icon: PhoneIcon, label: "Телефон", value: client.phone },
        { icon: UserIcon, label: "Email", value: client.email },
    ];

    const extraInfo: InfoItem[] = [
        { icon: StarIcon, label: "VIP", value: client.vip === 1 ? "Да" : "Нет" },
        { icon: GiftIcon, label: "Скидка", value: client.discount },
        { icon: CreditCardIcon, label: "Номер карты", value: client.card_number },
        { icon: CakeIcon, label: "День рождения", value: client.birth_date },
        {
            icon: CakeIcon,
            label: "Запрет онлайн",
            value: client.forbid_online_booking === 1 ? "Да" : "Нет",
        },
        { icon: ChatBubbleLeftRightIcon, label: "Комментарий", value: client.comment },
    ];

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <InfoSection title="Основное" items={mainInfo} />
                <InfoSection title="Контакты" items={contactInfo} />

                <div className="xl:col-span-2">
                    <InfoSection title="Дополнительно" items={extraInfo} />
                </div>
            </div>

            {canEdit && (
                <button
                    type="button"
                    onClick={onEdit}
                    className="flex w-full items-center justify-center space-x-2 rounded-xl bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
                >
                    <Pencil size={16} />
                    <span>Редактировать</span>
                </button>
            )}
        </div>
    );
}
