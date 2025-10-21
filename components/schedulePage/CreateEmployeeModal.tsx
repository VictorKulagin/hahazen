// components/schedulePage/CreateEmployeeModal.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useCreateEmployee } from "@/hooks/useEmployees";
import { useCreateEmployeeSchedule } from "@/hooks/useEmployeeSchedules";
import {useCreateService, useServices, useSyncEmployeeServices} from "@/hooks/useServices";
import { EmployeeService as EmployeeServicePayload } from "@/services/servicesApi";
import {EmployeeCreatePayload} from "@/services/employeeApi";
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


    const queryClient = useQueryClient();

    // дефолтные даты графика
    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            const defaultStart = today.toISOString().split("T")[0];
            const defaultEnd = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0];

            setLocalStartDate(defaultStart);
            setLocalEndDate(defaultEnd);
            setPeriods([{ day: "mon", start: "09:00", end: "18:00" }]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

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

    const handleSave = async () => {
        if (!branchId) {
            alert("Филиал не выбран");
            return;
        }

        try {
            // ✨ Формируем payload строго по EmployeeCreatePayload
            const payload: EmployeeCreatePayload = {
                branch_id: branchId,
                name,
                specialty,
                hire_date: hireDate,
                online_booking: 1,      // обязательное поле
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

            console.log("✅ Сотрудник успешно создан:", newEmployee);
            onSave();
            onClose();
        } catch (err) {
            console.error("❌ Ошибка при создании сотрудника:", err);
            alert("Не удалось создать сотрудника");
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
                            <div>
                                <label className="block font-semibold mb-2">Периоды</label>
                                {periods.map((p, i) => (
                                    <div key={i} className="flex gap-2 mb-2">
                                        <select
                                            value={p.day}
                                            onChange={(e) =>
                                                setPeriods((prev) =>
                                                    prev.map((x, idx) => (idx === i ? { ...x, day: e.target.value } : x))
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
                                        <input
                                            type="time"
                                            value={p.start}
                                            onChange={(e) =>
                                                setPeriods((prev) =>
                                                    prev.map((x, idx) => (idx === i ? { ...x, start: e.target.value } : x))
                                                )
                                            }
                                            className="p-2 border rounded"
                                        />
                                        <input
                                            type="time"
                                            value={p.end}
                                            onChange={(e) =>
                                                setPeriods((prev) =>
                                                    prev.map((x, idx) => (idx === i ? { ...x, end: e.target.value } : x))
                                                )
                                            }
                                            className="p-2 border rounded"
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
                                    className="text-blue-600"
                                >
                                    + Добавить период
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "services" && (


                        <div className="space-y-4">

                            {/* === Новый блок создания услуги === */}
                            <div className="border p-3 rounded bg-gray-50">
                                <h4 className="font-semibold mb-2">Новая услуга</h4>
                                <input
                                    type="text"
                                    value={newServiceName}
                                    onChange={(e) => setNewServiceName(e.target.value)}
                                    placeholder="Название"
                                    className="w-full p-2 border rounded mb-2"
                                />
                                <input
                                    type="number"
                                    value={newServicePrice}
                                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                                    placeholder="Цена"
                                    className="w-full p-2 border rounded mb-2"
                                />
                                <input
                                    type="number"
                                    value={newServiceDuration}
                                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                                    placeholder="Минуты"
                                    className="w-full p-2 border rounded mb-2"
                                />
                                <button
                                    onClick={handleCreateService}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Добавить
                                </button>
                            </div>



                        <div className="space-y-3">
                            {allServices.map((service) => {
                                const selected = selectedServices.find((s) => s.service_id === service.id);
                                const isChecked = !!selected;

                                return (
                                    <div key={service.id} className="p-3 border rounded-lg">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleService(service.id)}
                                                className="h-4 w-4 accent-blue-600"
                                            />
                                            <span className="font-medium">{service.name}</span>
                                        </label>
                                        {isChecked && (
                                            <div className="grid grid-cols-2 gap-4 mt-2">
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
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        </div>
                    )}
                </div>

                {/* Футер */}
                <div className="p-4 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
                        Закрыть
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">
                        Создать
                    </button>
                </div>
            </div>
        </div>
    );
};
