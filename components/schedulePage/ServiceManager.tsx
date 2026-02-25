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
            <div className="bg-white w-full sm:w-[28rem] h-full shadow-lg flex flex-col">
                {/* Заголовок */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-black">Услуги</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        ✕
                    </button>
                </div>

                {/* Форма */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 text-black">
                    <div className="space-y-2">
                        <label className="font-semibold block">Название услуги</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Например: Массаж спины"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-semibold block">Цена (₽)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Введите цену"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-semibold block">Длительность (мин)</label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="30"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    {success && (
                        <p className="text-green-600 font-medium mt-2">
                            ✅ Услуга успешно добавлена!
                        </p>
                    )}
                </div>

                {/* Кнопки */}
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">

                    {submitError && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {submitError}
                        </div>
                    )}

                    <button
                        type="button" // ✅ предотвращает случайный submit формы
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
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
