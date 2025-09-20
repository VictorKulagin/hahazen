"use client";
import React, { useEffect, useState } from "react";
import { useEmployeeServices } from "@/hooks/useServices";
import { useUpdateAppointment } from "@/hooks/useAppointments";
import { useUpdateClient } from "@/hooks/useClient";
import { useDeleteAppointment } from "@/hooks/useAppointments";
interface UpdateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventData: {
        id: number;
        date: string;  // ⬅ добавили
        client?: { id: number; name: string; last_name?: string; phone?: string };
        services: { id: number; qty: number }[];
        timeStart: string;
        timeEnd: string;
        employeeId: number;
    } | null;
}

const UpdateEventModal: React.FC<UpdateEventModalProps> = ({ isOpen, onClose, eventData }) => {
    const employeeId = eventData?.employeeId ?? undefined;

    // ⬇️ тянем ВСЕ услуги сотрудника
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
    const { mutateAsync: deleteAppointmentMutate, isPending: isDeleting } =
        useDeleteAppointment();

    // Подставляем данные при каждом открытии
    useEffect(() => {
        if (!eventData || !isOpen) return;

        setName(eventData.client?.name ?? "");
        setLastName(eventData.client?.last_name ?? "");
        setPhone(eventData.client?.phone ?? "");

        // нормализуем: qty = 1 по умолчанию
        const normSel = (eventData.services ?? []).map(s => ({ id: s.id, qty: s.qty ?? 1 }));
        setSelectedServices(normSel);

        setTimeStart(eventData.timeStart);
        setTimeEnd(eventData.timeEnd);
        setIsEditingClient(false);

        console.log("🔧 UpdateEventModal eventData:", eventData);
    }, [eventData, isOpen]);

    // полезные логи — увидишь все услуги, что пришли от хука
    useEffect(() => {
        console.log("📦 useEmployeeServices -> services:", services);
    }, [services]);

    const toggleService = (id: number) => {
        setSelectedServices(prev =>
            prev.some(s => s.id === id) ? prev.filter(s => s.id !== id) : [...prev, { id, qty: 1 }]
        );
    };

    const updateQty = (serviceId: number, qty: number) => {
        if (qty < 1) qty = 1;
        setSelectedServices(prev => prev.map(s => (s.id === serviceId ? { ...s, qty } : s)));
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

        if (!eventData) {
            console.warn("❗ handleSave вызван без eventData");
            return;
        }

        if (isEditingClient && eventData?.client?.id) {
            await updateClientMutate({
                id: eventData.client.id,
                data: { name, last_name: lastName, phone },
            });
        }

        await updateAppointmentMutate({
            id: eventData.id,
            date: eventData.date,                 // ⬅ используем дату записи
            time_start: timeStart,
            time_end: timeEnd,
            employee_id: eventData.employeeId,
            client_id: eventData.client?.id,
            services: selectedServices.map(s => ({
                service_id: s.id,
                qty: s.qty ?? 1,
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
        <div className={`fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <div className={`bg-white w-[28rem] shadow-lg h-full transform transition-transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-50 bg-white rounded-full shadow p-1"
                    aria-label="Закрыть окно"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
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
                                <button type="button" onClick={() => setIsEditingClient(true)} className="text-blue-600 hover:underline text-sm mt-2">
                                    ✏️ Редактировать клиента
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" placeholder="Имя" />
                                <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border rounded" placeholder="Фамилия" />
                                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border rounded" placeholder="Телефон" />
                                <button type="button" onClick={() => setIsEditingClient(false)} className="text-gray-500 hover:underline text-sm">
                                    Отмена
                                </button>
                            </div>
                        )}

                        {/* Время */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-semibold">Время начала</label>
                                <input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)} className="w-full p-2 border rounded" />
                                <div className="flex justify-between mt-2">
                                    <button type="button" onClick={() => adjustTime("start", -15)} className="px-2 py-1 text-xs bg-gray-200 rounded">−15 мин</button>
                                    <button type="button" onClick={() => adjustTime("start", 15)} className="px-2 py-1 text-xs bg-gray-200 rounded">+15 мин</button>
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold">Время окончания</label>
                                <input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} className="w-full p-2 border rounded" />
                                <div className="flex justify-between mt-2">
                                    <button type="button" onClick={() => adjustTime("end", -15)} className="px-2 py-1 text-xs bg-gray-200 rounded">−15 мин</button>
                                    <button type="button" onClick={() => adjustTime("end", 15)} className="px-2 py-1 text-xs bg-gray-200 rounded">+15 мин</button>
                                </div>
                            </div>
                        </div>

                        {/* Услуги ВСЕ этого мастера */}
                        <div>
                            <h3 className="font-semibold mb-2">Выберите услуги</h3>
                            {isLoading ? (
                                <p className="text-sm text-gray-500">Загрузка...</p>
                            ) : services.length === 0 ? (
                                <p className="text-sm text-gray-500">Нет услуг у этого мастера</p>
                            ) : (
                                <ul className="space-y-3">
                                    {services.map((raw: any) => {
                                        const svc = raw?.service ?? raw; // поддержка обоих форматов
                                        const pivot = raw?.pivot;
                                        const selected = selectedServices.find(s => s.id === svc.id);
                                        const price = pivot?.individual_price ?? svc?.base_price;

                                        return (
                                            <li key={svc.id} className="flex items-center justify-between p-3 border rounded-2xl shadow-sm hover:shadow-md transition">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selected}
                                                        onChange={() => toggleService(svc.id)}
                                                        className="w-5 h-5 accent-blue-600"
                                                    />
                                                    <span className="font-medium text-gray-800">{svc?.name}</span>
                                                    <span className="text-sm text-gray-500">{price}₽</span>
                                                </label>
                                                {selected && (
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={selected.qty ?? 1}
                                                        onChange={e => updateQty(svc.id, Number(e.target.value) || 1)}
                                                        className="w-16 p-1 border rounded-lg text-center"
                                                    />
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        <div className="flex justify-between mt-4">
                            {/* Левая часть — удаление */}
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                            >
                                {isDeleting ? "Удаление..." : "Удалить"}
                            </button>

                            {/* Правая часть — закрыть/сохранить */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    Закрыть
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating || updatingClient}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
