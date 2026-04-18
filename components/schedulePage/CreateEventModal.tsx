"use client";

import React, {useEffect, useState} from "react";
import {useEmployeeServices} from "@/hooks/useServices";
import type {Services} from "@/services/servicesApi";
import ClientAutocomplete from "@/components/ClientAutocomplete";
import type {Client} from "@/services/clientApi";
import {useUpdateClient} from "@/hooks/useClient";
import {XMarkIcon} from "@heroicons/react/24/outline";
import { Pencil, UserCircle2, Package, Clock, CreditCard } from "lucide-react";

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
        ? {svc: item.service, pivot: item.pivot}
        : {svc: item as Services, pivot: (item as any).pivot};
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

    const [serviceSearch, setServiceSearch] = useState("");
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);


    const {data: services = [], isLoading} = useEmployeeServices(
        employeeId ?? undefined
    );

    const {mutateAsync: updateClientMutate, isPending: updating} =
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
        setServiceSearch("");
        setIsServiceDropdownOpen(false);
        setIsManualCost(false);
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


    const filteredServices = services.filter((item) => {
        const matchesSearch = item.name
            .toLowerCase()
            .includes(serviceSearch.toLowerCase());

        const alreadySelected = selectedServices.some((s) => s.id === item.service_id);

        return matchesSearch && !alreadySelected;
    });



    const addService = (serviceId: number) => {
        setSelectedServices((prev) => {
            const exists = prev.some((s) => s.id === serviceId);
            if (exists) return prev;
            return [...prev, {id: serviceId, qty: 1}];
        });

        setServiceSearch("");
        setIsServiceDropdownOpen(false);
    };

    const removeService = (serviceId: number) => {
        setSelectedServices((prev) => prev.filter((s) => s.id !== serviceId));
    };

    const inputClass = "w-full px-4 py-3 rounded-xl \
border border-gray-200 dark:border-white/10 \
bg-white dark:bg-white/5 \
text-black dark:text-white \
transition \
focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500";

