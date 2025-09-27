"use client";
import React, { useEffect, useState } from "react";
import { Employee } from "@/services/employeeApi";
import { useEmployeeSchedules, useCreateEmployeeSchedule, useUpdateEmployeeSchedule } from "@/hooks/useEmployeeSchedules";
import { useServices, useEmployeeServices, useSyncEmployeeServices } from "@/hooks/useServices";
//import { EmployeeService } from "@/services/servicesApi";
import { EmployeeService as EmployeeServicePayload } from "@/services/servicesApi";

type Props = {
    isOpen: boolean;
    employee: Employee | null;
    onClose: () => void;
    onSave: (updated: Employee) => void;
};

type WeeklyPeriod = {
    day: string;   // "mon" | "tue" | ... — можно уточнить тип позже
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
};

type EmployeeService = {
    service_id: number;
    individual_price?: number;
    duration_minutes?: number;
};

export const EditEmployeeModal: React.FC<Props> = ({ isOpen, employee, onClose, onSave }) => {
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [specialty, setSpecialty] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [hireDate, setHireDate] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"info" | "schedule" | "services">("info");

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

    const [selectedServices, setSelectedServices] = useState<EmployeeService[]>([]);


    useEffect(() => {
        if (employee && isOpen) {
            setName(employee.name);
            setLastName(employee.last_name ?? "");
            setPhone(employee.phone ?? "");
            setSpecialty(employee.specialty ?? "");
            setEmail(employee.email ?? "");
            setHireDate(employee.hire_date ?? "");


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
    const { data: schedules } = useEmployeeSchedules(
        employee?.branch_id,
        employee?.id,
        startDate,
        endDate
    );

    // Если пришли данные из API
    useEffect(() => {
        if (schedules && schedules.length > 0) {
            const s = schedules[0];
            setScheduleId(s.id);

            // Обновляем только если пользователь не менял поля
            setStartDate(prev => prev || s.start_date);
            setEndDate(prev => prev || s.end_date);

            setPeriods(s.periods.map((p) => ({
                day: p[0],
                start: p[1],
                end: p[2]
            })));
        }
    }, [schedules]);


    // Загружаем выбранные услуги при открытии
    useEffect(() => {
        if (!isOpen) return;

        console.log("🔧 Открыта модалка для сотрудника:", employee?.name ?? "—");

        setSelectedServices(
            (employeeServices ?? []).map((s) => ({
                service_id: s.service_id,
                individual_price: s.individual_price,
                duration_minutes: s.duration_minutes,
            }))
        );
    }, [employeeServices, isOpen]);

    const toggleService = (serviceId: number) => {
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
    };

    const updateField = (serviceId: number, field: "price" | "duration", value: number) => {
        setSelectedServices(prev =>
            prev.map(s =>
                s.service_id === serviceId ? { ...s, [field]: value } : s
            )
        );
    };


    const addPeriod = () => setPeriods(prev => [...prev, { day: "mon", start: "09:00", end: "18:00" }]);
    const updatePeriod = (i: number, field: keyof WeeklyPeriod, value: string) =>
        setPeriods(prev => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
    const removePeriod = (i: number) => setPeriods(prev => prev.filter((_, idx) => idx !== i));


    if (!isOpen || !employee) return null;

// Сохранение данных
    const handleSave = async () => {
        if (!employee) return;

        try {
            // 1. Сохраняем изменения сотрудника
            await onSave({
                ...employee,
                name,
                last_name: lastName,
                phone,
                specialty,
                email,
                hire_date: hireDate,
            });

            // 2. Сохраняем график
            const payload = {
                id: scheduleId ?? 0,
                employee_id: employee.id,
                schedule_type: "weekly" as const,
                start_date: startDate,
                end_date: endDate,
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

            console.log("✅ Сотрудник, график и услуги успешно сохранены");

            // 4. Закрываем модалку
            onClose();

        } catch (err) {
            console.error("❌ Ошибка сохранения:", err);
            alert("Не удалось сохранить данные. Проверьте соединение и попробуйте снова.");
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
                                    ? "border-b-2 border-blue-500 font-semibold text-blue-600"
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
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === "info" && (
                        <>
                            <div className="mb-4">
                                <label className="block font-semibold mb-1">Имя</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    placeholder="Имя"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block font-semibold mb-1">Фамилия</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    placeholder="Фамилия"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block font-semibold mb-1">Специализация</label>
                                <input
                                    type="text"
                                    value={specialty}
                                    onChange={(e) => setSpecialty(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    placeholder="Например: массажист"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block font-semibold mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    placeholder="email@example.com"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block font-semibold mb-1">Телефон</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    placeholder="+7..."
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block font-semibold mb-1">Дата найма</label>
                                <input
                                    type="date"
                                    value={hireDate}
                                    onChange={(e) => setHireDate(e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </>
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
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold">Дата окончания</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
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
                                                        prev.map((x, idx) => idx === i ? { ...x, day: e.target.value as any } : x)
                                                    )
                                                }
                                                className="p-2 border rounded"
                                            >
                                                <option value="mon">Пн</option>
                                                <option value="tue">Вт</option>
                                                <option value="wed">Ср</option>
                                                <option value="thu">Чт</option>
                                                <option value="fri">Пт</option>
                                                <option value="sat">Сб</option>
                                                <option value="sun">Вс</option>
                                            </select>

                                            {/* Время начала / конца */}
                                            <input
                                                type="time"
                                                value={p.start}
                                                onChange={(e) =>
                                                    setPeriods(prev =>
                                                        prev.map((x, idx) => idx === i ? { ...x, start: e.target.value } : x)
                                                    )
                                                }
                                                className="p-2 border rounded"
                                            />
                                            <input
                                                type="time"
                                                value={p.end}
                                                onChange={(e) =>
                                                    setPeriods(prev =>
                                                        prev.map((x, idx) => idx === i ? { ...x, end: e.target.value } : x)
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
                                    className="text-blue-600 mt-2"
                                >
                                    + Добавить период
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "services" && (
                        <div className="space-y-3">
                            {allServices.map((service) => {
                                const selected = selectedServices.find((s) => s.service_id === service.id);
                                const isChecked = !!selected;

                                return (
                                    <div
                                        key={service.id}
                                        className="flex flex-col p-3 border rounded-lg hover:bg-gray-50 transition"
                                    >
                                        {/* Чекбокс + имя услуги */}
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleService(service.id)}
                                                    className="h-4 w-4 accent-blue-600"
                                                />
                                                <span className="font-medium text-gray-800">{service.name}</span>
                                            </label>
                                            <span className="text-gray-500 text-sm">
              Базовая: {service.base_price}₽ · {service.duration_minutes} мин
            </span>
                                        </div>

                                        {/* Индивидуальные настройки — показываем только если услуга выбрана */}
                                        {isChecked && (
                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <div>
                                                    <label className="block text-xs text-gray-500">Инд. цена</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={selected?.individual_price ?? service.base_price}
                                                        onChange={(e) =>
                                                            setSelectedServices((prev) =>
                                                                prev.map((s) =>
                                                                    s.service_id === service.id
                                                                        ? { ...s, individual_price: Number(e.target.value) }
                                                                        : s
                                                                )
                                                            )
                                                        }
                                                        className="w-full p-2 border rounded"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs text-gray-500">Минут</label>
                                                    <input
                                                        type="number"
                                                        min={5}
                                                        step={5}
                                                        value={selected?.duration_minutes ?? service.duration_minutes}
                                                        onChange={(e) =>
                                                            setSelectedServices((prev) =>
                                                                prev.map((s) =>
                                                                    s.service_id === service.id
                                                                        ? { ...s, duration_minutes: Number(e.target.value) }
                                                                        : s
                                                                )
                                                            )
                                                        }
                                                        className="w-full p-2 border rounded"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {allServices.length === 0 && (
                                <p className="text-gray-500 text-sm text-center">
                                    Нет доступных услуг для филиала
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Футер */}
                <div className="p-4 border-t bg-white flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                    >
                        Закрыть
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};
