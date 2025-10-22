//app\schedule\[id]\page
"use client";
import React, { useState } from "react";
import { useEffect } from 'react';
import { withAuth } from "@/hoc/withAuth";
import Image from "next/image";
import Link from "next/link";
import {
 Bars3Icon
} from "@heroicons/react/24/outline";
import {useRouter} from "next/navigation";
import {cabinetDashboard} from "@/services/cabinetDashboard";
import {companiesList} from "@/services/companiesList";
import {branchesList} from "@/services/branchesList";
import { useParams } from 'next/navigation';
import {Employee, fetchEmployees} from "@/services/employeeApi";
import {
    groupAppointments,
    useBookedDays,
    useCreateAppointment
} from "@/hooks/useAppointments";

import CustomCalendarDesktop from "@/components/CustomCalendarDesktop";
import ScheduleModule, {toMins, toTime} from "@/components/ScheduleModule";
import {useCreateEmployee, useEmployees} from "@/hooks/useEmployees";
import { flattenGroupedAppointments } from '@/components/utils/appointments';
import { useAppointmentsByBranchAndDate } from '@/hooks/useAppointments';
import { AppointmentRequest, AppointmentResponse } from "@/types/appointments";
import { formatDateLocal, formatTimeLocal } from "@/components/utils/date";
import CreateEventModal from "@/components/schedulePage/CreateEventModal";
import { normalizeAppointments } from "@/components/utils/normalizeAppointments";
import UpdateEventModal from "@/components/schedulePage/UpdateEventModal";
import { useEmployeeSchedules } from "@/hooks/useEmployeeSchedules";
import { EditEmployeeModal } from "@/components/schedulePage/EditEmployeeModal";
import { useUpdateEmployee } from "@/hooks/useEmployees";
import { isWorkingSlot } from "@/components/utils/isWorkingSlot";
import {CreateMenuModal} from "@/components/schedulePage/CreateMenuModal";
import { ServiceManager} from "@/components/schedulePage/ServiceManager";
import {CreateEmployeeModal} from "@/components/schedulePage/CreateEmployeeModal";
import CustomCalendarMobile from "@/components/CustomCalendarMobile";
import usePhoneInput from '@/hooks/usePhoneInput';
import SidebarMenu from "@/components/SidebarMenu";
import Loader from "@/components/Loader";
export interface ScheduleEvent {
    id: string;
    start: string;
    end: string;
    text: string;
    master: number;
    client?: any;      // ✅ добавим, чтобы можно было прокидывать клиента
    services?: any[];  // ✅ добавим, чтобы прокидывать услуги
}

