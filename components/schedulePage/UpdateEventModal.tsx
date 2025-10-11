"use client";
import React, { useEffect, useState } from "react";
import { useEmployeeServices } from "@/hooks/useServices";
import { useUpdateAppointment, useDeleteAppointment } from "@/hooks/useAppointments";
import { useUpdateClient } from "@/hooks/useClient";

interface UpdateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventData: {
        id: number;
        date: string;
        client?: { id: number; name: string; last_name?: string; phone?: string };
        services: { id: number; qty: number }[];
        timeStart: string;
        timeEnd: string;
        employeeId: number;
    } | null;
}

const UpdateEventModal: React.FC<UpdateEventModalProps> = ({ isOpen, onClose, eventData }) => {
    const employeeId = eventData?.employeeId ?? undefined;

    // Подгружаем ВСЕ услуги сотрудника
    const { data: services = [], isLoading } = useEmployeeServices(employeeId);

    const [timeStart, setTimeStart] = useState("09:00");
    const [timeEnd, setTimeEnd] = useState("09:30");
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [isEditingClient, setIsEditingClient] = useState(false);

    const [selectedServices, setSelectedServices] = useState<{ id: number; qty: number }[]>([]);

    const { mutateAsync: updateAppointmentMutate, isPending: isUpdating } = useUpdateAppointment();
    const { mutateAsync: updateClientMutate, isPending: updatingClient } = useUpdateClient();
    const { mutateAsync: deleteAppointmentMutate, isPending: isDeleting } = useDeleteAppointment();

    // Нормализация при открытии модалки
    useEffect(() => {
        if (!eventData || !isOpen) return;

        setName(eventData.client?.name ?? "");
        setLastName(eventData.client?.last_name ?? "");
        setPhone(eventData.client?.phone ?? "");

        // всегда храним service_id
        setSelectedServices(
            (eventData.services ?? []).map((s) => ({
                id: s.id,
                qty: s.qty ?? 1,
            }))
        );

        setTimeStart(eventData.timeStart);
        setTimeEnd(eventData.timeEnd);
        setIsEditingClient(false);
    }, [eventData, isOpen]);

    const toggleService = (serviceId: number) => {
        setSelectedServices((prev) =>
            prev.some((s) => s.id === serviceId)
                ? prev.filter((s) => s.id !== serviceId)
                : [...prev, { id: serviceId, qty: 1 }]
        );
    };
    const updateQty = (serviceId: number, qty: number) => {
        if (qty < 1) qty = 1;
        setSelectedServices((prev) =>
            prev.map((s) => (s.id === serviceId ? { ...s, qty } : s))
        );
    };

    const adjustTime = (field: "start" | "end", delta: number) => {
        const value = field === "start" ? timeStart : timeEnd;
        const [h, m] = value.split(":").map(Number);
        let total = h * 60 + m + delta;
        if (total < 0) total = 0;
        if (total >= 24 * 60) total = 24 * 60 - 1;
        const hh = String(Math.floor(total / 60)).padStart(2, "0");
        const mm = String(total % 60).padStart(2, "0");
        field === "start" ? setTimeStart(`${hh}:${mm}`) : setTimeEnd(`${hh}:${mm}`);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventData) return;

        if (isEditingClient && eventData.client?.id) {
            await updateClientMutate({
                id: eventData.client.id,
                data: { name, last_name: lastName, phone },
            });
        }

        await updateAppointmentMutate({
            id: eventData.id,
            date: eventData.date,
            time_start: timeStart,
            time_end: timeEnd,
            employee_id: eventData.employeeId,
            client_id: eventData.client?.id,
            services: selectedServices.map((s) => ({
                service_id: s.id,
                qty: s.qty,
            })),
        });

        onClose();
    };

    const handleDelete = async () => {
        if (!eventData) return;
        if (!confirm("Вы уверены, что хотите удалить эту запись?")) return;

        try {
            await deleteAppointmentMutate(eventData.id);
            onClose();
        } catch (err) {
            console.error("Ошибка удаления:", err);
            alert("Не удалось удалить запись");
        }
    };

    if (!isOpen || !eventData) return null;

    return (
        <div className={`fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50`}>
            <div className={`bg-white w-[28rem] shadow-lg h-full transform transition-transform`}>
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow p-1"
                    aria-label="Закрыть окно"
                >
                    ✕
                </button>
                <div className="bg-white rounded p-6 w-full max-w-md text-black">
                    <h2 className="text-lg font-bold mb-4">Редактировать запись</h2>

                    <form onSubmit={handleSave} className="space-y-4">
                        {/* Клиент */}
                        {!isEditingClient ? (
                            <div className="bg-gray-50 p-4 rounded-xl border">
                                <div className="font-semibold">{name}</div>
                                {lastName && <div className="text-sm">Фамилия: {lastName}</div>}
                                {phone && <div className="text-sm">Телефон: {phone}</div>}
                                <button
                                    type="button"
                                    onClick={() => setIsEditingClient(true)}
                                    className="text-blue-600 hover:underline text-sm mt-2"
                                >
                                    ✏️ Редактировать клиента
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded" placeholder="Имя" />
                                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full p-2 border rounded" placeholder="Фамилия" />
                                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border rounded" placeholder="Телефон" />
                                <button type="button" onClick={() => setIsEditingClient(false)} className="text-gray-500 hover:underline text-sm">
                                    Отмена
                                </button>
                            </div>
                        )}

                        {/* Время */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-semibold">Время начала</label>
                                <input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className="w-full p-2 border rounded" />
                                <div className="flex justify-between mt-2">
                                    <button type="button" onClick={() => adjustTime("start", -15)} className="px-2 py-1 text-xs bg-gray-200 rounded">−15 мин</button>
                                    <button type="button" onClick={() => adjustTime("start", 15)} className="px-2 py-1 text-xs bg-gray-200 rounded">+15 мин</button>
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold">Время окончания</label>
                                <input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className="w-full p-2 border rounded" />
                                <div className="flex justify-between mt-2">
                                    <button type="button" onClick={() => adjustTime("end", -15)} className="px-2 py-1 text-xs bg-gray-200 rounded">−15 мин</button>
                                    <button type="button" onClick={() => adjustTime("end", 15)} className="px-2 py-1 text-xs bg-gray-200 rounded">+15 мин</button>
                                </div>
                            </div>
                        </div>

                        {/* Услуги */}
                        <div>
                            <h3 className="font-semibold mb-2">Выберите услуги</h3>
                            {isLoading ? (
                                <p className="text-sm text-gray-500">Загрузка...</p>
                            ) : services.length === 0 ? (
                                <p className="text-sm text-gray-500">Нет услуг у этого мастера</p>
                            ) : (
                                <ul className="space-y-3">
                                    {services.map((svc) => {
                                        const selected = selectedServices.find((s) => s.id === svc.service_id);
                                        const price = svc.individual_price ?? svc.base_price;

                                        return (
                                            <li
                                                key={svc.service_id}
                                                className="flex items-center justify-between p-3 border rounded-2xl shadow-sm hover:shadow-md transition"
                                            >
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selected}
                                                        onChange={() => toggleService(svc.service_id)}
                                                        className="w-5 h-5 accent-blue-600"
                                                    />
                                                    <span className="font-medium text-gray-800">{svc.name}</span>
                                                    <span className="text-sm text-gray-500">{price}₽</span>
                                                </label>

                                                {selected && (
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={selected.qty}
                                                        onChange={(e) => updateQty(svc.service_id, Number(e.target.value))}
                                                        className="w-16 p-1 border rounded-lg text-center"
                                                    />
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Кнопки */}
                        <div className="flex justify-between mt-4">
                            {/* Левая кнопка — Удалить */}
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className={`
      px-4 py-2 text-sm font-medium rounded-md border transition-all duration-200
      ${isDeleting
                                    ? "bg-red-50 text-red-400 border-red-100 cursor-not-allowed"
                                    : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 active:bg-red-200"}
    `}
                            >
                                {isDeleting ? "Удаление..." : "Удалить"}
                            </button>

                            {/* Правая группа — Закрыть / Сохранить */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium rounded-md border border-gray-200
                 bg-gray-50 text-gray-700 hover:bg-gray-100 active:bg-gray-200
                 transition-all duration-200"
                                >
                                    Закрыть
                                </button>

                                <button
                                    type="submit"
                                    disabled={isUpdating || updatingClient}
                                    className={`
        px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-all duration-200
        ${isUpdating || updatingClient
                                        ? "bg-green-400 text-white cursor-not-allowed"
                                        : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow hover:shadow-md"}
      `}
                                >
                                    {isUpdating || updatingClient ? "Сохранение..." : "Сохранить"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdateEventModal;
