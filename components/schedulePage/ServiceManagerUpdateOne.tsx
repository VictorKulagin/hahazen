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

    const inputClass = "w-full px-4 py-3 rounded-xl \
border border-gray-200 dark:border-white/10 \
bg-white dark:bg-white/5 \
text-black dark:text-white \
transition \
focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500";

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
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end"> {/*backdrop-blur-sm*/}
            <div className="bg-[rgb(var(--background))] text-[rgb(var(--foreground))] w-full sm:w-[28rem] h-fullshadow-lg rounded-l-2xl rounded-tr-2xl overflow-hidden flex flex-col">
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Длительность (мин)</label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₽)</label>
                        <input
                            type="number"
                            value={basePrice}
                            onChange={(e) => setBasePrice(e.target.value)}
                            className={inputClass}
                        />
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
    );
};