const Page: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAccordionOpenEmployees, setIsAccordionOpenEmployees] = useState(false);
    const [isAccordionOpenClients, setIsAccordionOpenClients] = useState(false);

    const [employeesList, setEmployeesList] = useState<Employee[]>([]);

    const [userData, setUserData] = useState<any>(null);
    const [branchesData, setBranchesData] = useState<any>(null);


    const [companiesData, setCompaniesData] = useState<any>(null);
    const [isModalFilOpen, setIsModalFilOpen] = useState(false);
    //const [editingEvent, setEditingEvent] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);

    // const { employees } = useEmployees();

    const router = useRouter();

    const toggleFilModal = () => {
        setIsModalFilOpen((prev) => !prev);
    };
    const handleLogout = () => {
        localStorage.removeItem("access_token"); // Удаляем токен
        router.push("/signin"); // Перенаправляем на страницу логина
    };

    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [daysWithAppointments, setDaysWithAppointments] = useState<number[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
    const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const globalLoading =
        isLoading ||
        !companiesData ||
        !branchesData ||
        !userData ||
        employeesList.length === 0;

    const globalError = error || !companiesData || !branchesData ? error : "";

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const employees = await fetchEmployees();
                setEmployeesList(employees);
            } catch (err) {
                setError("Ошибка при загрузке сотрудников.");
            } finally {
                setIsLoading(false);
            }
        };

        loadEmployees();
    }, []);


    useEffect(() => {
        if (!companiesData || companiesData.length === 0) return;

        const fetchUserData = async () => {
            try {
                const companyId = companiesData[0]?.id;
                if (!companyId) {
                    setError("Идентификатор компании отсутствует.");
                    return;
                }

                const data = await branchesList(companyId);
                console.log("response.data setBranchesData", data);
                setBranchesData(data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(`Ошибка: ${err.message}`);
                } else {
                    setError("Неизвестная ошибка");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [companiesData]);


    useEffect(() => {
        const token = localStorage.getItem("access_token"); // Или брать из cookie

        if (!token) {
            setError("Токен не найден.");
            setIsLoading(false);
            return;
        }

        const fetchUserData = async () => {
            try {
                const data = await companiesList();
                console.log("response.data companiesList", data);
                setCompaniesData(data); // Сохраняем данные пользователя
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(`Ошибка: ${err.message}`);
                } else {
                    setError("Неизвестная ошибка");
                }
            }finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);


    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("access_token");
            if (!token) {
                setError("Токен не найден.");
                setIsLoading(false);
                return;
            }

            const fetchUserData = async () => {
                try {
                    const data = await cabinetDashboard();
                    console.log("Данные пользователя:", data);
                    setUserData(data);
                } catch (err: any) {
                    console.error("Ошибка API:", err);
                    setError(err.response?.data?.message || "Ошибка при загрузке данных.");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchUserData();
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(t);
    }, []);

    const id = branchesData?.[0]?.id ?? null;
    console.log("ID из данных PAGE:", id);
    const params = useParams();
    //const idFromUrl = params.id as string || null;
    let idFromUrl: string | null = null;
    if (params && 'id' in params) {
        idFromUrl = params.id as string;
    }



    console.log("ID из данных филиала:", id);
    console.log("ID из URL:", idFromUrl);

    const { mutateAsync: updateEmployeeMutate } = useUpdateEmployee();

    const { data: bookedDaysData, error: bookedDaysError, isLoading: isBookedDaysLoading } = useBookedDays(year, month, id);

    // Получаем мастеров из API (сотрудников для филиала)
    const { data: employees, isLoading: employeesLoading, error: employeesError } = useEmployees(id);

    // Средствами useAppointments подгружай события выбранного дня:
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());



    const startDate = formatDateLocal(selectedDate);
    const endDate = formatDateLocal(selectedDate);

    //const { data: schedules = [] } = useEmployeeSchedules(id, undefined, startDate, endDate);
    const { data: schedules = [] } = useEmployeeSchedules(
        id,           // branchId
        undefined,    // employeeId — не указываем, чтобы получить графики для всех
        startDate,
        endDate
    );

    const { mutateAsync: createEmployeeMutate } = useCreateEmployee();

    const { data: appointments, isLoading: isAppointmentsLoading, error: appointmentsError } = useAppointmentsByBranchAndDate(id, selectedDate);
    const normalizedAppointments =
        employees && employees.length > 0 && appointments
            ? normalizeAppointments(appointments, employees)
            : [];
    const groupedAppointments = groupAppointments(appointments ?? []);
    const scheduleEvents = flattenGroupedAppointments(groupedAppointments, employees ?? []);
    const { mutateAsync: createAppointmentMutate, isPending: isCreating } = useCreateAppointment();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedMasterIndex, setSelectedMasterIndex] = useState<number | null>(null);
    const [selectedStartMinutes, setSelectedStartMinutes] = useState<number | null>(null);
    const [isOutsideSchedule, setIsOutsideSchedule] = useState(false); // 👈 добавляем!

    const [editingEvent, setEditingEvent] = useState<{
        id: number;
        date: string;                              // ⬅ добавили
        timeStart: string;
        timeEnd: string;
        employeeId: number;
        services: { id: number; qty: number }[];
        client?: { id: number; name: string; last_name?: string; phone?: string };
    } | null>(null);


    const handleOpenCreateModal = (startMinutes: number, masterIndex: number) => {
        const emp = employees[masterIndex];
        const timeStr = formatTimeLocal(startMinutes);
        const working = emp
            ? isWorkingSlot(emp.id, timeStr, selectedDate, schedules)
            : true;

        setSelectedStartMinutes(startMinutes);
        setSelectedMasterIndex(masterIndex);

        setIsCreateModalOpen(true);
        setIsOutsideSchedule(!working); // 👈 добавляем этот стейт
    };

    const handleEventClick = (ev: ScheduleEvent) => {
        console.log("🖱 handleEventClick вызван для события:", ev);

        // 1. Находим сотрудника по индексу колонки
        const emp = employees?.[ev.master];
        if (!emp) {
            console.warn("❗ Нет сотрудника по индексу колонки:", ev.master, employees);
            return;
        }
        console.log("👤 Найден сотрудник:", emp);

        // 2. Находим исходную запись в appointments (чтобы достать клиента и услуги)
        const src = (appointments ?? []).find(a => a.id === Number(ev.id));
        console.log("📦 Исходная запись из appointments:", src);


        // 3. Преобразуем услуги в формат { id, qty }
        const initialSelected = (src?.services ?? []).map(s => ({
            id: (s as any).service_id ?? (s as any).id, // ✅ поддержка и service_id, и id на всякий случай
            qty: (s as any).qty ?? 1,
        }));
        console.log("🎯 Преобразованные услуги (initialSelected):", initialSelected);

        // пробуем взять из datetime_start или appointment_datetime, если нет — из выбранной даты
        const dateFromSrc =
            (src as any)?.datetime_start?.slice(0, 10) ??
            (src as any)?.appointment_datetime?.slice(0, 10) ??
            formatDateLocal(selectedDate);

        // 4. Устанавливаем состояние для UpdateEventModal
        const eventPayload = {
            id: Number(ev.id),
            date: dateFromSrc,               // ⬅ вот она, корректная дата записи
            timeStart: ev.start,
            timeEnd: ev.end,
            employeeId: emp.id,
            services: initialSelected,
            client: src?.client
                ? {
                    id: src.client.id,
                    name: src.client.name,
                    last_name: src.client.last_name,
                    phone: src.client.phone,
                }
                : undefined,
        };

        setEditingEvent(eventPayload);
    };


    const handleSaveAppointment = async (data: {
        name: string;
        lastName: string;
        phone: string;
        clientId?: number;
        services: { id: number; qty: number }[];
        timeStart: string;
        timeEnd: string;
    }) => {
        if (!id || selectedMasterIndex === null) return;

        const payload: AppointmentRequest = {
            client_id: data.clientId,
            employee_id: employees[selectedMasterIndex].id,
            branch_id: id,
            date: formatDateLocal(selectedDate),
            time_start: data.timeStart,
            time_end: data.timeEnd,
            services: data.services.map(s => ({
                service_id: s.id,
                qty: s.qty,
            })),
        };

        try {
            await createAppointmentMutate(payload);
            setIsCreateModalOpen(false);
            setSelectedMasterIndex(null);
            setSelectedStartMinutes(null);
        } catch (err: any) {
            console.error("Ошибка создания записи:", err);
            alert(err?.message || "Не удалось создать запись");
        }
    };


    const handleSaveEmployee = async (updatedEmployee: any) => {
        try {
            await updateEmployeeMutate(updatedEmployee);
            setSelectedEmployee(null); // закрываем модалку после успешного сохранения
        } catch (err) {
            console.error("Ошибка при сохранении сотрудника:", err);
            alert("Не удалось обновить данные сотрудника");
        }
    };


    const handleMasterClick = (employee: Employee) => {
        console.log("🔧 Редактируем сотрудника:", employee);
        setSelectedEmployee(employee);
    };


    const [isNotFound, setIsNotFound] = useState(false);
    useEffect(() => {
        if (!idFromUrl || !id) return;
        if (String(idFromUrl) !== String(id)) {
            console.warn(`Несоответствие ID: idFromUrl (${idFromUrl}) !== id (${id})`);
            setIsNotFound(true);
        }
    }, [idFromUrl, id]);

    useEffect(() => {
        // Изменяем заголовок страницы
        document.title = isNotFound ? "404 - Страница не найдена" : "Название вашей страницы";
    }, [isNotFound]);

    if (isNotFound) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold mb-4">404 - Страница не найдена</h1>
                <p className="mb-2">Такой страницы нет</p>
                <p>Проверьте ссылку — возможно, в ней ошибка.</p>
            </div>
        );
    }

    // 🔹 Единая обработка загрузки
    if (globalLoading) {
        return (
            <div className="h-screen bg-backgroundBlue">
                <Loader type="default" visible={true} />
            </div>
        );
    }

    // 🔹 Единая обработка ошибок
    if (globalError) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-backgroundBlue text-red-400 text-center">
                <p className="text-xl font-semibold mb-2">Ошибка загрузки данных</p>
                <p>{globalError}</p>
                <button
                    onClick={() => location.reload()}
                    className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
                >
                    Перезагрузить страницу
                </button>
            </div>
        );
    }


    // Пример клиентов
    const clients = [
        { id: 1, name: "Клиентская база", url: `/clients/base/${id}` },
    ];



    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(y => y - 1);
        } else {
            setMonth(m => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(y => y + 1);
        } else {
            setMonth(m => m + 1);
        }
    };

    const handleDateSelect = (date: Date) => {
        alert(`Выбрана дата: ${date.toLocaleDateString()}`);
        setSelectedDate(date);
    };

    if (isLoading) return <p>Загрузка сотрудников...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div className="relative h-screen md:grid md:grid-cols-[30%_70%] lg:grid-cols-[20%_80%]">
            {/* Подложка для клика вне меню */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}

            {/* Левая колонка (меню + календарь) */}
            <aside
                className={`bg-darkBlue text-white p-4 fixed z-20 h-full flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${
                    isMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Верх: логотип */}
                <div
                    className="border-b border-gray-400 p-2 flex items-center cursor-pointer"
                    onClick={toggleFilModal}
                >
                    <Image
                        src="/logo.png"
                        alt="Логотип"
                        width={32}
                        height={32}
                        className="mr-2"
                    />
                    <span className="text-sm font-medium truncate">
      {companiesData?.[0]?.name || "Компания не найдена"}
    </span>
                </div>

                {/* Средний блок: календарь */}
                <div className="hidden md:block mt-4 bg-[#f8f8f8] rounded-lg p-2 text-black shadow-inner flex-shrink-0">
                    <CustomCalendarDesktop
                        year={year}
                        month={month}
                        daysWithAppointments={bookedDaysData?.days ?? []}
                        onDateSelect={handleDateSelect}
                        onPrevMonth={handlePrevMonth}
                        onNextMonth={handleNextMonth}
                    />
                </div>

                {/* Основное меню — тянется вниз, если экран высокий */}
                {/* Меню */}
                <div className="flex-grow mt-4 overflow-y-auto">
                    <SidebarMenu
                        id={id}
                        companyName={companiesData?.[0]?.name}
                        userData={userData}
                        variant="desktop"
                        onLogout={handleLogout}
                    />
                </div>
            </aside>


            {/* ✅ Кнопка открытия меню (мобильная версия) */}
            {/* Мобильная кнопка */}
            <div className="md:hidden fixed top-3 left-3 z-30">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="bg-green-500 p-2 rounded-md shadow hover:bg-green-600 transition"
                >
                </button>
            </div>

            {/* Мобильное всплывающее меню */}
            {/* КНОПКА ОТКРЫТИЯ МЕНЮ — только мобильная */}
            <div className="md:hidden fixed top-3 left-3 z-30">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="bg-green-500 p-2 rounded-md shadow hover:bg-green-600 transition"
                >
                    <Bars3Icon className="h-6 w-6 text-white" />
                </button>
            </div>

            {/* Мобильный дровер */}
            {isMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 z-20 bg-black/50"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <div
                        className="absolute left-0 top-0 h-full w-4/5 sm:w-2/3 bg-darkBlue transform translate-x-0 transition-transform duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <SidebarMenu
                            id={id}
                            companyName={companiesData?.[0]?.name}
                            userData={userData}
                            variant="mobile"
                            onLogout={handleLogout}
                            onNavigate={() => setIsMenuOpen(false)} // закрываем при переходе
                        />
                    </div>
                </div>
            )}

            {/* Правая колонка (контент) */}
            <main
                className="bg-backgroundBlue text-white p-4 h-full md:h-auto"
                onClick={() => isMenuOpen && setIsMenuOpen(false)}
            >
                <div>
                    {/* Модальное окно Филиалы */}
                    {isModalFilOpen && (
                        <div className="fixed inset-0 flex items-center justify-left bg-black bg-opacity-50 z-50"
                             onClick={toggleFilModal} // Закрытие окна при клике по фону
                        >
                            <div className="z-50 bg-white p-6 rounded-lg shadow-lg text-black absolute top-[100px] w-full sm:w-11/12 md:w-1/3"
                                 onClick={(e) => e.stopPropagation()} // Остановка всплытия события
                            >
                                <h2 className="text-lg font-bold mb-4">Филиалы</h2>
                                <p>{branchesData && branchesData.length > 0 ? branchesData[0]?.name : "Филиал не найдена"}</p>
                                <button
                                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    onClick={toggleFilModal}
                                >
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    )}
                </div>


                {/* Заголовок */}
                <div className="flex items-center bg-[#081b27] text-white p-3 rounded-md mb-4">

                    <span className="ml-auto font-semibold text-sm">
                        Расписание
                    </span>
                </div>

                {/* Календарь — показывать только на мобильных */}
                <section className="block md:hidden bg-white text-black w-full px-4 py-2">
                    <CustomCalendarMobile
                        year={year}
                        month={month}
                        daysWithAppointments={bookedDaysData?.days ?? []}
                        onDateSelect={handleDateSelect}
                        onPrevMonth={handlePrevMonth}
                        onNextMonth={handleNextMonth}
                    />
                </section>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Правая колонка: 80% */}
                    <section className="col-span-5 bg-white text-black p-4 rounded shadow">

                        <ScheduleModule
                            employees={employees}
                            appointments={normalizedAppointments}
                            schedules={schedules} // ✅ вот так
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            onCellClick={handleOpenCreateModal}
                            onEventClick={handleEventClick}
                            onMasterClick={handleMasterClick} // 👈 добавили
                            onAddEntity={() => setIsCreateMenuOpen(true)} // 👈 открывает меню выбора
                        />

                        <EditEmployeeModal
                            isOpen={!!selectedEmployee}
                            employee={selectedEmployee}
                            onClose={() => setSelectedEmployee(null)}
                            onSave={handleSaveEmployee}
                        />

                        <UpdateEventModal
                            isOpen={!!editingEvent}
                            onClose={() => setEditingEvent(null)}
                            eventData={editingEvent}
                        />

                        {isCreateModalOpen && selectedStartMinutes !== null && (
                            <CreateEventModal
                                isOpen={isCreateModalOpen}
                                onClose={() => setIsCreateModalOpen(false)}
                                onSave={handleSaveAppointment}
                                loading={false}
                                employeeId={selectedMasterIndex !== null ? employees[selectedMasterIndex].id : null}
                                defaultStartTime={formatTimeLocal(selectedStartMinutes)}
                                defaultEndTime={formatTimeLocal(selectedStartMinutes + 30)} // пока 30 мин шаг
                                isOutsideSchedule={isOutsideSchedule} // 👈 передаём
                            />
                        )}

                        {isCreateEmployeeOpen && (
                            <CreateEmployeeModal
                                isOpen={isCreateEmployeeOpen}
                                branchId={id}
                                onClose={() => setIsCreateEmployeeOpen(false)}
                                onSave={() => {
                                    setIsCreateEmployeeOpen(false);
                                }}
                            />
                        )}

                        {/* Модалки */}
                        <EditEmployeeModal isOpen={!!selectedEmployee} employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} onSave={updateEmployeeMutate} />

                        {/* Создание услуги + список */}
                        {isCreateServiceOpen && (
                            <ServiceManager branchId={id} onClose={() => setIsCreateServiceOpen(false)} />
                        )}

                        <CreateMenuModal
                            isOpen={isCreateMenuOpen}
                            onClose={() => setIsCreateMenuOpen(false)}
                            onSelect={(type) => {
                                if (type === "employee") {
                                    setIsCreateEmployeeOpen(true); // ✅ открываем создание
                                }
                                if (type === "service") {
                                    setIsCreateServiceOpen(true);
                                }
                            }}
                        />

                    </section>
                </div>
            </main>
        </div>
    );
};
export default withAuth(Page);
