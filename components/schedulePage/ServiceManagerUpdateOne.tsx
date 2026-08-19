"use client";
import React, { useState } from "react";
import { useUpdateService, useServices } from "@/hooks/useServices";
import { normalizeCurrencyCode } from "@/lib/currency";
import { getApiErrorMessage } from "@/services/apiError";
import AdminDialogPortal from "@/components/AdminDialogPortal";
import { ServiceGroupSelect } from "@/components/schedulePage/ServiceGroupSelect";

type PriceMode = "single" | "range";

type Props = {
    service: {
        id: number;
        branch_id?: number;
        name: string;
        service_group_id?: number | null;
        base_price: number;
        price_to?: number | null;
        duration_minutes: number;
    };
    onClose: () => void;
    currencyCode?: string | null;
};

export const ServiceManagerUpdateOne: React.FC<Props> = ({ service, onClose, currencyCode }) => {
    const { refetch } = useServices(service.branch_id);
    const { mutateAsync: updateService, isPending } = useUpdateService();

    // 🧩 всегда вызываем хуки, даже если service = null
    const [name, setName] = useState(service.name);
    const [basePrice, setBasePrice] = useState<number | string>(service.base_price);
    const [priceTo, setPriceTo] = useState<number | string>(service.price_to ?? "");
    const [priceMode, setPriceMode] = useState<PriceMode>(
        service.price_to == null ? "single" : "range"
    );
    const [duration, setDuration] = useState<number | string>(service.duration_minutes);
    const [serviceGroupId, setServiceGroupId] = useState<number | null>(
        service.service_group_id ?? null
    );
    const [success, setSuccess] = useState(false);

    const [submitError, setSubmitError] = useState<string | null>(null);

    const inputClass = "w-full px-4 py-3 rounded-xl \
border border-gray-200 dark:border-white/10 \
bg-white dark:bg-white/5 \
text-black dark:text-white \
transition \
focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500";

    const getErrorMessage = (err: unknown) =>
        getApiErrorMessage(err, "Не удалось сохранить услугу. Попробуйте ещё раз.");

    const handleSave = async () => {
        const numericBasePrice = Number(basePrice);
        const numericPriceTo = Number(priceTo);
        const durationMinutes = Number(duration);

        if (!name.trim() || basePrice === "" || duration === "") {
            setSubmitError("Заполните название, цену и длительность.");
            return;
        }

        if (!Number.isInteger(numericBasePrice) || numericBasePrice < 0) {
            setSubmitError("Цена должна быть целым числом не меньше 0.");
            return;
        }

        if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
            setSubmitError("Длительность должна быть целым числом больше 0.");
            return;
        }

        if (
            priceMode === "range" &&
            (priceTo === "" ||
                !Number.isInteger(numericPriceTo) ||
                numericPriceTo < numericBasePrice)
        ) {
            setSubmitError("Верхняя цена должна быть целым числом не меньше начальной.");
            return;
        }

        setSubmitError(null);

        try {
            await updateService({
                id: service.id,
                data: {
                    name: name.trim(),
                    service_group_id: serviceGroupId,
                    group_name: null,
                    base_price: numericBasePrice,
                    price_to: priceMode === "range" ? numericPriceTo : null,
                    duration_minutes: durationMinutes,
                },
            });

            await refetch();
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 2000);
        } catch (err) {
            console.error("Ошибка при обновлении услуги:", err);
            setSubmitError(getErrorMessage(err)); // ✅ вместо молчания
        }
    };

    return (
        <AdminDialogPortal onEscape={onClose}>
        <div className="admin-dialog-overlay fixed inset-0 z-50 bg-black/50 flex justify-end"> {/*backdrop-blur-sm*/}
            <div className="admin-dialog-panel bg-[rgb(var(--background))] text-[rgb(var(--foreground))] w-full sm:w-[28rem] h-full shadow-lg rounded-l-2xl rounded-tr-2xl overflow-hidden flex flex-col">
                <div className="sticky top-0 z-20 border-b border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[rgb(var(--card))]/95 backdrop-blur-md">
                    <div className="flex items-start justify-between px-4 py-0">
                        <div className="flex items-start gap-3 min-w-0">
                            <span className="mt-[1.3rem] h-2 w-2 rounded-full bg-emerald-400 shrink-0" />

                            <h2 className="text-[17px] leading-[2.75] font-semibold text-[rgb(var(--foreground))] truncate">
                                Редактирование услуги
                            </h2>
                        </div>

                        <button
                            onClick={onClose}
                            className="
        mt-[8px]
        flex h-9 w-9 items-center justify-center
        rounded-xl
        border border-gray-200 dark:border-white/10
        bg-gray-100 text-gray-500
        hover:bg-gray-200 hover:text-gray-700
        dark:bg-white/5 dark:text-white/60
        dark:hover:bg-white/10 dark:hover:text-white
        transition
      "
                        >
                            ✕
                        </button>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[rgb(var(--foreground))]">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <ServiceGroupSelect
                        branchId={service.branch_id}
                        value={serviceGroupId}
                        onChange={setServiceGroupId}
                        inputClass={inputClass}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Длительность (мин)</label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 dark:bg-white/5">
                            {(["single", "range"] as PriceMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setPriceMode(mode)}
                                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                        priceMode === mode
                                            ? "bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white"
                                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                                    }`}
                                >
                                    {mode === "single" ? "Одна цена" : "Диапазон"}
                                </button>
                            ))}
                        </div>

                        <div className={priceMode === "range" ? "grid grid-cols-2 gap-3" : ""}>
                            <label>
                                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {priceMode === "range" ? "Цена от" : "Цена"} ({normalizeCurrencyCode(currencyCode)})
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={basePrice}
                                    onChange={(e) => setBasePrice(e.target.value)}
                                    className={inputClass}
                                />
                            </label>

                            {priceMode === "range" && (
                                <label>
                                    <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Цена до ({normalizeCurrencyCode(currencyCode)})
                                    </span>
                                    <input
                                        type="number"
                                        min={typeof basePrice === "number" ? basePrice : Number(basePrice) || 0}
                                        step={1}
                                        value={priceTo}
                                        onChange={(e) => setPriceTo(e.target.value)}
                                        className={inputClass}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {success && (
                        <p className="text-green-600 font-medium mt-2">
                            ✅ Изменения сохранены!
                        </p>
                    )}
                </div>

                <div className="sticky bottom-0 z-20 border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[rgb(var(--card))]/95  px-4 py-4"> {/*backdrop-blur-md*/}

                    {submitError && (
                        <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                            {submitError}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="
        h-11 px-5 rounded-xl
        border border-gray-300
        bg-white text-gray-700
        hover:bg-gray-100
        dark:border-white/10
        dark:bg-white/[0.03]
        dark:text-[rgb(var(--foreground))]
        dark:hover:bg-white/10
        transition
      "
                        >
                            Закрыть
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className={`
        h-11 px-5 rounded-xl font-medium text-white transition
        ${
                                isPending
                                    ? "bg-green-500/70 cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700"
                            }
      `}
                        >
                            {isPending ? "Сохраняем..." : "Сохранить"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </AdminDialogPortal>
    );
};
