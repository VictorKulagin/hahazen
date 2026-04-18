"use client";
import React, { useEffect, useState } from "react";
import { useEmployeeServices } from "@/hooks/useServices";
import { useUpdateAppointment, useDeleteAppointment } from "@/hooks/useAppointments";
import { useUpdateClient } from "@/hooks/useClient";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Pencil, UserCircle2, Package, Clock, CreditCard } from "lucide-react";

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

        cost?: number;
        payment_status?: "unpaid" | "paid" | "partial";
        payment_method?: "cash" | "card" | "transfer" | null;
        visit_status?: "expected" | "arrived" | "no_show";
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

    const [cost, setCost] = useState(0);
    const [isManualCost, setIsManualCost] = useState(false);

    const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "paid" | "partial">("unpaid");
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer" | null>(null);
    const [visitStatus, setVisitStatus] = useState<"expected" | "arrived" | "no_show">("expected");

    const [serviceSearch, setServiceSearch] = useState("");
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);

    const { mutateAsync: updateAppointmentMutate, isPending: isUpdating } = useUpdateAppointment();
    const { mutateAsync: updateClientMutate, isPending: updatingClient } = useUpdateClient();
    const { mutateAsync: deleteAppointmentMutate, isPending: isDeleting } = useDeleteAppointment();

    // Нормализация при открытии модалки
    useEffect(() => {
        if (!eventData || !isOpen) return;

        setName(eventData.client?.name ?? "");
        setLastName(eventData.client?.last_name ?? "");
        setPhone(eventData.client?.phone ?? "");

        setSelectedServices(
            (eventData.services ?? []).map((s) => ({
                id: s.id,
                qty: s.qty ?? 1,
            }))
        );

        setTimeStart(eventData.timeStart);
        setTimeEnd(eventData.timeEnd);

        setCost(eventData.cost ?? 0);
        setPaymentStatus(eventData.payment_status ?? "unpaid");
        setPaymentMethod(eventData.payment_method ?? null);
        setVisitStatus(eventData.visit_status ?? "expected");
        setIsManualCost(false);

        setIsEditingClient(false);
        setServiceSearch("");
        setIsServiceDropdownOpen(false);
    }, [eventData, isOpen]);

    useEffect(() => {
        if (paymentStatus === "unpaid") {
            setPaymentMethod(null);
        }
    }, [paymentStatus]);

    const calculateServicesCost = () => {
        return selectedServices.reduce((sum, s) => {
            const service = services.find((item) => item.service_id === s.id);
            const price = service?.individual_price ?? service?.base_price ?? 0;
            return sum + price * s.qty;
        }, 0);
    };


    useEffect(() => {
        if (isManualCost) return;

        setCost(calculateServicesCost());
    }, [selectedServices, services, isManualCost]);

    /*const toggleService = (serviceId: number) => {
        setSelectedServices((prev) =>
            prev.some((s) => s.id === serviceId)
                ? prev.filter((s) => s.id !== serviceId)
                : [...prev, { id: serviceId, qty: 1 }]
        );
    };*/

    const addService = (serviceId: number) => {
        setSelectedServices((prev) => {
            const exists = prev.some((s) => s.id === serviceId);
            if (exists) return prev;
            return [...prev, { id: serviceId, qty: 1 }];
        });

        setServiceSearch("");
        setIsServiceDropdownOpen(false);
    };

    const filteredServices = services.filter((item) => {
        const matchesSearch = item.name
            .toLowerCase()
            .includes(serviceSearch.toLowerCase());

        const alreadySelected = selectedServices.some((s) => s.id === item.service_id);

        return matchesSearch && !alreadySelected;
    });

    const removeService = (serviceId: number) => {
        setSelectedServices((prev) => prev.filter((s) => s.id !== serviceId));
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

            cost,
            payment_status: paymentStatus,
            payment_method: paymentMethod,
            visit_status: visitStatus,

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
        <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50">
            <div className="bg-[rgb(var(--background))] text-[rgb(var(--foreground))] w-full sm:w-[28rem] h-full shadow-lg rounded-l-2xl rounded-tr-2xl overflow-hidden">
                <div className="h-full flex flex-col">

                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white bg-white dark:bg-white/10 rounded-full border border-gray-200 dark:border-white/10 shadow-sm p-1 transition-colors"
                    aria-label="Закрыть окно"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>

                </button>

                    <div className="sticky top-0 z-20 border-b border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[rgb(var(--card))]/95 backdrop-blur-md">
                        <div className="flex items-start justify-between px-4 py-0">
                            <div className="flex items-start gap-3 min-w-0">
                                <span className="mt-[1.3rem] h-2 w-2 rounded-full bg-emerald-400 shrink-0" />

                                <h2 className="text-[17px] leading-[2.75] font-semibold text-[rgb(var(--foreground))] truncate">
                                    Редактировать запись
                                </h2>
                            </div>

                            <button
                                type="button"
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
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
                    </div>

                    {/*<form onSubmit={handleSave} className="max-h-screen overflow-y-auto flex flex-col bg-gray-50">*/}
                    <form onSubmit={handleSave} className="flex flex-col h-full min-h-0 bg-gray-50 dark:bg-[rgb(var(--background))]">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[rgb(var(--background))] pb-24">
                            {/* Клиент */}
                            {!isEditingClient ? (
                                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-3">
                                    <div className="font-semibold">{name}</div>
                                    {lastName && <div className="text-sm">Фамилия: {lastName}</div>}
                                    {phone && <div className="text-sm">Телефон: {phone}</div>}
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingClient(true)}
                                        className="text-blue-600 hover:underline text-sm mt-2"
                                    >
                                        <Pencil size={16} />
                                        <span>Редактировать клиента</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-4 space-y-2">
                                    <input value={name} onChange={(e) => setName(e.target.value)}
                                           className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500" placeholder="Имя"/>
                                    <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                                           className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500" placeholder="Фамилия"/>
                                    <input value={phone} onChange={(e) => setPhone(e.target.value)}
                                           className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500" placeholder="Телефон"/>
                                    <button type="button" onClick={() => setIsEditingClient(false)}
                                            className="text-gray-500 hover:underline text-sm">
                                        Отмена
                                    </button>
                                </div>
                            )}

                            {/* Время */}
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Время
                                    </h3>
                                </div>

                                <div className="flex gap-3 w-full">
                                    <div className="flex-1">
                                        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Время начала</label>
                                    <input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)}
                                           className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"/>
                                    <div className="flex justify-between mt-2">
                                        <button type="button" onClick={() => adjustTime("start", -15)}
                                                className="px-2 py-1 text-xs bg-gray-200 dark:bg-white/10 text-black dark:text-white rounded hover:bg-gray-300 dark:hover:bg-white/20">−15 мин
                                        </button>
                                        <button type="button" onClick={() => adjustTime("start", 15)}
                                                className="px-2 py-1 text-xs bg-gray-200 dark:bg-white/10 text-black dark:text-white rounded hover:bg-gray-300 dark:hover:bg-white/20">+15 мин
                                        </button>
                                    </div>
                                </div>
                                    <div className="flex-1">
                                        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Время окончания</label>
                                    <input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)}
                                           className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"/>
                                    <div className="flex justify-between mt-2">
                                        <button type="button" onClick={() => adjustTime("end", -15)}
                                                className="px-2 py-1 text-xs bg-gray-200 dark:bg-white/10 text-black dark:text-white rounded hover:bg-gray-300 dark:hover:bg-white/20">−15 мин
                                        </button>
                                        <button type="button" onClick={() => adjustTime("end", 15)}
                                                className="px-2 py-1 text-xs bg-gray-200 dark:bg-white/10 text-black dark:text-white rounded hover:bg-gray-300 dark:hover:bg-white/20">+15 мин
                                        </button>
                                    </div>
                                </div>
                            </div>
                            </div>

                            {/* Услуги */}
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Услуги
                                        </h3>
                                    </div>

                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
    Кол-во
  </span>
                                </div>

                                {isLoading ? (
                                    <p className="text-sm text-gray-500">Загрузка...</p>
                                ) : services.length === 0 ? (
                                    <p className="text-sm text-gray-500">Нет услуг у этого мастера</p>
                                ) : (
                                    <div className="relative">
                                        {selectedServices.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {selectedServices.map((selected) => {
                                                    const service = services.find((item) => item.service_id === selected.id);
                                                    if (!service) return null;

                                                    const price = service.individual_price ?? service.base_price;

                                                    return (
                                                        <div
                                                            key={selected.id}
                                                            className="
              flex items-center gap-2
              rounded-full
              px-4 py-2
              border border-white/10
              bg-white/[0.06]
              text-white
            "
                                                        >
            <span className="text-sm text-white/90">
              {service.name}
            </span>

                                                            <span className="text-sm text-white/55">
              {price}₽
            </span>

                                                            <div className="flex items-center gap-1 ml-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQty(selected.id, selected.qty - 1)}
                                                                    className="
                  w-7 h-7
                  flex items-center justify-center
                  rounded-full
                  border border-white/10
                  bg-white/[0.04]
                  text-white/80
                  hover:bg-white/[0.08]
                  transition-colors
                "
                                                                >
                                                                    −
                                                                </button>

                                                                <span className="min-w-[18px] text-center text-sm font-medium text-white">
                {selected.qty}
              </span>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQty(selected.id, selected.qty + 1)}
                                                                    className="
                  w-7 h-7
                  flex items-center justify-center
                  rounded-full
                  border border-white/10
                  bg-white/[0.10]
                  text-white
                  hover:bg-white/[0.14]
                  transition-colors
                "
                                                                >
                                                                    +
                                                                </button>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => removeService(selected.id)}
                                                                className="
                ml-1
                w-6 h-6
                flex items-center justify-center
                rounded-full
                text-white/45
                hover:text-white/75
                transition-colors
              "
                                                            >
                                                                <XMarkIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={serviceSearch}
                                                onChange={(e) => {
                                                    setServiceSearch(e.target.value);
                                                    setIsServiceDropdownOpen(true);
                                                }}
                                                onFocus={() => setIsServiceDropdownOpen(true)}
                                                placeholder="Поиск услуг"
                                                className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.06] text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setIsServiceDropdownOpen((prev) => !prev)}
                                                className="w-11 h-11 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/80 hover:bg-white/[0.10] transition-colors"
                                            >
                                                <span className="text-lg leading-none">+</span>
                                            </button>
                                        </div>

                                        {isServiceDropdownOpen && filteredServices.length > 0 && (
                                            <div
                                                className="absolute left-0 right-0 top-full mt-2 z-20 max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-[rgb(var(--card))] shadow-xl"
                                            >
                                                {filteredServices.map((item) => {
                                                    const price = item.individual_price ?? item.base_price;

                                                    return (
                                                        <button
                                                            key={item.service_id}
                                                            type="button"
                                                            onClick={() => addService(item.service_id)}
                                                            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/10 transition-colors"
                                                        >
            <span className="text-sm text-white">
              {item.name}
            </span>

                                                            <span className="text-sm text-white/60">
              {price}₽
            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {isServiceDropdownOpen &&
                                            filteredServices.length === 0 &&
                                            serviceSearch.trim() !== "" && (
                                                <div
                                                    className="
          absolute left-2 right-2 top-full mt-2 z-20
          rounded-xl
          border border-white/10
          bg-[rgb(var(--card))]
          px-4 py-3
          text-sm text-white/60
        "
                                                >
                                                    Ничего не найдено
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>



                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <CreditCard className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Оплата
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Стоимость</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="1"
                                        value={cost}
                                        onChange={(e) => {
                                            setIsManualCost(true);
                                            setCost(Number(e.target.value) || 0);
                                        }}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
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
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Статус визита</span>
                                    <div className="inline-flex w-full rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-white/5">
                                        <button
                                            type="button"
                                            onClick={() => setVisitStatus("expected")}
                                            className={`flex-1 px-3 py-2 text-sm transition ${
                                                visitStatus === "expected"
                                                    ? "bg-green-100 text-green-700 font-medium"
                                                    : "bg-white dark:bg-transparent text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10"
                                            }`}
                                        >
                                            Ожидается
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setVisitStatus("arrived")}
                                            className={`flex-1 px-3 py-2 text-sm border-l transition ${
                                                visitStatus === "arrived"
                                                    ? "bg-green-100 text-green-700 font-medium"
                                                    : "bg-white dark:bg-transparent text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10"
                                            }`}
                                        >
                                            Пришел
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setVisitStatus("no_show")}
                                            className={`flex-1 px-3 py-2 text-sm border-l transition ${
                                                visitStatus === "no_show"
                                                    ? "bg-red-100 text-red-700 font-medium"
                                                    : "bg-white dark:bg-transparent text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10"
                                            }`}
                                        >
                                            Не пришел
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <span className="block text-sm font-medium text-gray-700 mb-1">Статус оплаты</span>
                                    <div className="inline-flex w-full rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-white/5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPaymentStatus("unpaid");
                                                setPaymentMethod(null);
                                            }}
                                            className={`flex-1 px-3 py-2 text-sm transition ${
                                                paymentStatus === "unpaid"
                                                    ? "bg-gray-100 text-gray-800 font-medium dark:bg-white/10 dark:text-white"
                                                    : "bg-white dark:bg-transparent text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10"
                                            }`}
                                        >
                                            Не оплачено
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPaymentStatus("partial")}
                                            className={`flex-1 px-3 py-2 text-sm border-l transition ${
                                                paymentStatus === "partial"
                                                    ? "bg-yellow-100 text-yellow-700 font-medium dark:bg-yellow-500/20 dark:text-yellow-300"
                                                    : "bg-white dark:bg-transparent text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10"
                                            }`}
                                        >
                                            Частично
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPaymentStatus("paid")}
                                            className={`flex-1 px-3 py-2 text-sm border-l transition ${
                                                paymentStatus === "paid"
                                                    ? "bg-green-500 text-white font-medium dark:bg-green-500/80 dark:text-white"
                                                    : "bg-white dark:bg-transparent text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10"
                                            }`}
                                        >
                                            Оплачено
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Способ оплаты</label>
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
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 disabled:bg-gray-100 dark:disabled:bg-white/5 disabled:text-gray-400"
                                    >
                                        <option value="">Не выбрано</option>
                                        <option value="cash">Наличные</option>
                                        <option value="card">Карта</option>
                                        <option value="transfer">Перевод</option>
                                    </select>

                                    {paymentStatus === "unpaid" && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Сначала выберите статус «Оплачено» или «Частично»
                                        </p>
                                    )}
                                </div>
                            </div>
                            </div>

                        </div>

                        {/* Кнопки */}
                        <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[rgb(var(--card))] shadow-[0_-2px_8px_rgba(0,0,0,0.04)] dark:shadow-none">
                            {/* Полоса бордера на всю ширину */}


                            {/* Контейнер с отступами */}
                            <div className="flex justify-between gap-3">
                                {/* Удалить */}
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className={`
      h-11 px-5 rounded-xl border transition
      ${
                                        isDeleting
                                            ? "bg-red-50 text-red-400 border-red-100 cursor-not-allowed"
                                            : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                    }
    `}
                                >
                                    {isDeleting ? "Удаление..." : "Удалить"}
                                </button>

                                {/* Правая группа */}
                                <div className="flex gap-3">
                                    {/* Закрыть */}
                                    <button
                                        type="button"
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

                                    {/* Сохранить */}
                                    <button
                                        type="submit"
                                        disabled={isUpdating || updatingClient}
                                        className={`
        h-11 px-5 rounded-xl font-medium text-white transition
        ${
                                            isUpdating || updatingClient
                                                ? "bg-green-500/70 cursor-not-allowed"
                                                : "bg-green-600 hover:bg-green-700"
                                        }
      `}
                                    >
                                        {isUpdating || updatingClient ? "Сохранение..." : "Сохранить"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>

        </div>
            </div>
        </div>
    );
};

export default UpdateEventModal;
