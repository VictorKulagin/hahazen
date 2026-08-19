"use client";

import type { NormalizedEmployeeService } from "@/hooks/useServices";
import { formatMoney } from "@/lib/currency";

type Props = {
    services: NormalizedEmployeeService[];
    currencyCode?: string | null;
    onSelect: (serviceId: number) => void;
};

export const AppointmentServicePickerList = ({
    services,
    currencyCode,
    onSelect,
}: Props) => {
    const categoryNames = Array.from(
        new Set(services.map((service) => service.group_name?.trim() || "Без категории"))
    );

    return (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-[rgb(var(--card))]">
            {categoryNames.map((categoryName) => {
                const categoryServices = services.filter(
                    (service) =>
                        (service.group_name?.trim() || "Без категории") === categoryName
                );

                return (
                    <div key={categoryName}>
                        <div className="sticky top-0 z-10 border-y border-gray-200 bg-gray-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 first:border-t-0 dark:border-white/10 dark:bg-[#102724] dark:text-white/45">
                            {categoryName}
                        </div>
                        {categoryServices.map((service) => {
                            const price = service.individual_price ?? service.base_price;

                            return (
                                <button
                                    key={service.service_id}
                                    type="button"
                                    onClick={() => onSelect(service.service_id)}
                                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-gray-100 dark:hover:bg-white/10"
                                >
                                    <span className="min-w-0 text-sm text-gray-900 dark:text-white">
                                        {service.name}
                                    </span>
                                    <span className="shrink-0 text-sm text-gray-500 dark:text-white/60">
                                        {formatMoney(price, currencyCode)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};