// ✅ Обновление количества для выбранной услуги
    const updateQty = (serviceId: number, qty: number) => {
        setSelectedServices((prev) =>
            prev.map((s) =>
                s.id === serviceId ? {...s, qty: qty > 0 ? qty : 1} : s
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
                data: {name, last_name: lastName, phone},
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
                className="
    bg-[rgb(var(--background))] text-[rgb(var(--foreground))]
    w-[28rem]
    h-full
    shadow-lg

    rounded-l-2xl
    rounded-tr-2xl

    overflow-hidden
  "
            >


                {/*<div className="bg-white rounded p-2 w-full max-w-md text-black">*/}
                <div className="relative bg-[rgb(var(--background))] w-full sm:w-[28rem] h-full shadow-lg flex flex-col">
                    {/* Header */}
                    <div className="sticky top-0 z-20 border-b border-white/10 bg-[rgb(var(--card))]/95 backdrop-blur-md">
                        <div className="flex items-start justify-between px-4 py-0">
                            <div className="flex items-start gap-3 min-w-0">
                                <span className="mt-[1.30rem] h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.35)] shrink-0" />

                                <div className="min-w-0">
                                    <h2 className="text-[17px] leading-[2.75] font-semibold text-[rgb(var(--foreground))] truncate">
                                        Создание записи
                                    </h2>

                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="
  mt-[8px]
  flex h-9 w-9 shrink-0 items-center justify-center
  rounded-xl
  border border-gray-200 dark:border-white/10
  bg-gray-100 text-gray-500
  hover:bg-gray-200 hover:text-gray-700
  dark:bg-white/5 dark:text-white/60
  dark:hover:bg-white/10 dark:hover:text-white
  transition
"
                                aria-label="Закрыть окно"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>

                    {isOutsideSchedule && (
                        <div className="mx-4 mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                            <span>⚠️</span>
                            <span>Сотрудник в этот день не работает. Запись вне графика</span>
                        </div>
                    )}

                    {/*<form onSubmit={handleSubmit} className="max-h-screen overflow-y-auto flex flex-col">*/}
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-[rgb(var(--background))]">
                        <div className="flex-1 overflow-y-auto p-4 text-black space-y-4">

                            {/* 1. Поиск клиента */}
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <UserCircle2 className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                                    <h3 className="text-[13px] font-semibold tracking-wide text-gray-900 dark:text-white/90">
                                        Клиент
                                    </h3>
                                </div>

                                <div>
                                    <ClientAutocomplete
                                        onSelect={(client: Client) => {
                                            setSelectedClientId(client.id ?? null);
                                            setName(client.name ?? "");
                                            setLastName(client.last_name ?? "");
                                            setPhone(client.phone ?? "");
                                            setShowClientFields(true);
                                        }}
                                    />
                                </div>
                            </div>
                            {/* 2. Просмотр клиента */}
                            {showClientFields && !isEditingClient && (
                                <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-4">
                                    {/* Блок с именем клиента */}
                                    <div className="flex items-center mb-3">
                                        <div
                                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mr-3">
                                            <span className="text-gray-500 dark:text-gray-300 text-lg">
                                                <UserCircle2 className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white">{name}</div>
                                            <div className="text-gray-600 dark:text-gray-400 text-sm">{phone}</div>
                                        </div>
                                    </div>

                                    {/* Фамилия отдельно (если нужна) */}
                                    {lastName && (
                                        <div className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                                            <b>Фамилия:</b> {lastName}
                                        </div>
                                    )}

                                    {/* Кнопки */}
                                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingClient(true)}
                                            className="inline-flex px-3 py-1 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Редактировать
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetClient}
                                            className="px-3 py-1 rounded-lg text-sm font-medium ttext-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 transition"
                                        >
                                            ⟳ Сбросить
                                        </button>
                                    </div>
                                </div>
                            )}

                            {showClientFields && isEditingClient && (
                                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={inputClass}
                                    />
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className={inputClass}
                                    />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className={inputClass}
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
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    <h3 className="text-[13px] font-semibold tracking-wide text-gray-900 dark:text-white/90">
                                        Время
                                    </h3>
                                </div>

                                <div className="flex gap-3 w-full">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Время начала</label>
                                        <input
                                            type="time"
                                            value={timeStart}
                                            onChange={(e) => setTimeStart(e.target.value)}
                                            className="w-full p-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white"
                                            required
                                        />
                                        <div className="flex justify-between mt-2">
                                            <button
                                                type="button"
                                                className="px-2 py-1 text-xs bg-gray-200 dark:bg-white/10 text-black dark:text-white rounded hover:bg-gray-300 dark:hover:bg-white/20"
                                                onClick={() => adjustTime("start", -15)}
                                            >
                                                −15 мин
                                            </button>
                                            <button
                                                type="button"
                                                className="px-2 py-1 text-xs bg-gray-200 dark:bg-white/10 text-black dark:text-white rounded hover:bg-gray-300 dark:hover:bg-white/20"
                                                onClick={() => adjustTime("start", 15)}
                                            >
                                                +15 мин
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Время окончания</label>
                                        <input
                                            type="time"
                                            value={timeEnd}
                                            onChange={(e) => setTimeEnd(e.target.value)}
                                            className="w-full p-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white"
                                            required
                                        />
                                        <div className="flex justify-between mt-2">
                                            <button
                                                type="button"
                                                className="px-2 py-1 text-xs bg-gray-200 dark:bg-white/10 text-black dark:text-white rounded hover:bg-gray-300 dark:hover:bg-white/20"
                                                onClick={() => adjustTime("end", -15)}
                                            >
                                                −15 мин
                                            </button>
                                            <button
                                                type="button"
                                                className="px-2 py-1 text-xs bg-gray-200 dark:bg-white/10 text-black dark:text-white rounded hover:bg-gray-300 dark:hover:bg-white/20"
                                                onClick={() => adjustTime("end", 15)}
                                            >
                                                +15 мин
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Услуги */}
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                        <h3 className="text-[13px] font-semibold tracking-wide text-gray-900 dark:text-white/90">
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
                                    <p className="text-sm text-gray-500">У мастера нет привязанных услуг</p>
                                ) : (
                                    <div className="relative">
                                        {/* выбранные услуги */}
                                        {selectedServices.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {selectedServices.map((selected) => {
                                                    const service = services.find((item) => item.service_id === selected.id);
                                                    if (!service) return null;

                                                    const price = service.individual_price ?? service.base_price;

                                                    return (
                                                        <div
                                                            key={selected.id}
                                                            className="flex items-center gap-2 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 px-3 py-1.5 text-gray-800 dark:text-white"
                                                        >
                                <span className="text-sm font-medium text-gray-800">
                                    {service.name}
                                </span>

                                                            <span className="text-sm text-gray-500">
                                    {price}₽
                                </span>

                                                            <div className="flex items-center gap-1 ml-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQty(selected.id, selected.qty - 1)}
                                                                    className=" w-7 h-7 flex items-center justify-center rounded-full dbg-gray-200  ark:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white text-sm font-medium transition-all duration-150 hover:bg-gray-300 dark:hover:bg-white/20 active:scale-90"
                                                                >
                                                                    −
                                                                </button>

                                                                <span className="min-w-[20px] text-center text-sm">
                                        {selected.qty}
                                    </span>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQty(selected.id, selected.qty + 1)}
                                                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white text-sm font-medium transition-all duration-150 hover:bg-gray-300 dark:hover:bg-white/20 active:scale-90"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => removeService(selected.id)}
                                                                className="ml-1 text-gray-400 hover:text-red-500"
                                                            >
                                                                <XMarkIcon className="w-4 h-4"/>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* поиск и кнопка */}
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
                                                className="flex-1 px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setIsServiceDropdownOpen((prev) => !prev)}
                                                className="relative w-[3.125rem] h-[3.125rem] rounded-xl flex items-center justify-center  bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-white/10 shadow-sm"
                                            >
                                                <span className="text-lg leading-none">+</span>
                                            </button>
                                        </div>

                                        {/* dropdown */}
                                        {isServiceDropdownOpen && filteredServices.length > 0 && (
                                            <div
                                                className="absolute left-0 right-0 top-full mt-2 z-20 max-h-60 overflow-y-auto  rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[rgb(var(--card))] shadow-xl backdrop-blur-sm transition-all duration-200 animate-in fade-in slide-in-from-top-1"
                                            >
                                                {filteredServices.map((item) => {
                                                    const price = item.individual_price ?? item.base_price;

                                                    return (
                                                        <button
                                                            key={item.service_id}
                                                            type="button"
                                                            onClick={() => addService(item.service_id)}
                                                            className="
          flex w-full items-center justify-between
          px-4 py-3
          text-left
          transition
          hover:bg-gray-100
          dark:hover:bg-white/10
        "
                                                        >
        <span className="text-sm text-gray-900 dark:text-white">
          {item.name}
        </span>

                                                            <span className="text-sm text-gray-500 dark:text-white/60">
          {price}₽
        </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {isServiceDropdownOpen && filteredServices.length === 0 && serviceSearch.trim() !== "" && (
                                            <div
                                                className="absolute left-2 right-2 top-full mt-2 z-20 rounded-lg border bg-white shadow-lg px-3 py-2 text-sm text-gray-500">
                                                Ничего не найдено
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>


                            {/* 4. Статусы и оплата */}
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <CreditCard className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    <h3 className="text-[13px] font-semibold tracking-wide text-gray-900 dark:text-white/90">
                                        Оплата
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="mb-2 block text-[12px] font-medium text-gray-600 dark:text-white/45">
                                            Стоимость
                                        </label>
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
                                                className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400"
                                            >
                                                Сбросить к расчету
                                            </button>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[12px] font-medium text-gray-600 dark:text-white/45">
                                            Статус визита
                                        </label>
                                        <div className="inline-flex w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/[0.04] p-1">
                                            <button
                                                type="button"
                                                onClick={() => setVisitStatus("expected")}
                                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                                    visitStatus === "expected"
                                                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
                                                        : "bg-white dark:bg-transparent text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10"
                                                }`}
                                            >
                                                Ожидается
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setVisitStatus("arrived")}
                                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
                                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
                                        <label className="mb-2 block text-[12px] font-medium text-gray-600 dark:text-white/45">
                                            Статус оплаты
                                        </label>

                                        <div className="inline-flex w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/[0.04] p-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPaymentStatus("unpaid");
                                                    setPaymentMethod(null);
                                                }}
                                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
                                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
                                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
                                        <label className="mb-2 block text-[12px] font-medium text-gray-600 dark:text-white/45">
                                            Способ оплаты
                                        </label>
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
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-3 text-gray-900 dark:text-white/85 focus:outline-none focus:ring-2 focus:ring-gray-300/70 dark:focus:ring-white/10 disabled:bg-gray-100 dark:disabled:bg-white/5 disabled:text-gray-400 dark:disabled:text-white/30"
                                        >
                                            <option value="" className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white">Не выбрано</option>
                                            <option value="cash" className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white">Наличные</option>
                                            <option value="card" className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white">Карта</option>
                                            <option value="transfer" className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white">Перевод</option>
                                        </select>



                                    </div>
                                </div>
                            </div>


                        </div>


                        {/* 5. Кнопки сохранения события */}
                        {/*<div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 px-6">*/}
                        <div className="sticky bottom-0 z-20 border-t border-white/10 bg-[rgb(var(--card))]/95 backdrop-blur-md px-5 py-4">
                            {(submitError || success) && (
                                <div className="mb-3">
                                    {submitError && (
                                        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                                            {submitError}
                                        </div>
                                    )}

                                    {success && !submitError && (
                                        <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                                            ✅ Запись создана!
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="
  h-11 px-5 rounded-xl
  border border-gray-300
  bg-white text-gray-700
  hover:bg-gray-100
  dark:border-white/10
  dark:bg-white/[0.03]
  dark:text-[rgb(var(--foreground))]
  dark:hover:bg-white/10
  transition disabled:opacity-50
"
                                >
                                    Закрыть
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`h-11 px-5 rounded-xl font-medium text-white transition disabled:opacity-50 ${
                                        loading
                                            ? "bg-green-500/70 cursor-not-allowed"
                                            : "bg-green-600 hover:bg-green-700"
                                    }`}
                                >
                                    {loading ? "Сохранение..." : "Сохранить"}
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
