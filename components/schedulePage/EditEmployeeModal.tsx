// components\schedulePage\EditEmployeeModal.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Employee, EmployeeRole } from "@/services/employeeApi";
import { useEmployeeSchedules, useCreateEmployeeSchedule, useUpdateEmployeeSchedule } from "@/hooks/useEmployeeSchedules";
import { useServices, useEmployeeServices, useSyncEmployeeServices } from "@/hooks/useServices";
//import { EmployeeService } from "@/services/servicesApi";
import { EmployeeService as EmployeeServicePayload } from "@/services/servicesApi";
import {useDeleteEmployee} from "@/hooks/useEmployees";
import {CalendarDays, Clock} from "lucide-react";
import {
    normalizePhoneInput,
    isValidPhone,
    getPhoneDigitsCount,
    MIN_PHONE_DIGITS,
} from "@/components/utils/phone";

type Props = {
    isOpen: boolean;
    employee: Employee | null;
    onClose: () => void;
    onSave: (updated: Employee) => void;
};


type WeeklyPeriod = {
    day: WeekDay;  // "mon" | "tue" | ... — можно уточнить тип позже
    start: string; // "HH:mm"
    end: string; // "HH:mm"
};

type EmployeeService = {
    service_id: number;
    individual_price?: number;
    duration_minutes?: number;
};

type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const ROLE_OPTIONS: { value: EmployeeRole; label: string }[] = [
    { value: "gd", label: "ГД (владелец)" },
    { value: "admin", label: "Админ" },
    { value: "master", label: "Мастер" },
];

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

export const EditEmployeeModal: React.FC<Props> = ({ isOpen, employee, onClose, onSave }) => {
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [specialty, setSpecialty] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [hireDate, setHireDate] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"info" | "schedule" | "services">("info");
    const [role, setRole] = useState<EmployeeRole>("master");

    // --- Состояния для графика ---
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [periods, setPeriods] = useState<WeeklyPeriod[]>([]);
    const [scheduleId, setScheduleId] = useState<number | null>(null);

    // API-хуки
    const { mutateAsync: createSchedule } = useCreateEmployeeSchedule();
    const { mutateAsync: updateSchedule } = useUpdateEmployeeSchedule();

    const { data: allServices = [] } = useServices();
    const { data: employeeServices = [] } = useEmployeeServices(employee?.id);
    const { mutateAsync: syncServices } = useSyncEmployeeServices();
    const deleteEmployeeMutation = useDeleteEmployee();

    const [selectedServices, setSelectedServices] = useState<EmployeeService[]>([]);


    // --- состояния для загрузки графика ---
    const [scheduleStartDate, setScheduleStartDate] = useState<string>("");
    const [scheduleEndDate, setScheduleEndDate] = useState<string>("");

// --- состояния для редактирования в форме ---
    const [localStartDate, setLocalStartDate] = useState<string>("");
    const [localEndDate, setLocalEndDate] = useState<string>("");

    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const [serviceSearch, setServiceSearch] = useState("");
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
    const [touched, setTouched] = useState(false);

    const phoneIsValid = isValidPhone(phone);
    const showError = touched && phone.length > 0 && !phoneIsValid;




    const inputClass = "w-full px-4 py-3 rounded-xl \
border border-gray-200 dark:border-white/10 \
bg-white dark:bg-white/5 \
text-black dark:text-white \
transition \
focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500";



    useEffect(() => {
        if (employee && isOpen) {
            setName(employee.name);
            setLastName(employee.last_name ?? "");
            setPhone(employee.phone ?? "");
            setSpecialty(employee.specialty ?? "");
            setEmail(employee.email ?? "");
            setHireDate(employee.hire_date ?? "");
            setRole((employee.role ?? "master") as EmployeeRole);

            // Загружаем график
            const today = new Date();
            const defaultStart = today.toISOString().split("T")[0];
            const defaultEnd = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0];

            /*setStartDate(start);
            setEndDate(end);*/

            // Только если пустые — подставляем дефолты
            setStartDate((prev) => prev || defaultStart);
            setEndDate((prev) => prev || defaultEnd);
        }
    }, [employee, isOpen]);

    // Подгружаем расписания из API
    /*const { data: schedules } = useEmployeeSchedules(
        branchId,          // ✅ используем branchId,
        employee?.id,
        startDate,
        endDate
    );*/

    // загружаем график (API)
    const { data: schedules } = useEmployeeSchedules(
        employee?.branch_id,
        employee?.id,
        scheduleStartDate,
        scheduleEndDate
    );

    // Если пришли данные из API
