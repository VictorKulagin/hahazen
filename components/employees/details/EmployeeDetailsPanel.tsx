"use client";

import React, { useState } from "react";
import { Employee } from "@/services/employeeApi";
import EmployeeDetailsHeader from "@/components/employees/details/EmployeeDetailsHeader";
import EmployeeDetailsTabs, {
    EmployeeDetailsTab,
} from "@/components/employees/details/EmployeeDetailsTabs";
import EmployeeOverviewTab from "@/components/employees/details/tabs/EmployeeOverviewTab";
import EmployeeScheduleTab from "@/components/employees/details/tabs/EmployeeScheduleTab";
import EmployeeServicesTab from "@/components/employees/details/tabs/EmployeeServicesTab";
import EmployeePermissionsTab from "@/components/employees/details/tabs/EmployeePermissionsTab";

type EmployeeDetailsPanelProps = {
    employee: Employee;
    canEdit: boolean;
    onBack: () => void;
    onEdit: () => void;
    getAvatarColor: (name?: string) => string;
    currencyCode?: string | null;
};

export default function EmployeeDetailsPanel({
    employee,
    canEdit,
    onBack,
    onEdit,
    getAvatarColor,
    currencyCode,
}: EmployeeDetailsPanelProps) {
    const [activeTab, setActiveTab] = useState<EmployeeDetailsTab>("overview");

    const renderTabContent = () => {
        switch (activeTab) {
            case "overview":
                return (
                    <EmployeeOverviewTab
                        employee={employee}
                        canEdit={canEdit}
                        onEdit={onEdit}
                    />
                );
            case "schedule":
                return (
                    <EmployeeScheduleTab
                        employee={employee}
                        canEdit={canEdit}
                        onEdit={onEdit}
                    />
                );
            case "services":
                return (
                    <EmployeeServicesTab
                        employee={employee}
                        canEdit={canEdit}
                        onEdit={onEdit}
                        currencyCode={currencyCode}
                    />
                );
            case "permissions":
                return (
                    <EmployeePermissionsTab
                        employee={employee}
                        canEdit={canEdit}
                        onEdit={onEdit}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="admin-details-panel space-y-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:shadow-none md:p-6">
            <EmployeeDetailsHeader
                employee={employee}
                onBack={onBack}
                getAvatarColor={getAvatarColor}
            />

            <EmployeeDetailsTabs activeTab={activeTab} onChange={setActiveTab} />

            {renderTabContent()}
        </div>
    );
}
