// components/schedulePage/CreateEmployeeModal.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useCreateEmployee } from "@/hooks/useEmployees";
import { useCreateEmployeeSchedule } from "@/hooks/useEmployeeSchedules";
import {useCreateService, useServices, useSyncEmployeeServices} from "@/hooks/useServices";
import { EmployeeService as EmployeeServicePayload } from "@/services/servicesApi";
import { EmployeeCreatePayload, EmployeeRole } from "@/services/employeeApi";
import {useQueryClient} from "@tanstack/react-query";


type Props = {
    isOpen: boolean;
    branchId: number | null;
    onClose: () => void;
    onSave: () => void; // вызываем после успешного создания
};

type WeeklyPeriod = {
    day: string;
    start: string;
    end: string;
};

type EmployeeService = {
    service_id: number;
    individual_price?: number;
    duration_minutes?: number;
};

const ROLE_MAP = {
    gd: 1,
    admin: 2,
    master: 3,
} as const;

const ROLE_OPTIONS: { value: EmployeeRole; label: string }[] = [
    { value: "gd", label: "ГД (владелец)" },
    { value: "admin", label: "Админ" },
    { value: "master", label: "Мастер" },
];

export const CreateEmployeeModal: React.FC<Props> = ({ isOpen, branchId, onClose, onSave }) => {
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [specialty, setSpecialty] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [hireDate, setHireDate] = useState<string>("");

    const [activeTab, setActiveTab] = useState<"info" | "schedule" | "services">("info");

    const [localStartDate, setLocalStartDate] = useState<string>("");
    const [localEndDate, setLocalEndDate] = useState<string>("");
    const [periods, setPeriods] = useState<WeeklyPeriod[]>([]);

    const [selectedServices, setSelectedServices] = useState<EmployeeService[]>([]);

    const { mutateAsync: createEmployee } = useCreateEmployee();
    const { mutateAsync: createSchedule } = useCreateEmployeeSchedule();
    const { data: allServices = [] } = useServices();
    const { mutateAsync: syncServices } = useSyncEmployeeServices();
    const { mutateAsync: createService } = useCreateService(); // ✅ создаём услугу


    // 🔹 локальный стейт для новой услуги
    const [newServiceName, setNewServiceName] = useState("");
    const [newServicePrice, setNewServicePrice] = useState(0);
    const [newServiceDuration, setNewServiceDuration] = useState(30);
    const [role, setRole] = useState<EmployeeRole>("master");

    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const [serviceSearch, setServiceSearch] = useState("");
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);

    const queryClient = useQueryClient();

    // дефолтные даты графика
    useEffect(() => {
        if (!isOpen) return;

        const today = new Date();
        const defaultStart = today.toISOString().split("T")[0];
        const defaultEnd = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

        // Основные поля
        setName("");
        setLastName("");
        setPhone("");
        setSpecialty("");
        setEmail("");
        setHireDate("");
        setRole("master");

        // Вкладка
        setActiveTab("info");

        // График
        setLocalStartDate(defaultStart);
        setLocalEndDate(defaultEnd);
        setPeriods([{ day: "mon", start: "09:00", end: "18:00" }]);

        // Услуги сотрудника
        setSelectedServices([]);
        setServiceSearch("");
        setIsServiceDropdownOpen(false);

        // Создание новой услуги
        setNewServiceName("");
        setNewServicePrice(0);
        setNewServiceDuration(30);

        // Статусы UI
        setSubmitError(null);
        setIsSubmitting(false);
        setSuccess(false);
    }, [isOpen]);

    if (!isOpen) return null;

    /*const toggleService = (serviceId: number) => {
        setSelectedServices((prev) => {
            const exists = prev.find((s) => s.service_id === serviceId);
            if (exists) {
                return prev.filter((s) => s.service_id !== serviceId);
            } else {
                const base = allServices.find((s) => s.id === serviceId);
                return [
                    ...prev,
                    {
                        service_id: serviceId,
                        individual_price: base?.base_price ?? 0,
                        duration_minutes: base?.duration_minutes ?? 30,
                    },
                ];
            }
        });
    };*/

    const addService = (service: {
        id: number;
        name: string;
        base_price: number;
        duration_minutes: number;
    }) => {
        setSelectedServices((prev) => {
            const exists = prev.some((s) => s.service_id === service.id);
            if (exists) return prev;

            return [
                ...prev,
                {
                    service_id: service.id,
                    individual_price: service.base_price,
                    duration_minutes: service.duration_minutes,
                },
            ];
        });

        setServiceSearch("");
        setIsServiceDropdownOpen(false);
    };

    const removeService = (serviceId: number) => {
        setSelectedServices((prev) => prev.filter((s) => s.service_id !== serviceId));
    };

    const changeSelectedQty = (serviceId: number, delta: number) => {
        // если qty у тебя тут не нужен для employee services — этот кусок можно убрать
    };

    const filteredServices = allServices.filter((service) => {
        const matchesSearch = service.name
            .toLowerCase()
            .includes(serviceSearch.toLowerCase());

        const alreadySelected = selectedServices.some(
            (s) => s.service_id === service.id
        );

        return matchesSearch && !alreadySelected;
    });





    const getErrorMessage = (err: any) => {
        // axios style
        const msg =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message;

        if (!msg) return "Не удалось создать сотрудника. Попробуйте ещё раз.";

        // чуть “причесать” дубли типа "Не удалось создать...: Не удалось создать..."
        return String(msg).replace(/^(Не удалось создать учётную запись:\s*)+/i, "Не удалось создать учётную запись: ");
    };

    const handleSave = async () => {
        if (!branchId) {
            alert("Филиал не выбран");
            return;
        }

        setSubmitError(null);
        setIsSubmitting(true);

        try {
            // ✨ Формируем payload строго по EmployeeCreatePayload
            const payload: EmployeeCreatePayload = {
                branch_id: branchId,
                name,
                specialty,
                hire_date: hireDate,
                online_booking: 1,
                role,        // <-- ВСТАВИТЬ СЮДА
                last_name: lastName || null,
                phone: phone || null,
                email: email || null,
            };

            // ✨ Вызываем createEmployee и сохраняем результат
            const newEmployee = await createEmployee(payload);

            // 2. создаём график
            await createSchedule({
                employee_id: newEmployee.id,
                schedule_type: "weekly",
                start_date: localStartDate,
                end_date: localEndDate,
                night_shift: 0,
                periods: periods.map((p) => [p.day, p.start, p.end]) as [string, string, string][],
            });

            // 3. сохраняем услуги
            const normalized: EmployeeServicePayload[] = selectedServices.map((s) => ({
                service_id: s.service_id,
                individual_price: s.individual_price ?? 0,
                duration_minutes: s.duration_minutes ?? 0,
            }));

            if (normalized.length > 0) {
                await syncServices({
                    employeeId: newEmployee.id,
                    services: normalized,
                });
            }

            //console.log("✅ Сотрудник успешно создан:", newEmployee);

            console.log("✅ Сотрудник успешно создан:", newEmployee);

            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
                onSave();
                onClose();
            }, 2000);

            return; // важно
        } catch (err) {
            /*console.error("❌ Ошибка при создании сотрудника:", err);
            alert("Не удалось создать сотрудника");*/
            console.error("❌ Ошибка при создании сотрудника:", err);
           setSubmitError(getErrorMessage(err)); // ✅ вот тут
        } finally {
            setIsSubmitting(false);
        }
    };

    // ✅ создание услуги прямо из модалки сотрудника
    const handleCreateService = async () => {
        if (!newServiceName || !branchId) return;

        try {
            await createService({
                branch_id: branchId,
                name: newServiceName,
                base_price: newServicePrice,
                duration_minutes: newServiceDuration,
                online_booking: 1,
                online_booking_name: newServiceName,
                online_booking_description: "",
            });

            // очищаем поля
            setNewServiceName("");
            setNewServicePrice(0);
            setNewServiceDuration(30);

            // обновляем список услуг везде, где используется useServices()
            queryClient.invalidateQueries({ queryKey: ["services"] });
        } catch (err) {
            console.error("❌ Ошибка при создании услуги:", err);
            alert("Не удалось создать услугу");
        }
    };


    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
            <div className="bg-white w-full sm:w-[28rem] h-full shadow-lg flex flex-col">
                {/* Вкладки */}
                <div className="flex justify-around border-b bg-gray-50">
                    {["info", "schedule", "services"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-3 text-sm capitalize transition ${
                                activeTab === tab
                                    ? "border-b-2 border-green-500 font-semibold text-green-600"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {tab === "info" && "Основное"}
                            {tab === "schedule" && "График"}
                            {tab === "services" && "Услуги"}
                        </button>
                    ))}
                </div>

                {/* Контент */}
                <div className="flex-1 overflow-y-auto p-4 text-black space-y-4 bg-gray-50">
                    {activeTab === "info" && (
                        <div className="space-y-4">
                            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                        placeholder="Имя"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                        placeholder="Фамилия"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Специализация</label>
                                    <input
                                        type="text"
                                        value={specialty}
                                        onChange={(e) => setSpecialty(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                        placeholder="Например: массажист"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Роль в системе</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as EmployeeRole)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                    >
                                        {ROLE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Статус сотрудника: ГД, админ или мастер.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                        placeholder="+7..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Дата найма</label>
                                    <input
                                        type="date"
                                        value={hireDate}
                                        onChange={(e) => setHireDate(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "schedule" && (
                        <div className="space-y-4">
                            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                                <div>
                                    <label className="block mb-1 font-semibold">Дата начала</label>
                                    <input
                                        type="date"
                                        value={localStartDate}
                                        onChange={(e) => setLocalStartDate(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold">Дата окончания</label>
                                    <input
                                        type="date"
                                        value={localEndDate}
                                        onChange={(e) => setLocalEndDate(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block font-semibold mb-2">Периоды</label>
                                {periods.map((p, i) => (
                                    <div key={i} className="flex gap-2 items-center bg-gray-50 border border-gray-200 rounded-xl p-2">
                                        <select
                                            value={p.day}
                                            onChange={(e) =>
                                                setPeriods((prev) =>
                                                    prev.map((x, idx) => (idx === i ? { ...x, day: e.target.value } : x))
                                                )
                                            }
                                            className="p-2 border rounded  w-1/4"
                                        >
                                            <option value="mon">Пн</option>
                                            <option value="tue">Вт</option>
                                            <option value="wed">Ср</option>
                                            <option value="thu">Чт</option>
                                            <option value="fri">Пт</option>
                                            <option value="sat">Сб</option>
                                            <option value="sun">Вс</option>
                                        </select>
                                        <input
                                            type="time"
                                            value={p.start}
                                            onChange={(e) =>
                                                setPeriods((prev) =>
                                                    prev.map((x, idx) => (idx === i ? { ...x, start: e.target.value } : x))
                                                )
                                            }
                                            className="p-2 border rounded w-1/3"
                                        />
                                        <input
                                            type="time"
                                            value={p.end}
                                            onChange={(e) =>
                                                setPeriods((prev) =>
                                                    prev.map((x, idx) => (idx === i ? { ...x, end: e.target.value } : x))
                                                )
                                            }
                                            className="p-2 border rounded w-1/3"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setPeriods((prev) => prev.filter((_, idx) => idx !== i))}
                                            className="text-red-500"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setPeriods((prev) => [...prev, { day: "mon", start: "09:00", end: "18:00" }])}
                                    className="text-green-600"
                                >
                                    + Добавить период
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "services" && (
                        <div className="space-y-4">
                            {/* Новый блок создания услуги */}
                            <div className="bg-white bborder border-gray-200 rounded-2xl p-4 space-y-4">
                                <h4 className="font-semibold mb-2">Новая услуга</h4>
                                <input
                                    type="text"
                                    value={newServiceName}
                                    onChange={(e) => setNewServiceName(e.target.value)}
                                    placeholder="Название"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                />
                                <input
                                    type="number"
                                    value={newServicePrice}
                                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                                    placeholder="Цена"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                />
                                <input
                                    type="number"
                                    value={newServiceDuration}
                                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                                    placeholder="Минуты"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateService}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Добавить
                                </button>
                            </div>

                            {/* Picker услуг */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold">Выберите услуги</h4>
                                </div>

                                <div className="border border-gray-200 rounded-2xl p-3 bg-white relative">
                                    {/* Выбранные услуги */}
                                    {selectedServices.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {selectedServices.map((selected) => {
                                                const service = allServices.find(
                                                    (item) => item.id === selected.service_id
                                                );
                                                if (!service) return null;

                                                return (
                                                    <div
                                                        key={selected.service_id}
                                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <div className="font-medium text-sm text-gray-800 truncate">
                                                                    {service.name}
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => removeService(selected.service_id)}
                                                                className="text-gray-400 hover:text-red-500"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                                            <div>
                                                                <label className="block text-xs text-gray-500 mb-1">
                                                                    Индивидуальная цена
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={
                                                                        selected.individual_price ??
                                                                        service.base_price
                                                                    }
                                                                    onChange={(e) =>
                                                                        setSelectedServices((prev) =>
                                                                            prev.map((s) =>
                                                                                s.service_id === service.id
                                                                                    ? {
                                                                                        ...s,
                                                                                        individual_price: Number(
                                                                                            e.target.value
                                                                                        ),
                                                                                    }
                                                                                    : s
                                                                            )
                                                                        )
                                                                    }
                                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs text-gray-500 mb-1">
                                                                    Длительность, мин
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min={5}
                                                                    step={5}
                                                                    value={
                                                                        selected.duration_minutes ??
                                                                        service.duration_minutes
                                                                    }
                                                                    onChange={(e) =>
                                                                        setSelectedServices((prev) =>
                                                                            prev.map((s) =>
                                                                                s.service_id === service.id
                                                                                    ? {
                                                                                        ...s,
                                                                                        duration_minutes: Number(
                                                                                            e.target.value
                                                                                        ),
                                                                                    }
                                                                                    : s
                                                                            )
                                                                        )
                                                                    }
                                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Поиск + кнопка */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={serviceSearch}
                                            onChange={(e) => {
                                                setServiceSearch(e.target.value);
                                                setIsServiceDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsServiceDropdownOpen(true)}
                                            placeholder="Search"
                                            className="flex-1 p-2 border rounded-lg"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setIsServiceDropdownOpen((prev) => !prev)}
                                            className="w-10 h-10 rounded-lg border text-xl text-gray-600 hover:bg-gray-50"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Dropdown */}
                                    {isServiceDropdownOpen && filteredServices.length > 0 && (
                                        <div className="absolute left-2 right-2 top-full mt-2 z-20 max-h-60 overflow-y-auto rounded-lg border bg-white shadow-lg">
                                            {filteredServices.map((service) => (
                                                <button
                                                    key={service.id}
                                                    type="button"
                                                    onClick={() => addService(service)}
                                                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
                                                >
                                <span className="text-sm text-gray-800">
                                    {service.name}
                                </span>
                                                    <span className="text-sm text-gray-500">
                                    {service.base_price}₽
                                </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {isServiceDropdownOpen &&
                                        filteredServices.length === 0 &&
                                        serviceSearch.trim() !== "" && (
                                            <div className="absolute left-2 right-2 top-full mt-2 z-20 rounded-lg border bg-white shadow-lg px-3 py-2 text-sm text-gray-500">
                                                Ничего не найдено
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Футер */}
                <div className="p-4 border-t bg-white flex justify-end gap-2 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">


                    <div className="p-4">
                        {submitError && (
                            <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {submitError}
                            </div>
                        )}

                        {success && (
                            <div className="mb-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                                ✅ Сотрудник успешно создан!
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-300 rounded"
                            >
                                Закрыть
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
                            >
                                {isSubmitting ? "Создание..." : "Создать"}
                            </button>
                        </div>
                    </div>

                    {/*<button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
                        Закрыть
                    </button>*/}
                    {/*<button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded">
                        Создать
                    </button>*/}
                </div>

                {/*submitError && (
                    <div className="mx-4 mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {submitError}
                    </div>
                )*/}

            </div>
        </div>
    );
};
