// components/schedulePage/CreateEmployeeModal.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useCreateEmployee } from "@/hooks/useEmployees";
import { useCreateEmployeeSchedule } from "@/hooks/useEmployeeSchedules";
import {useCreateService, useServices, useSyncEmployeeServices} from "@/hooks/useServices";
import { EmployeeService as EmployeeServicePayload } from "@/services/servicesApi";
import { EmployeeCreatePayload, EmployeeRole } from "@/services/employeeApi";
import {useQueryClient} from "@tanstack/react-query";
import { Clock, CalendarDays } from "lucide-react";
import {
    normalizePhoneInput,
    isValidPhone,
    getPhoneDigitsCount,
    MIN_PHONE_DIGITS,
} from "@/components/utils/phone";


type Props = {
    isOpen: boolean;
    branchId: number | null;
    onClose: () => void;
    onSave: () => void; // вызываем после успешного создания
};


type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type WeeklyPeriod = {
    day: WeekDay;
    start: string;
    end: string;
};

const WEEK_DAYS: { value: WeekDay; label: string }[] = [
    { value: "mon", label: "Пн" },
    { value: "tue", label: "Вт" },
    { value: "wed", label: "Ср" },
    { value: "thu", label: "Чт" },
    { value: "fri", label: "Пт" },
    { value: "sat", label: "Сб" },
    { value: "sun", label: "Вс" },
];

