// components\schedulePage\EditEmployeeModal.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Employee, EmployeeRole } from "@/services/employeeApi";
import { useEmployeeSchedules, useCreateEmployeeSchedule, useUpdateEmployeeSchedule } from "@/hooks/useEmployeeSchedules";
import { useServices, useEmployeeServices, useSyncEmployeeServices } from "@/hooks/useServices";
//import { EmployeeService } from "@/services/servicesApi";
import { EmployeeService as EmployeeServicePayload } from "@/services/servicesApi";
import {useDeleteEmployee} from "@/hooks/useEmployees";

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
                <div className="flex-1 overflow-y-auto p-4 text-black">
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

                            {/* Тип графика */}
                            <div>
                                <label className="block mb-1 font-semibold">Тип графика</label>
                                <select
                                    value="weekly"
                                    className="w-full p-2 border rounded"
                                    disabled
                                >
                                    <option value="weekly">Еженедельный — график повторяется по дням недели</option>
                                </select>
                            </div>


                            {/* Даты */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 font-semibold">Дата начала</label>
                                    <input
                                        type="date"
                                        value={localStartDate}
                                        onChange={(e) => setLocalStartDate(e.target.value)}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold">Дата окончания</label>
                                    <input
                                        type="date"
                                        value={localEndDate}
                                        onChange={(e) => setLocalEndDate(e.target.value)}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                            </div>

                            {/* Периоды */}
                            <div>
                                <label className="block font-semibold mb-2">Периоды</label>

                                {/* Контейнер с прокруткой */}
                                <div className="max-h-96 overflow-y-auto pr-1">
                                    {periods.map((p, i) => (
                                        <div key={i} className="grid grid-cols-[2rem_6rem_1fr_1fr_2rem] gap-2 items-center mb-2">
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
                                                className="p-2 border rounded"
                                            >
                                                {/*<option value="mon">Пн</option>
                                                <option value="tue">Вт</option>
                                                <option value="wed">Ср</option>
                                                <option value="thu">Чт</option>
                                                <option value="fri">Пт</option>
                                                <option value="sat">Сб</option>
                                                <option value="sun">Вс</option>*/}

                                                {WEEK_DAYS.map((day) => (
                                                    <option key={day.value} value={day.value}>
                                                        {day.label}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Время начала / конца */}
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
                                                className="p-2 border rounded"
                                            />
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
                                                className="p-2 border rounded"
                                            />

                                            {/* Удаление */}
                                            <button
                                                type="button"
                                                onClick={() => setPeriods(prev => prev.filter((_, idx) => idx !== i))}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Добавить период */}
                                <button
                                    type="button"
                                    onClick={() => setPeriods(prev => [...prev, { day: "mon", start: "09:00", end: "18:00" }])}
                                    className="text-green-600 mt-2"
                                >
                                    + Добавить период
                                </button>

                                <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                                        Быстрое заполнение
                                    </div>

                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={handleCopyToWorkWeek}
                                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                                        >
                                            Скопировать на Пн–Пт
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleCopyToFullWeek}
                                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
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
                            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">Выберите услуги</h4>
                                </div>

                                <div className="border border-gray-200 rounded-2xl p-3 bg-white relative">
                                    {selectedServices.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                            {selectedServices.map((selected) => {
                                                const service = allServices.find((s) => s.id === selected.service_id);
                                                if (!service) return null;

                                                return (
                                                    <div
                                                        key={selected.service_id}
                                                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <div className="font-medium text-gray-800 truncate">
                                                                    {service.name}
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Базовая: {service.base_price}₽ · {service.duration_minutes} мин
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => removeService(selected.service_id)}
                                                                className="text-gray-400 hover:text-red-500 text-lg leading-none"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                                            <div>
                                                                <label className="block text-xs text-gray-500 mb-1">
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
                                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs text-gray-500 mb-1">
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
                                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
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
                                            placeholder="Поиск услуги"
                                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setIsServiceDropdownOpen((prev) => !prev)}
                                            className="w-10 h-10 rounded-lg border border-gray-200 text-xl text-gray-600 hover:bg-gray-50"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {isServiceDropdownOpen && filteredServices.length > 0 && (
                                        <div className="absolute left-2 right-2 top-full mt-2 z-20 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                            {filteredServices.map((service) => (
                                                <button
                                                    key={service.id}
                                                    type="button"
                                                    onClick={() => addService(service.id)}
                                                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
                                                >
                                                    <span className="text-sm text-gray-800">{service.name}</span>
                                                    <span className="text-sm text-gray-500">{service.base_price}₽</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {isServiceDropdownOpen &&
                                        filteredServices.length === 0 &&
                                        serviceSearch.trim() !== "" && (
                                            <div className="absolute left-2 right-2 top-full mt-2 z-20 rounded-lg border border-gray-200 bg-white shadow-lg px-3 py-2 text-sm text-gray-500">
                                                Ничего не найдено
                                            </div>
                                        )}
                                </div>
                            </div>

                            {allServices.length === 0 && (
                                <p className="text-gray-500 text-sm text-center">
                                    Нет доступных услуг для филиала
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Футер */}
                <div className="p-4 border-t bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">

                    {/* Сообщения */}
                    {submitError && (
                        <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {submitError}
                        </div>
                    )}

                    {success && (
                        <div className="mb-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                            ✅ Изменения сохранены!
                        </div>
                    )}

                    {/* Кнопки */}
                    <div className="flex justify-between items-center">

                        {/* Левая часть */}
                        <div className="flex gap-2">
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
                                className="px-4 py-2 text-sm font-medium rounded-md
          bg-red-50 text-red-600 hover:bg-red-100
          border border-red-200 transition-all duration-200"
                            >
                                Удалить
                            </button>

                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium rounded-md
          bg-gray-50 text-gray-700 hover:bg-gray-100
          border border-gray-200 transition-all duration-200"
                            >
                                Закрыть
                            </button>
                        </div>

                        {/* Правая часть */}
                        <button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium rounded-md
        bg-green-600 text-white hover:bg-green-700
        shadow-sm hover:shadow-md transition-all duration-200
        disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Сохранение..." : "Сохранить"}
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
};