// при открытии модалки
    useEffect(() => {
        if (employee && isOpen) {
            const today = new Date();
            const defaultStart = today.toISOString().split("T")[0];
            const defaultEnd = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0];

            setScheduleStartDate(defaultStart); // только для загрузки API
            setScheduleEndDate(defaultEnd);

            setLocalStartDate(defaultStart); // для формы
            setLocalEndDate(defaultEnd);
        }
    }, [employee, isOpen]);


    useEffect(() => {
        if (isOpen) {
            setSubmitError(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

// когда пришли данные из API
    useEffect(() => {
        if (schedules && schedules.length > 0) {
            const s = schedules[0];
            setScheduleId(s.id);
            setLocalStartDate(s.start_date);
            setLocalEndDate(s.end_date);

            setPeriods(
                s.periods.map((p) => ({
                    day: p[0] as WeekDay,
                    start: p[1],
                    end: p[2],
                }))
            );
        }
    }, [schedules]);

    useEffect(() => {
        if (!isOpen) return;
        setActiveTab("info");
        setServiceSearch("");
        setIsServiceDropdownOpen(false);
        setSubmitError(null);
        setSuccess(false);
    }, [isOpen]);


    // Загружаем выбранные услуги при открытии
    useEffect(() => {
        if (!isOpen || !employee?.id) return;

        console.log("🔧 Открыта модалка для сотрудника:", employee?.name ?? "—");

        const newServices = (employeeServices ?? []).map((s) => ({
            service_id: s.service_id,
            individual_price: s.individual_price,
            duration_minutes: s.duration_minutes,
        }));

        // Сравнение, чтобы не вызывать setState если данные не поменялись
        setSelectedServices((prev) => {
            const isEqual =
                prev.length === newServices.length &&
                prev.every((p, i) =>
                    p.service_id === newServices[i].service_id &&
                    p.individual_price === newServices[i].individual_price &&
                    p.duration_minutes === newServices[i].duration_minutes
                );

            return isEqual ? prev : newServices;
        });
    }, [employee?.id, isOpen, employeeServices]);




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

    const addService = (serviceId: number) => {
        const service = allServices.find((s) => s.id === serviceId);
        if (!service) return;

        setSelectedServices((prev) => {
            const exists = prev.some((s) => s.service_id === serviceId);
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

    const filteredServices = allServices.filter((service) => {
        const matchesSearch = service.name
            .toLowerCase()
            .includes(serviceSearch.toLowerCase());

        const alreadySelected = selectedServices.some(
            (s) => s.service_id === service.id
        );

        return matchesSearch && !alreadySelected;
    });

    /*const updateField = (serviceId: number, field: "price" | "duration", value: number) => {
        setSelectedServices(prev =>
            prev.map(s =>
                s.service_id === serviceId ? { ...s, [field]: value } : s
            )
        );
    };*/




    const addPeriod = () => setPeriods(prev => [...prev, { day: "mon", start: "09:00", end: "18:00" }]);
    const updatePeriod = (i: number, field: keyof WeeklyPeriod, value: string) =>
        setPeriods(prev => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
    const removePeriod = (i: number) => setPeriods(prev => prev.filter((_, idx) => idx !== i));


    const copyPeriodToDays = (targetDays: WeekDay[]) => {
        setPeriods((prev) => {
            const basePeriod = prev[0] ?? { day: "mon", start: "09:00", end: "18:00" };

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


    if (!isOpen || !employee) return null;


    const getErrorMessage = (err: any) => {
        const msg =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message;

        if (!msg) return "Не удалось сохранить изменения. Попробуйте ещё раз.";

        return String(msg)
            .replace(/^(Не удалось создать учётную запись:\s*)+/i, "Не удалось создать учётную запись: ")
            .replace(/^(Не удалось обновить учётную запись:\s*)+/i, "Не удалось обновить учётную запись: ");
    };
// Сохранение данных
    const handleSave = async () => {
        if (!employee) return;

        setSubmitError(null);
        setIsSubmitting(true);

        try {
            const updatedEmployee: Employee = {
                ...employee,
                name,
                last_name: lastName,
                phone,
                specialty,
                email,
                hire_date: hireDate,
                role,
            };

            // 1. Сохраняем сотрудника
            await onSave(updatedEmployee);

            // 2. Сохраняем график
            const payload = {
                id: scheduleId ?? 0,
                employee_id: employee.id,
                schedule_type: "weekly" as const,
                start_date: localStartDate,
                end_date: localEndDate,
                night_shift: 0,
                periods: periods.map((p) => [p.day, p.start, p.end]) as [string, string, string][],
            };

            if (scheduleId) {
                await updateSchedule(payload);
            } else {
                await createSchedule(payload);
            }

            // 3. Синхронизация услуг
            const normalized: EmployeeServicePayload[] = selectedServices.map((s) => ({
                service_id: s.service_id,
                individual_price: s.individual_price ?? 0,
                duration_minutes: s.duration_minutes ?? 0,
            }));

            await syncServices({
                employeeId: employee.id,
                services: normalized,
            });

            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1500);
        } catch (err) {
            console.error("❌ Ошибка сохранения:", err);
            setSubmitError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
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
                                Редактирование сотрудника
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
                <div className="flex-1 overflow-y-auto p-4 text-black dark:text-white">
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
                                    <p className="text-xs text-gray-500 mt-1">
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
                                        onChange={(e) => setPhone(e.target.value)}
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

                            {/* Тип графика */}
                            {/*<div>
                                <label className="block mb-1 font-semibold">Тип графика</label>
                                <select
                                    value="weekly"
                                    className={inputClass}
                                    disabled
                                >
                                    <option value="weekly">Еженедельный — график повторяется по дням недели</option>
                                </select>
                            </div>*/}


                            {/* Даты */}
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала</label>
                                    <div className="relative">
                                    <input
                                        type="date"
                                        value={localStartDate}
                                        onChange={(e) => setLocalStartDate(e.target.value)}
                                        className={`${inputClass} bg-white dark:bg-[rgb(var(--card))] text-black dark:text-white`}
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
                                        className={`${inputClass} bg-white dark:bg-[rgb(var(--card))] text-black dark:text-white`}
                                    />
                                        <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Периоды */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Периоды</label>

                                {/* Контейнер с прокруткой */}
                                <div className="max-h-96 overflow-y-auto pr-1">
                                    {periods.map((p, i) => (
                                        <div key={i}
                                             className="flex gap-2 items-center rounded-2xl border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] p-2"
                                        >
                                            {/* Стрелки */}
                                            <div className="flex flex-col items-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (i === 0) return;
                                                        const copy = [...periods];
                                                        [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
                                                        setPeriods(copy);
                                                    }}
                                                    disabled={i === 0}
                                                    className="text-gray-500 disabled:opacity-30 hover:text-black"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (i === periods.length - 1) return;
                                                        const copy = [...periods];
                                                        [copy[i + 1], copy[i]] = [copy[i], copy[i + 1]];
                                                        setPeriods(copy);
                                                    }}
                                                    disabled={i === periods.length - 1}
                                                    className="text-gray-500 disabled:opacity-30 hover:text-black"
                                                >
                                                    ↓
                                                </button>
                                            </div>

                                            {/* День */}
                                            <select
                                                value={p.day}
                                                onChange={(e) =>
                                                    setPeriods(prev =>
                                                        prev.map((x, idx) =>
                                                            idx === i ? { ...x, day: e.target.value as WeekDay } : x
                                                        )
                                                    )
                                                }
                                                className={inputClass}
                                            >
                                                {/*<option value="mon">Пн</option>
                                                <option value="tue">Вт</option>
                                                <option value="wed">Ср</option>
                                                <option value="thu">Чт</option>
                                                <option value="fri">Пт</option>
                                                <option value="sat">Сб</option>
                                                <option value="sun">Вс</option>*/}

                                                {WEEK_DAYS.map((day) => (
                                                    <option key={day.value}
                                                            value={day.value}
                                                            className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white">
                                                        {day.label}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Время начала / конца */}
                                            <div className="relative flex-1">
                                            <input
                                                type="time"
                                                value={p.start}
                                                onChange={(e) =>
                                                    setPeriods(prev =>
                                                        prev.map((x, idx) =>
                                                            idx === i ? { ...x, start: e.target.value } : x
                                                        )
                                                    )
                                                }
                                                /*className={`${inputClass} max-w-[7rem]`}*/
                                                className="w-full p-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white"
                                                required
                                            />

                                                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white pointer-events-none" />
                                            </div>

                                            <div className="relative flex-1">
                                            <input
                                                type="time"
                                                value={p.end}
                                                onChange={(e) =>
                                                    setPeriods(prev =>
                                                        prev.map((x, idx) =>
                                                            idx === i ? { ...x, end: e.target.value } : x
                                                        )
                                                    )
                                                }
                                                /*className={`${inputClass} max-w-[7rem]`}*/
                                                className="w-full p-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white"
                                                required
                                            />

                                                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white pointer-events-none" />
                                            </div>

                                            {/* Удаление */}
                                            <button
                                                type="button"
                                                onClick={() => setPeriods(prev => prev.filter((_, idx) => idx !== i))}
                                                className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 transition"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Добавить период */}
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
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Выберите услуги</label>
                                </div>

                                <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-3 bg-white dark:bg-white/5 relative">
                                    {selectedServices.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                            {selectedServices.map((selected) => {
                                                const service = allServices.find((s) => s.id === selected.service_id);
                                                if (!service) return null;

                                                return (
                                                    <div
                                                        key={selected.service_id}
                                                        className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[rgb(var(--card))] px-3 py-3"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <div className="font-medium text-gray-800 dark:text-white truncate">
                                                                    {service.name}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    Базовая: {service.base_price}₽ · {service.duration_minutes} мин
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => removeService(selected.service_id)}
                                                                className="text-gray-400 dark:text-gray-500 hover:text-red-500 text-lg leading-none"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                                            <div>
                                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                                    Инд. цена
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={selected.individual_price ?? service.base_price}
                                                                    onChange={(e) =>
                                                                        setSelectedServices((prev) =>
                                                                            prev.map((s) =>
                                                                                s.service_id === service.id
                                                                                    ? {
                                                                                        ...s,
                                                                                        individual_price: Number(e.target.value),
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
                                                                    Минут
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min={5}
                                                                    step={5}
                                                                    value={selected.duration_minutes ?? service.duration_minutes}
                                                                    onChange={(e) =>
                                                                        setSelectedServices((prev) =>
                                                                            prev.map((s) =>
                                                                                s.service_id === service.id
                                                                                    ? {
                                                                                        ...s,
                                                                                        duration_minutes: Number(e.target.value),
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

                                    {isServiceDropdownOpen && filteredServices.length > 0 && (
                                        <div className="absolute left-2 right-2 top-full mt-2 z-20 max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[rgb(var(--card))] shadow-lg">
                                            {filteredServices.map((service) => (
                                                <button
                                                    key={service.id}
                                                    type="button"
                                                    onClick={() => addService(service.id)}
                                                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/10"
                                                >
                                                    <span className="text-sm text-gray-800 dark:text-white">{service.name}</span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">{service.base_price}₽</span>
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

                            {allServices.length === 0 && (
                                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                                    Нет доступных услуг для филиала
                                </p>
                            )}
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
                                    ✅ Сохранено
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between gap-3">
                        {/* Удалить */}
                        <button
                            onClick={async () => {
                                if (!employee?.id) return;
                                if (confirm("Удалить этого сотрудника?")) {
                                    try {
                                        await deleteEmployeeMutation.mutateAsync(employee.id);
                                        onClose();
                                    } catch {
                                        alert("Ошибка при удалении");
                                    }
                                }
                            }}
                            className="
        h-11 px-5 rounded-xl border
        bg-red-50 text-red-600 border-red-200
        hover:bg-red-100 transition
      "
                        >
                            Удалить
                        </button>

                        <div className="flex gap-3">
                            {/* Закрыть */}
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

                            {/* Сохранить */}
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
                                {isSubmitting ? "Сохранение..." : "Сохранить"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