const WORK_DAYS: WeekDay[] = ["mon", "tue", "wed", "thu", "fri"];
const ALL_DAYS: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const sortPeriodsByWeekDay = (items: WeeklyPeriod[]) => {
    const order: Record<WeekDay, number> = {
        mon: 0,
        tue: 1,
        wed: 2,
        thu: 3,
        fri: 4,
        sat: 5,
        sun: 6,
    };

    return [...items].sort((a, b) => order[a.day] - order[b.day]);
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
    //const [phone, setPhone] = useState("");
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

    const [phone, setPhone] = useState("");
    const [touched, setTouched] = useState(false);

    /*const inputClass =
        "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-white";*/

    const phoneIsValid = isValidPhone(phone);
    const showError = touched && phone.length > 0 && !phoneIsValid;

    const queryClient = useQueryClient();

    const inputClass = "w-full px-4 py-3 rounded-xl \
border border-gray-200 dark:border-white/10 \
bg-white dark:bg-white/5 \
text-black dark:text-white \
transition \
focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500";

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
        setPeriods([{ day: "mon" as WeekDay, start: "09:00", end: "18:00" }]);

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


    const copyPeriodToDays = (targetDays: WeekDay[]) => {
        setPeriods((prev) => {
            const basePeriod = prev[0] ?? { day: "mon" as WeekDay, start: "09:00", end: "18:00" };

            const existingDays = new Set(prev.map((p) => p.day));
            const newPeriods: WeeklyPeriod[] = [...prev];

            targetDays.forEach((day) => {
                if (!existingDays.has(day)) {
                    newPeriods.push({
                        day,
                        start: basePeriod.start,
                        end: basePeriod.end,
                    });
                }
            });

            return sortPeriodsByWeekDay(newPeriods);
        });
    };

    const handleCopyToWorkWeek = () => {
        copyPeriodToDays(WORK_DAYS);
    };

    const handleCopyToFullWeek = () => {
        copyPeriodToDays(ALL_DAYS);
    };



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
            <div className="bg-[rgb(var(--background))] text-[rgb(var(--foreground))] w-full sm:w-[28rem] h-full shadow-lg rounded-l-2xl rounded-tr-2xl overflow-hidden flex flex-col">


                <div className="sticky top-0 z-20 border-b border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[rgb(var(--card))]/95 backdrop-blur-md">
                    <div className="flex items-start justify-between px-4 py-0">
                        <div className="flex items-start gap-3 min-w-0">
                            <span className="mt-[1.3rem] h-2 w-2 rounded-full bg-emerald-400 shrink-0" />

                            <h2 className="text-[17px] leading-[2.75] font-semibold truncate">
                                Создание сотрудника
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
                            ×
                        </button>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
                </div>

                {/* Вкладки */}
                <div className="flex justify-around border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[rgb(var(--card))]">
                    {["info", "schedule", "services"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-3 text-sm capitalize transition ${
                                activeTab === tab
                                    ? "border-b-2 border-green-500 font-semibold text-green-600"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            }`}
                        >
                            {tab === "info" && "Основное"}
                            {tab === "schedule" && "График"}
                            {tab === "services" && "Услуги"}
                        </button>
                    ))}
                </div>

                {/* Контент */}
                <div className="flex-1 overflow-y-auto p-4 text-black dark:text-white space-y-4 bg-gray-50 dark:bg-[rgb(var(--background))]">
                    {activeTab === "info" && (
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={inputClass}
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
                                        className={inputClass}
                                        placeholder="Фамилия"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Специализация</label>
                                    <input
                                        type="text"
                                        value={specialty}
                                        onChange={(e) => setSpecialty(e.target.value)}
                                        className={inputClass}
                                        placeholder="Например: массажист"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Роль в системе</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as EmployeeRole)}
                                        className={`${inputClass} bg-white dark:bg-[rgb(var(--card))] text-black dark:text-white`}
                                    >
                                        {ROLE_OPTIONS.map((opt) => (
                                            <option
                                                key={opt.value}
                                                value={opt.value}
                                                className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white"
                                            >
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Статус сотрудника: ГД, админ или мастер.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={inputClass}
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
                                        onBlur={() => setTouched(true)}
                                        className={inputClass}
                                        placeholder="+..."
                                        inputMode="numeric"
                                        autoComplete="tel"
                                    />

                                    {showError && (
                                        <p className="mt-1 text-xs text-red-500">
                                            Введите корректный номер: от {MIN_PHONE_DIGITS} цифр, только цифры и “+” в начале.
                                        </p>
                                    )}

                                    <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
                                        Цифр: {getPhoneDigitsCount(phone)}
                                    </p>

                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Дата найма</label>
                                    <div className="relative">
                                    <input
                                        type="date"
                                        value={hireDate}
                                        onChange={(e) => setHireDate(e.target.value)}
                                        className={inputClass}
                                    />
                                        <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "schedule" && (
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала</label>
                                    <div className="relative">
                                    <input
                                        type="date"
                                        value={localStartDate}
                                        onChange={(e) => setLocalStartDate(e.target.value)}
                                        className={`${inputClass} appearance-none`}
                                    />
                                        <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания</label>
                                    <div className="relative">
                                    <input
                                        type="date"
                                        value={localEndDate}
                                        onChange={(e) => setLocalEndDate(e.target.value)}
                                        className={`${inputClass} appearance-none`}
                                    />
                                        <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Периоды</label>
                                {periods.map((p, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-2 items-center rounded-2xl border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] p-2"
                                    >
                                        <select
                                            value={p.day}
                                            onChange={(e) =>
                                                setPeriods((prev) =>
                                                    prev.map((x, idx) =>
                                                        idx === i ? { ...x, day: e.target.value as WeekDay } : x
                                                    )
                                                )
                                            }
                                            className={`${inputClass} max-w-[7.5rem]`}
                                        >
                                            {WEEK_DAYS.map((day) => (
                                                <option
                                                    key={day.value}
                                                    value={day.value}
                                                    className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white"
                                                >
                                                    {day.label}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="relative flex-1">
                                        <input
                                            type="time"
                                            value={p.start}
                                            onChange={(e) =>
                                                setPeriods((prev) =>
                                                    prev.map((x, idx) => (idx === i ? { ...x, start: e.target.value } : x))
                                                )
                                            }
                                            /*className={`${inputClass} pr-10`}*/
                                            className="w-full p-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white"
                                            required
                                        />
                                            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>

                                        <div className="relative flex-1">
                                        <input
                                            type="time"
                                            value={p.end}
                                            onChange={(e) =>
                                                setPeriods((prev) =>
                                                    prev.map((x, idx) => (idx === i ? { ...x, end: e.target.value } : x))
                                                )
                                            }
                                            /*className={`${inputClass} pr-10`}*/
                                            className="w-full p-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white"
                                            required
                                        />

                                            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white pointer-events-none" />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setPeriods((prev) => prev.filter((_, idx) => idx !== i))}
                                            className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 transition"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPeriods((prev) => [...prev, { day: "mon", start: "09:00", end: "18:00" }])
                                    }
                                    className="mt-2 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-500/10 transition"
                                >
                                    + Добавить период
                                </button>

                                <div className="mt-4 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[rgb(var(--card))] p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                                        Быстрое заполнение
                                    </div>

                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={handleCopyToWorkWeek}
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10
bg-white dark:bg-white/10
px-4 py-3 text-sm font-medium
text-gray-700 dark:text-white
hover:bg-gray-100 dark:hover:bg-white/20
transition"
                                        >
                                            Скопировать на Пн–Пт
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleCopyToFullWeek}
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10
bg-white dark:bg-white/10
px-4 py-3 text-sm font-medium
text-gray-700 dark:text-white
hover:bg-gray-100 dark:hover:bg-white/20
transition"
                                        >
                                            Скопировать на всю неделю
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {activeTab === "services" && (
                        <div className="space-y-4">
                            {/* Новый блок создания услуги */}
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                                <h4 className="font-semibold text-black dark:text-white mb-2">Новая услуга</h4>
                                <input
                                    type="text"
                                    value={newServiceName}
                                    onChange={(e) => setNewServiceName(e.target.value)}
                                    placeholder="Название"
                                    className={inputClass}
                                />
                                <input
                                    type="number"
                                    value={newServicePrice}
                                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                                    placeholder="Цена"
                                    className={inputClass}
                                />
                                <input
                                    type="number"
                                    value={newServiceDuration}
                                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                                    placeholder="Минуты"
                                    className={inputClass}
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Выберите услуги</label>
                                </div>

                                <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-3 bg-white dark:bg-white/5 relative">
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
                                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[rgb(var(--card))] px-3 py-3"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <div className="font-medium text-sm text-gray-800 dark:text-white truncate">
                                                                    {service.name}
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => removeService(selected.service_id)}
                                                                className="text-gray-400 dark:text-gray-500 hover:text-red-500"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                                            <div>
                                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
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
                                                                    className={inputClass}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
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
                                                                    className={inputClass}
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
                                            placeholder="Поиск услуг"
                                            className={inputClass}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setIsServiceDropdownOpen((prev) => !prev)}
                                            className=" relative w-[3.125rem] h-[3.125rem] rounded-xl flex items-center justify-center  bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-white/10 hover:shadow-md"
                                        >
                                            <span className="text-lg leading-none">+</span>
                                        </button>
                                    </div>

                                    {/* Dropdown */}
                                    {isServiceDropdownOpen && filteredServices.length > 0 && (
                                        <div className="absolute left-2 right-2 top-full mt-2 z-20 max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[rgb(var(--card))] shadow-lg">
                                            {filteredServices.map((service) => (
                                                <button
                                                    key={service.id}
                                                    type="button"
                                                    onClick={() => addService(service)}
                                                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/10"
                                                >
                                <span className="text-sm text-gray-800 dark:text-white">
                                    {service.name}
                                </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {service.base_price}₽
                                </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {isServiceDropdownOpen &&
                                        filteredServices.length === 0 &&
                                        serviceSearch.trim() !== "" && (
                                            <div className="absolute left-2 right-2 top-full mt-2 z-20 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[rgb(var(--card))] shadow-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                                Ничего не найдено
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Футер */}
                <div className="sticky bottom-0 z-20 border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[rgb(var(--card))]/95 backdrop-blur-md px-4 py-4">

                    {(submitError || success) && (
                        <div className="mb-3">
                            {submitError && (
                                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                                    {submitError}
                                </div>
                            )}
                            {success && (
                                <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                                    ✅ Сотрудник создан
                                </div>
                            )}
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
                            disabled={isSubmitting}
                            className={`
        h-11 px-5 rounded-xl font-medium text-white transition
        ${
                                isSubmitting
                                    ? "bg-green-500/70 cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700"
                            }
      `}
                        >
                            {isSubmitting ? "Создание..." : "Создать"}
                        </button>
                    </div>
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
