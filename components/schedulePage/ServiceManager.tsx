"use client";
import React, { useState } from "react";
import { useServices, useCreateService, useDeleteService, useUpdateService } from "@/hooks/useServices";

type Props = {
    branchId: number;
    onClose: () => void;
};

export const ServiceManager: React.FC<Props> = ({ branchId, onClose }) => {
    const { data: services = [], refetch } = useServices();
    const { mutateAsync: createService } = useCreateService();
    const { mutateAsync: deleteService } = useDeleteService();
    const { mutateAsync: updateService } = useUpdateService();

    const [newName, setNewName] = useState("");
    const [newPrice, setNewPrice] = useState(0);
    const [newDuration, setNewDuration] = useState(30);

    const [edited, setEdited] = useState<{ [key: number]: { name: string; base_price: number; duration_minutes: number } }>({});

    const handleAdd = async () => {
        if (!newName) return;
        await createService({
            branch_id: branchId,
            name: newName,
            base_price: newPrice,
            duration_minutes: newDuration,
            online_booking: 1,
            online_booking_name: newName,
            online_booking_description: "",
        });
        setNewName("");
        setNewPrice(0);
        setNewDuration(30);
        refetch();
    };

    const handleDelete = async (id: number) => {
        if (confirm("Удалить услугу?")) {
            await deleteService(id);
            refetch();
        }
    };

    const handleSaveAll = async () => {
        for (const id of Object.keys(edited)) {
            const e = edited[Number(id)];
            await updateService({ id: Number(id), data: e });
        }
        refetch();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
            {/* Боковая панель */}
            <div className="bg-white w-full sm:w-[28rem] h-full shadow-lg flex flex-col">
                {/* Заголовок */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold">Услуги</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
                </div>

                {/* Содержимое */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* === Новая услуга === */}
                    <div className="space-y-2 border-b pb-4">
                        <h3 className="font-semibold">Новая услуга</h3>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Название"
                            className="w-full p-2 border rounded"
                        />
                        <input
                            type="number"
                            value={newPrice}
                            onChange={(e) => setNewPrice(Number(e.target.value))}
                            placeholder="Цена"
                            className="w-full p-2 border rounded"
                        />
                        <input
                            type="number"
                            value={newDuration}
                            onChange={(e) => setNewDuration(Number(e.target.value))}
                            placeholder="Минуты"
                            className="w-full p-2 border rounded"
                        />
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Добавить
                        </button>
                    </div>

                    {/* === Существующие услуги === */}
                    <div>
                        <h3 className="font-semibold mb-2">Существующие услуги</h3>
                        <div className="space-y-2">
                            {services.map((s) => (
                                <div key={s.id} className="flex items-center gap-2 border p-2 rounded">
                                    <input
                                        type="text"
                                        value={edited[s.id]?.name ?? s.name}
                                        onChange={(e) =>
                                            setEdited((prev) => ({
                                                ...prev,
                                                [s.id]: {
                                                    ...prev[s.id],
                                                    name: e.target.value,
                                                    base_price: prev[s.id]?.base_price ?? s.base_price,
                                                    duration_minutes: prev[s.id]?.duration_minutes ?? s.duration_minutes
                                                },
                                            }))
                                        }
                                        className="flex-1 p-1 border rounded"
                                    />
                                    <input
                                        type="number"
                                        value={edited[s.id]?.base_price ?? s.base_price}
                                        onChange={(e) =>
                                            setEdited((prev) => ({
                                                ...prev,
                                                [s.id]: {
                                                    ...prev[s.id],
                                                    name: prev[s.id]?.name ?? s.name,
                                                    base_price: Number(e.target.value),
                                                    duration_minutes: prev[s.id]?.duration_minutes ?? s.duration_minutes
                                                },
                                            }))
                                        }
                                        className="w-20 p-1 border rounded"
                                    />
                                    <input
                                        type="number"
                                        value={edited[s.id]?.duration_minutes ?? s.duration_minutes}
                                        onChange={(e) =>
                                            setEdited((prev) => ({
                                                ...prev,
                                                [s.id]: {
                                                    ...prev[s.id],
                                                    name: prev[s.id]?.name ?? s.name,
                                                    base_price: prev[s.id]?.base_price ?? s.base_price,
                                                    duration_minutes: Number(e.target.value)
                                                },
                                            }))
                                        }
                                        className="w-20 p-1 border rounded"
                                    />
                                    <button
                                        onClick={() => handleDelete(s.id)}
                                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        ❌
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Кнопки */}
                <div className="p-4 border-t bg-white flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                        Закрыть
                    </button>
                    <button
                        onClick={handleSaveAll}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};
