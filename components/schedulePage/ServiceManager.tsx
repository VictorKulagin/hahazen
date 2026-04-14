// /components/schedulePage/ServiceManager.tsx
"use client";
import React, { useState } from "react";
import { useCreateService, useServices } from "@/hooks/useServices";

type Props = {
    branchId: number;
    onClose: () => void;
};

export const ServiceManager: React.FC<Props> = ({ branchId, onClose }) => {
    const { refetch } = useServices(); // ✅ используем refetch для обновления списка
    const { mutateAsync: createService, isPending } = useCreateService();

    const [name, setName] = useState("");
    const [price, setPrice] = useState<number | string>("");
    const [duration, setDuration] = useState<number | string>(30);
    const [success, setSuccess] = useState(false);

    const [submitError, setSubmitError] = useState<string | null>(null);

    const inputClass = "w-full px-4 py-3 rounded-xl \
border border-gray-200 dark:border-white/10 \
bg-white dark:bg-white/5 \
text-black dark:text-white \
transition \
focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500";

    const getErrorMessage = (err: any) => {
        const msg =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message;

        if (!msg) return "Не удалось добавить услугу. Попробуйте ещё раз.";
        return String(msg);
    };
    const handleSave = async () => {
        //if (!name.trim() || !price || !duration) return;

        if (!name.trim() || !price || !duration) {
            setSubmitError("Заполните название, цену и длительность.");
            return;
        }

        setSubmitError(null);


        try {
            await createService({
                branch_id: branchId,
                name: name.trim(),
                base_price: Number(price),
                duration_minutes: Number(duration),
                online_booking: 1,
                online_booking_name: name.trim(),
                online_booking_description: "",
            });

            setSuccess(true);
            setName("");
            setPrice("");
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
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
            <div className="bg-[rgb(var(--background))] text-[rgb(var(--foreground))] w-full sm:w-[28rem] h-full shadow-lg rounded-l-2xl rounded-tr-2xl overflow-hidden flex flex-col">
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

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₽)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Введите цену"
                            className={inputClass}
                        />
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
    );
};
