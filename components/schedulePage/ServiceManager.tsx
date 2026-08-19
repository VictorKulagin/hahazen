// /components/schedulePage/ServiceManager.tsx
"use client";
import React, { useState } from "react";
import { useCreateService, useServices } from "@/hooks/useServices";
import { normalizeCurrencyCode } from "@/lib/currency";
import { getApiErrorMessage } from "@/services/apiError";
import AdminDialogPortal from "@/components/AdminDialogPortal";
import { ServiceGroupSelect } from "@/components/schedulePage/ServiceGroupSelect";

type Props = {
    branchId: number;
    onClose: () => void;
    currencyCode?: string | null;
};

type PriceMode = "single" | "range";

export const ServiceManager: React.FC<Props> = ({ branchId, onClose, currencyCode }) => {
    const { refetch } = useServices(branchId); // ✅ используем refetch для обновления списка
    const { mutateAsync: createService, isPending } = useCreateService();

    const [name, setName] = useState("");
    const [price, setPrice] = useState<number | string>("");
    const [priceTo, setPriceTo] = useState<number | string>("");
    const [priceMode, setPriceMode] = useState<PriceMode>("single");
    const [duration, setDuration] = useState<number | string>(30);
    const [serviceGroupId, setServiceGroupId] = useState<number | null>(null);
    const [success, setSuccess] = useState(false);

    const [submitError, setSubmitError] = useState<string | null>(null);

    const inputClass = "w-full px-4 py-3 rounded-xl \
border border-gray-200 dark:border-white/10 \
bg-white dark:bg-white/5 \
text-black dark:text-white \
transition \
focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500";

    const getErrorMessage = (err: unknown) =>
        getApiErrorMessage(err, "Не удалось добавить услугу. Попробуйте ещё раз.");
    const handleSave = async () => {
        const basePrice = Number(price);
        const upperPrice = Number(priceTo);
        const durationMinutes = Number(duration);

        if (!name.trim() || price === "" || duration === "") {
            setSubmitError("Заполните название, цену и длительность.");
            return;
        }

        if (!Number.isInteger(basePrice) || basePrice < 0) {
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
                !Number.isInteger(upperPrice) ||
                upperPrice < basePrice)
        ) {
            setSubmitError("Верхняя цена должна быть целым числом не меньше начальной.");
            return;
        }

        setSubmitError(null);


        try {
            await createService({
                branch_id: branchId,
                name: name.trim(),
                service_group_id: serviceGroupId,
                group_name: null,
                base_price: basePrice,
                price_to: priceMode === "range" ? upperPrice : null,
                duration_minutes: durationMinutes,
                online_booking: 1,
                online_booking_name: name.trim(),
                online_booking_description: "",
            });

            setSuccess(true);
            setName("");
            setPrice("");
            setPriceTo("");
            setPriceMode("single");
            setDuration(30);

            // ✅ обновляем кэш, чтобы список услуг сразу обновился
            await refetch();

            // через секунду закрываем окно
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 2000);
        } catch (err) {
            console.error("Ошибка при добавлении услуги:", err);
            setSubmitError(getErrorMessage(err));
        }
    };

    return (
        <AdminDialogPortal onEscape={onClose}>
        <div className="admin-dialog-overlay fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
            <div className="admin-dialog-panel bg-[rgb(var(--background))] text-[rgb(var(--foreground))] w-full sm:w-[28rem] h-full shadow-lg rounded-l-2xl rounded-tr-2xl overflow-hidden flex flex-col">
                {/* Заголовок */}
                <div className="sticky top-0 z-20 border-b border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[rgb(var(--card))]/95 backdrop-blur-md">
                    <div className="flex items-start justify-between px-4 py-0">
                        <div className="flex items-start gap-3 min-w-0">
                            <span className="mt-[1.3rem] h-2 w-2 rounded-full bg-emerald-400 shrink-0" />

                            <h2 className="text-[17px] leading-[2.75] font-semibold text-[rgb(var(--foreground))] truncate">
                                Создание услуги
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

                {/* Форма */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 text-black dark:text-white">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Название услуги</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Например: Массаж спины"
                            className={inputClass}
                        />
                    </div>

                    <ServiceGroupSelect
                        branchId={branchId}
                        value={serviceGroupId}
                        onChange={setServiceGroupId}
                        inputClass={inputClass}
                    />

                    <div className="space-y-3">
                        <div>
                            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Стоимость
                            </span>
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
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0"
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
                                        min={typeof price === "number" ? price : Number(price) || 0}
                                        step={1}
                                        value={priceTo}
                                        onChange={(e) => setPriceTo(e.target.value)}
                                        placeholder="0"
                                        className={inputClass}
                                    />
                                </label>
                            )}
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            При диапазоне точная стоимость указывается в записи клиента.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Длительность (мин)</label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="30"
                            className={inputClass}
                        />
                    </div>

                    {success && (
                        <p className="text-green-600 font-medium mt-2">
                            ✅ Услуга успешно добавлена!
                        </p>
                    )}
                </div>

                {/* Кнопки */}
                <div className="sticky bottom-0 z-20 border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[rgb(var(--card))]/95 backdrop-blur-md px-4 py-4">

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
                            {isPending ? "Сохранение..." : "Сохранить"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </AdminDialogPortal>
    );
};
