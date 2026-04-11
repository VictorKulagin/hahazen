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
            <div className="bg-white dark:bg-[rgb(var(--background))] w-full sm:w-[28rem] h-full shadow-lg flex flex-col">
                {/* Заголовок */}
                <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-[rgb(var(--card))]">
                    <h2 className="text-lg font-bold text-black dark:text-white">Создать услуги</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                        ✕
                    </button>
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
                <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[rgb(var(--card))] flex justify-end gap-2">

                    {submitError && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {submitError}
                        </div>
                    )}

                    <button
                        type="button" // ✅ предотвращает случайный submit формы
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 dark:bg-white/10 text-black dark:text-white rounded hover:bg-gray-400 dark:hover:bg-white/20"
                    >
                        Закрыть
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isPending}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {isPending ? "Сохранение..." : "Сохранить"}
                    </button>
                </div>
            </div>
        </div>
    );
};
