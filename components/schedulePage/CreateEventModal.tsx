"use client";

import React, { useEffect, useState } from "react";
import { useEmployeeServices } from "@/hooks/useServices";
import type { Services } from "@/services/servicesApi";
import ClientAutocomplete from "@/components/ClientAutocomplete";
import type { Client } from "@/services/clientApi";
import { useUpdateClient } from "@/hooks/useClient";
import { XMarkIcon } from "@heroicons/react/24/outline";

type EmployeeServiceEither =
    | (Services & {
    pivot?: {
        employee_id: number;
        service_id: number;
        individual_price: number;
        duration_minutes: number;
    };
})
    | {
    service: Services;
    pivot?: {
        employee_id: number;
        service_id: number;
        individual_price: number;
        duration_minutes: number;
    };
};

function isNested(item: any): item is { service: Services } {
    return item && typeof item === "object" && "service" in item;
}

function unwrapService(
    item: EmployeeServiceEither
): { svc: Services; pivot?: EmployeeServiceEither["pivot"] } {
    return isNested(item)
        ? { svc: item.service, pivot: item.pivot }
        : { svc: item as Services, pivot: (item as any).pivot };
}

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    /*onSave: (data: {
        clientId?: number;
        name: string;
        lastName: string;
        phone: string;
        services: { id: number; qty: number }[];
        timeStart: string;
        timeEnd: string;
    }) => void;*/
    onSave: (data: {
        clientId?: number;
        name: string;
        lastName: string;
        phone: string;
        services: { id: number; qty: number }[];
        timeStart: string;
        timeEnd: string;
        cost: number;
        paymentStatus: "unpaid" | "paid" | "partial";
        paymentMethod: "cash" | "card" | "transfer" | null;
        visitStatus: "expected" | "arrived" | "no_show";
    }) => Promise<void>;
    loading: boolean;
    employeeId: number | null;
    defaultStartTime?: string;
    defaultEndTime?: string;
    isOutsideSchedule?: boolean; // 👈 добавляем сюда (необязательный проп)
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
                                                               isOpen,
                                                               onClose,
                                                               onSave,
                                                               loading,
                                                               employeeId,
                                                               defaultStartTime,
                                                               defaultEndTime,
                                                               isOutsideSchedule = false, // 👈 значение по умолчанию
                                                           }) => {
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [showClientFields, setShowClientFields] = useState(false);
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [selectedServices, setSelectedServices] = useState<
        { id: number; qty: number }[]
    >([]);

    const [timeStart, setTimeStart] = useState(defaultStartTime || "09:00");
    const [timeEnd, setTimeEnd] = useState(defaultEndTime || "09:30");

    const [cost, setCost] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "paid" | "partial">("unpaid");
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer" | null>(null);
    const [visitStatus, setVisitStatus] = useState<"expected" | "arrived" | "no_show">("expected");
    const [isManualCost, setIsManualCost] = useState(false);

    const { data: services = [], isLoading } = useEmployeeServices(
        employeeId ?? undefined
    );

    const { mutateAsync: updateClientMutate, isPending: updating } =
        useUpdateClient();

    useEffect(() => {
        setSelectedServices([]);
        setSelectedClientId(null);
        setName("");
        setLastName("");
        setPhone("");
        setShowClientFields(false);
        setIsEditingClient(false);
        setTimeStart(defaultStartTime || "09:00");
        setTimeEnd(defaultEndTime || "09:30");

        setCost(0);
        setPaymentStatus("unpaid");
        setPaymentMethod(null);
        setVisitStatus("expected");
    }, [employeeId, isOpen]);

    useEffect(() => {
        if (paymentStatus === "unpaid") {
            setPaymentMethod(null);
        }
    }, [paymentStatus]);


    useEffect(() => {
        if (isManualCost) return;

        const total = selectedServices.reduce((sum, s) => {
            const service = services.find((item) => item.service_id === s.id);
            const price = service?.individual_price ?? service?.base_price ?? 0;
            return sum + price * s.qty;
        }, 0);

        setCost(total);
    }, [selectedServices, services, isManualCost]);

    const [success, setSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    if (!isOpen) return null;

// ✅ Переключение выбора услуги
    const toggleService = (serviceId: number) => {
        setSelectedServices((prev) => {
            const exists = prev.some((s) => s.id === serviceId);
            return exists
                ? prev.filter((s) => s.id !== serviceId) // убираем
                : [...prev, { id: serviceId, qty: 1 }];  // добавляем с qty=1
        });
    };

// ✅ Обновление количества для выбранной услуги
    const updateQty = (serviceId: number, qty: number) => {
        setSelectedServices((prev) =>
            prev.map((s) =>
                s.id === serviceId ? { ...s, qty: qty > 0 ? qty : 1 } : s
            )
        );
    };

    const resetClient = () => {
        setSelectedClientId(null);
        setName("");
        setLastName("");
        setPhone("");
        setShowClientFields(false);
        setIsEditingClient(false);
    };

    const handleUpdateClient = async () => {
        if (!selectedClientId) return;
        try {
            await updateClientMutate({
                id: selectedClientId,
                data: { name, last_name: lastName, phone },
            });
            setIsEditingClient(false);
        } catch (err) {
            console.error("Ошибка обновления клиента", err);
            alert("Не удалось обновить клиента");
        }
    };

    const adjustTime = (field: "start" | "end", delta: number) => {
        const value = field === "start" ? timeStart : timeEnd;
        if (!value) return;

        const [h, m] = value.split(":").map(Number);
        let totalMinutes = h * 60 + m + delta;

        if (totalMinutes < 0) totalMinutes = 0;
        if (totalMinutes >= 24 * 60) totalMinutes = 24 * 60 - 1;

        const newHours = Math.floor(totalMinutes / 60)
            .toString()
            .padStart(2, "0");
        const newMinutes = (totalMinutes % 60).toString().padStart(2, "0");
        const newValue = `${newHours}:${newMinutes}`;

        if (field === "start") setTimeStart(newValue);
        else setTimeEnd(newValue);
    };

    /*const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedServices.length === 0) {
            alert("Выберите хотя бы одну услугу");
            return;
        }

        onSave({
            clientId: selectedClientId ?? undefined,
            name,
            lastName,
            phone,
            services: selectedServices,
            timeStart,
            timeEnd,
        });

    };*/

    const calculateServicesCost = () => {
        return selectedServices.reduce((sum, s) => {
            const service = services.find((item) => item.service_id === s.id);
            const price = service?.individual_price ?? service?.base_price ?? 0;
            return sum + price * s.qty;
        }, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedServices.length === 0) {
            setSubmitError("Выберите хотя бы одну услугу");
            return;
        }

        setSubmitError(null);

        try {
            await onSave({
                clientId: selectedClientId ?? undefined,
                name,
                lastName,
                phone,
                services: selectedServices,
                timeStart,
                timeEnd,
                cost,
                paymentStatus,
                paymentMethod,
                visitStatus,
            });

            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1500);
        } catch (err: any) {
            setSubmitError(err?.message || "Не удалось создать запись");
        }
    };

    return (
        <div
            className={`
    fixed inset-0 z-50 flex justify-end
    bg-black bg-opacity-50
    transition-opacity duration-300
    ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
  `}
        >
            <div
                className={`
      bg-white w-[28rem] shadow-lg h-full
      transform transition-transform duration-300
      ${isOpen ? "translate-x-0" : "translate-x-full"}
    `}
            >

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


                <div className="bg-white rounded p-2 w-full max-w-md text-black">
                <h2 className="text-lg font-bold mb-4">Создать новое событие</h2>

                <div className="...">
                    <div className="bg-white p-4">
                        {isOutsideSchedule && (
                            <div className="bg-yellow-50 text-yellow-700 p-2 mb-3 rounded border border-yellow-300 text-sm">
                                ⚠️ Внимание: сотрудник в этот день не работает. Запись будет вне графика.
                            </div>
                        )}
                        {/* форма создания записи */}
                    </div>
                </div>

                    <form onSubmit={handleSubmit} className="max-h-screen overflow-y-auto flex flex-col">

                        <div className="flex-1 overflow-y-auto px-1 space-y-4 pb-40">

                {/* 1. Поиск клиента */}
                    <ClientAutocomplete
                        onSelect={(client: Client) => {
                            setSelectedClientId(client.id ?? null);
                            setName(client.name ?? "");
                            setLastName(client.last_name ?? "");
                            setPhone(client.phone ?? "");
                            setShowClientFields(true);
                        }}
                    />

                    {/* 2. Просмотр клиента */}
                    {showClientFields && !isEditingClient && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            {/* Блок с именем клиента */}
                            <div className="flex items-center mb-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                    <span className="text-gray-500 text-lg">👤</span>
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-800">{name}</div>
                                    <div className="text-gray-600 text-sm">{phone}</div>
                                </div>
                            </div>

                            {/* Фамилия отдельно (если нужна) */}
                            {lastName && (
                                <div className="text-gray-700 text-sm mb-2">
                                    <b>Фамилия:</b> {lastName}
                                </div>
                            )}

                            {/* Кнопки */}
                            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditingClient(true)}
                                    className="px-3 py-1 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
                                >
                                    ✏️ Редактировать
                                </button>
                                <button
                                    type="button"
                                    onClick={resetClient}
                                    className="px-3 py-1 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
                                >
                                    ⟳ Сбросить
                                </button>
                            </div>
                        </div>
                    )}

                    {showClientFields && isEditingClient && (
                        <div className="bg-gray-50 p-4 rounded border space-y-2">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full p-2 border rounded"
                            />

                            <div className="flex justify-end gap-6 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsEditingClient(false)}
                                    className="text-gray-500 hover:underline"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpdateClient}
                                    disabled={updating}
                                    className="text-blue-600 hover:underline"
                                >
                                    💾 {updating ? "Сохранение..." : "Сохранить"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 3. Время */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-semibold">Время начала</label>
                            <input
                                type="time"
                                value={timeStart}
                                onChange={(e) => setTimeStart(e.target.value)}
                                className="w-full p-2 border rounded"
                                required
                            />
                            <div className="flex justify-between mt-2">
                                <button
                                    type="button"
                                    className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                                    onClick={() => adjustTime("start", -15)}
                                >
                                    −15 мин
                                </button>
                                <button
                                    type="button"
                                    className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                                    onClick={() => adjustTime("start", 15)}
                                >
                                    +15 мин
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold">Время окончания</label>
                            <input
                                type="time"
                                value={timeEnd}
                                onChange={(e) => setTimeEnd(e.target.value)}
                                className="w-full p-2 border rounded"
                                required
                            />
                            <div className="flex justify-between mt-2">
                                <button
                                    type="button"
                                    className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                                    onClick={() => adjustTime("end", -15)}
                                >
                                    −15 мин
                                </button>
                                <button
                                    type="button"
                                    className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                                    onClick={() => adjustTime("end", 15)}
                                >
                                    +15 мин
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 4. Услуги */}
                    <div>
                        <h3 className="font-semibold mb-2">Выберите услуги</h3>
                        {isLoading ? (
                            <p className="text-sm text-gray-500">Загрузка...</p>
                        ) : services.length === 0 ? (
                            <p className="text-sm text-gray-500">У мастера нет привязанных услуг</p>
                        ) : (
                            <ul className="space-y-3">
                                {services.map((item) => {
                                    const selected = selectedServices.find((s) => s.id === item.service_id);
                                    const price = item.individual_price ?? item.base_price;

                                    return (
                                        <li
                                            key={item.service_id}
                                            className="flex items-center justify-between p-3 border rounded-2xl shadow-sm hover:shadow-md transition"
                                        >
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selected}
                                                    onChange={() => toggleService(item.service_id)}
                                                    className="w-5 h-5 accent-blue-600"
                                                />
                                                <span className="font-medium text-gray-800">{item.name}</span>
                                                <span className="text-sm text-gray-500">{price}₽</span>
                                            </label>

                                            {selected && (
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={selected.qty}
                                                    onChange={(e) => updateQty(item.service_id, Number(e.target.value))}
                                                    className="w-16 p-1 border rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                                                />
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>



                            {/* 4. Статусы и оплата */}
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block mb-1 font-semibold">Стоимость</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="1"
                                        value={cost}
                                        onChange={(e) => {
                                            setIsManualCost(true);
                                            setCost(Number(e.target.value) || 0);
                                        }}
                                        className="w-full p-2 border rounded"
                                    />

                                    {isManualCost && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsManualCost(false);
                                                setCost(calculateServicesCost());
                                            }}
                                            className="text-xs text-blue-600 mt-1"
                                        >
                                            Сбросить к расчету
                                        </button>
                                    )}
                                </div>

                                <div>
                                    <span className="block mb-2 font-semibold">Статус визита</span>
                                    <div className="space-y-2 rounded border p-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="visitStatus"
                                                value="expected"
                                                checked={visitStatus === "expected"}
                                                onChange={() => setVisitStatus("expected")}
                                                className="accent-blue-600"
                                            />
                                            <span>Ожидается</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="visitStatus"
                                                value="arrived"
                                                checked={visitStatus === "arrived"}
                                                onChange={() => setVisitStatus("arrived")}
                                                className="accent-blue-600"
                                            />
                                            <span>Пришел</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="visitStatus"
                                                value="no_show"
                                                checked={visitStatus === "no_show"}
                                                onChange={() => setVisitStatus("no_show")}
                                                className="accent-blue-600"
                                            />
                                            <span>Не пришел</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <span className="block mb-2 font-semibold">Статус оплаты</span>
                                    <div className="space-y-2 rounded border p-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentStatus"
                                                value="unpaid"
                                                checked={paymentStatus === "unpaid"}
                                                onChange={() => setPaymentStatus("unpaid")}
                                                className="accent-blue-600"
                                            />
                                            <span>Не оплачено</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentStatus"
                                                value="paid"
                                                checked={paymentStatus === "paid"}
                                                onChange={() => setPaymentStatus("paid")}
                                                className="accent-blue-600"
                                            />
                                            <span>Оплачено</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentStatus"
                                                value="partial"
                                                checked={paymentStatus === "partial"}
                                                onChange={() => setPaymentStatus("partial")}
                                                className="accent-blue-600"
                                            />
                                            <span>Частично</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block mb-1 font-semibold">Способ оплаты</label>
                                    <select
                                        value={paymentMethod ?? ""}
                                        disabled={paymentStatus === "unpaid"}
                                        onChange={(e) =>
                                            setPaymentMethod(
                                                e.target.value === ""
                                                    ? null
                                                    : (e.target.value as "cash" | "card" | "transfer")
                                            )
                                        }
                                        className="w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        <option value="">Не выбрано</option>
                                        <option value="cash">Наличные</option>
                                        <option value="card">Карта</option>
                                        <option value="transfer">Перевод</option>
                                    </select>
                                </div>
                            </div>



                        </div>

                    {/* 5. Кнопки сохранения события */}
                        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 px-6">
                            <div className="flex justify-end mb-3">
                                {submitError && (
                                    <div
                                        className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                        {submitError}
                                    </div>
                                )}

                                {success && !submitError && (
                                    <div
                                        className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                                        ✅ Запись создана!
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300
      bg-gray-50 text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-all duration-200"
                                >
                                    Закрыть
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-all duration-200
      ${loading
                                        ? "bg-green-400 text-white cursor-not-allowed"
                                        : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow hover:shadow-md"}`}
                                >
                                    {loading ? "Создание..." : "Сохранить"}
                                </button>
                            </div>
                        </div>
                </form>
            </div>
            </div>
        </div>
    );
};

export default CreateEventModal;
