"use client";

import React, { useState } from "react";
import { Client } from "@/services/clientApi";
import ClientDetailsHeader from "@/components/clients/details/ClientDetailsHeader";
import ClientDetailsTabs, {
    ClientDetailsTab,
} from "@/components/clients/details/ClientDetailsTabs";
import ClientOverviewTab from "@/components/clients/details/tabs/ClientOverviewTab";
import ClientProCardTab from "@/components/clients/details/tabs/ClientProCardTab";
import ClientTabPlaceholder from "@/components/clients/details/ClientTabPlaceholder";
import ClientVisitsTab from "@/components/clients/details/tabs/ClientVisitsTab";
import ClientBonusesTab from "@/components/clients/details/tabs/ClientBonusesTab";


type ClientDetailsPanelProps = {
    client: Client;
    canEdit: boolean;
    onBack: () => void;
    onEdit: () => void;
    getAvatarColor: (name?: string) => string;
};

export default function ClientDetailsPanel({
    client,
    canEdit,
    onBack,
    onEdit,
    getAvatarColor,
}: ClientDetailsPanelProps) {
    const [activeTab, setActiveTab] = useState<ClientDetailsTab>("overview");

    const renderTabContent = () => {
        switch (activeTab) {
            case "overview":
                return <ClientOverviewTab client={client} canEdit={canEdit} onEdit={onEdit} />;
            case "visits":
                return <ClientVisitsTab client={client} />;
            case "bonuses":
                return <ClientBonusesTab client={client} canEdit={canEdit} />;
            case "proCard":
                return <ClientProCardTab client={client} canEdit={canEdit} />;
            case "notes":
                return (
                    <ClientTabPlaceholder
                        title="Заметки в разработке"
                        description="Здесь будут собираться заметки по клиенту, чтобы не держать рабочие комментарии в общем описании."
                    />
                );
            case "referrals":
                return (
                    <ClientTabPlaceholder
                        title="Рефералы в разработке"
                        description="Позже здесь можно будет смотреть приглашения, бонусы и связи клиента с реферальной программой."
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="admin-details-panel space-y-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:shadow-none md:p-6">
            <ClientDetailsHeader
                client={client}
                onBack={onBack}
                getAvatarColor={getAvatarColor}
            />

            <ClientDetailsTabs activeTab={activeTab} onChange={setActiveTab} />

            {renderTabContent()}
        </div>
    );
}
