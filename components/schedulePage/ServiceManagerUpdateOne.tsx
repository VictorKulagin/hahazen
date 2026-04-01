"use client";
import React, { useState, useEffect } from "react";
import { useUpdateService, useServices } from "@/hooks/useServices";

type Props = {
    service: {
        id: number;
        name: string;
        base_price: number;
        duration_minutes: number;
    } | null;
    onClose: () => void;
};

export const ServiceManagerUpdateOne: React.FC<Props> = ({ service, onClose }) => {
    const { refetch } = useServices();
    const { mutateAsync: updateService, isPending } = useUpdateService();

    // 🧩 всегда вызываем хуки, даже если service = null
    const [name, setName] = useState(service?.name ?? "");
    const [basePrice, setBasePrice] = useState<number | string>(service?.base_price ?? "");
    const [duration, setDuration] = useState<number | string>(service?.duration_minutes ?? "");
    const [success, setSuccess] = useState(false);

    const [submitError, setSubmitError] = useState<string | null>(null);


    // если service обновился (например, выбрали новую услугу)
    useEffect(() => {
        if (service) {
            setName(service.name);
            setBasePrice(service.base_price);
            setDuration(service.duration_minutes);
        }
    }, [service]);


    useEffect(() => {
        if (service) {
            setName(service.name);
            setBasePrice(service.base_price);
            setDuration(service.duration_minutes);
            setSubmitError(null);
            setSuccess(false);
        }
    }, [service]);


    const getErrorMessage = (err: any) => {
        const msg =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message;

        if (!msg) return "Не удалось сохранить услугу. Попробуйте ещё раз.";
        return String(msg);
    };

    const handleSave = async () => {
        if (!service) return;
        //if (!name.trim() || !basePrice || !duration) return;

        if (!name.trim() || !basePrice || !duration) {
            setSubmitError("Заполните название, цену и длительность.");
            return;
        }

        setSubmitError(null);

        try {
            await updateService({
                id: service.id,
                data: {
                    name: name.trim(),
                    base_price: Number(basePrice),
                    duration_minutes: Number(duration),
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

    // ✅ теперь условный рендер ниже, а не до хуков
    if (!service) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
            <div className="bg-white w-full sm:w-[28rem] h-full shadow-lg flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-black">Редактировать услугу</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 text-black">
                    <div>
                        <label className="block font-semibold mb-1">Название</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold mb-1">Длительность (мин)</label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold mb-1">Цена (₽)</label>
                        <input
                            type="number"
                            value={basePrice}
                            onChange={(e) => setBasePrice(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>

                    {success && (
                        <p className="text-green-600 font-medium mt-2">
                            ✅ Изменения сохранены!
                        </p>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">

                    {submitError && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {submitError}
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {isPending ? "Сохраняем..." : "Сохранить"}
                    </button>
                </div>
            </div>
        </div>
    );
};
