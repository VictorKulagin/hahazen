"use client";
import React, { useState } from "react";
import { useEffect } from 'react';
import { withAuth } from "@/hoc/withAuth";
import Image from "next/image";
import Link from "next/link";
import {
    UserGroupIcon,
    UsersIcon,
    GlobeAltIcon,
    Cog8ToothIcon,
    WrenchIcon,
    BuildingStorefrontIcon,
    ChevronDownIcon,
    ChevronUpIcon, ArrowRightOnRectangleIcon,
    CalendarIcon,
    ClockIcon,
    PhoneIcon
} from "@heroicons/react/24/outline";
import {useRouter} from "next/navigation";
import {cabinetDashboard} from "@/services/cabinetDashboard";
import {companiesList} from "@/services/companiesList";
import {branchesList} from "@/services/branchesList";
import { useParams } from 'next/navigation';
import {Employee, fetchEmployees} from "@/services/employeeApi";
import EmployeesList from "@/components/EmployeesList";
import {groupAppointments, useBookedDays, useCreateAppointment} from "@/hooks/useAppointments";

import CustomCalendar from "@/components/CustomCalendar";
import ScheduleModule, {toTime} from "@/components/ScheduleModule";
import { useEmployees }  from "@/hooks/useEmployees";
import { useAppointments } from "@/hooks/useAppointments";
import { flattenGroupedAppointments } from '@/components/utils/appointments';
import { useAppointmentsByBranchAndDate } from '@/hooks/useAppointments';
import {AppointmentRequest} from "@/services/appointmentsApi";
import {useEmployeeServices} from "@/hooks/useServices";
import { formatDateLocal, formatTimeLocal } from "@/components/utils/date";
import {Services} from "@/services/servicesApi";


type EmployeeServiceEither =
    | (Services & { pivot?: { employee_id: number; service_id: number; individual_price: number; duration_minutes: number } })
    | { service: Services; pivot?: { employee_id: number; service_id: number; individual_price: number; duration_minutes: number } };

function isNested(item: any): item is { service: Services } {
    return item && typeof item === "object" && "service" in item;
}

function unwrapService(item: EmployeeServiceEither): { svc: Services; pivot?: EmployeeServiceEither["pivot"] } {
    return isNested(item) ? { svc: item.service, pivot: item.pivot } : { svc: item as Services, pivot: (item as any).pivot };
}
function CreateEventModal({
                              isOpen,
                              onClose,
                              onSave,
                              loading,
                              employeeId
                          }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {
        name: string;
        lastName: string;
        phone: string;
        comment: string;
        services: { id: number; qty: number }[];
    }) => void;
    loading: boolean;
    employeeId: number | null;
}) {
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [comment, setComment] = useState("");
    const [selectedServices, setSelectedServices] = useState<{ id: number; qty: number }[]>([]);

    const { data: services = [], isLoading } = useEmployeeServices(employeeId ?? undefined);

    useEffect(() => {
        // сбрасываем выбранные услуги при смене мастера
        setSelectedServices([]);
    }, [employeeId]);

    if (!isOpen) return null;

    const toggleService = (serviceId: number) => {
        setSelectedServices(prev =>
            prev.some(s => s.id === serviceId)
                ? prev.filter(s => s.id !== serviceId)
                : [...prev, { id: serviceId, qty: 1 }]
        );
    };

    const updateQty = (serviceId: number, qty: number) => {
        setSelectedServices(prev =>
            prev.map(s => (s.id === serviceId ? { ...s, qty } : s))
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedServices.length === 0) {
            alert("Выберите хотя бы одну услугу");
            return;
        }
        onSave({ name, lastName, phone, comment, services: selectedServices });
    };
debugger;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded p-6 w-full max-w-md relative">
                <h2 className="text-lg font-bold mb-4">Создать новое событие</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Имя"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="w-full p-2 border rounded"
                    />
                    <input
                        type="text"
                        placeholder="Фамилия"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        required
                        className="w-full p-2 border rounded"
                    />
                    <input
                        type="tel"
                        placeholder="Телефон"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                        className="w-full p-2 border rounded"
                    />

                    {/* Новое поле комментария */}
                    <textarea
                        placeholder="Комментарий"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        className="w-full p-2 border rounded"
                        rows={3}
                    />

                    <div>
                        <h3 className="font-semibold mb-2">Выберите услуги</h3>
                        {isLoading ? (
                            <p className="text-sm text-gray-500">Загрузка...</p>
                        ) : services.length === 0 ? (
                            <p className="text-sm text-gray-500">У мастера нет привязанных услуг</p>
                        ) : (
                            <ul className="space-y-3">
                                {services.map((item: EmployeeServiceEither) => {
                                    const { svc, pivot } = unwrapService(item);

                                    const selected = selectedServices.find(s => s.id === svc.id);
                                    const price = pivot?.individual_price ?? svc.base_price; // если есть индивидуальная цена — покажем её

                                    return (
                                        <li key={svc.id} className="flex items-center justify-between p-3 border rounded-2xl shadow-sm hover:shadow-md transition">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selected}
                                                    onChange={() => toggleService(svc.id)}
                                                    className="w-5 h-5 accent-blue-600"
                                                />
                                                <span className="font-medium text-gray-800">{svc.name}</span>
                                                <span className="text-sm text-gray-500">{price}₽</span>
                                            </label>

                                            {selected && (
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={selected.qty}
                                                    onChange={e => updateQty(svc.id, Number(e.target.value))}
                                                    className="w-16 p-1 border rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                                                />
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            {loading ? "Создание..." : "Создать"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
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

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

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



    /*const appointments = [
        { id: 1, start: "10:00", end: "11:00", client: "Иван Петров", service: "Массаж спины", phone: "+77771234567" },
        { id: 2, start: "12:00", end: "13:30", client: "Анна Сидорова", service: "SPA программа", phone: "+77779876543" },
        { id: 3, start: "15:00", end: "15:30", client: "Сергей К.", service: "Консультация", phone: "+77770000000" },
    ];*/


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



    const id = branchesData?.[0]?.id ?? null;
    const params = useParams();
    //const idFromUrl = params.id as string || null;
    let idFromUrl: string | null = null;
    if (params && 'id' in params) {
        idFromUrl = params.id as string;
    }

    console.log("ID из данных филиала:", id);
    console.log("ID из URL:", idFromUrl);

    const { data: bookedDaysData, error: bookedDaysError, isLoading: isBookedDaysLoading } = useBookedDays(year, month, id);

    // Получаем мастеров из API (сотрудников для филиала)
    const { data: employees, isLoading: employeesLoading, error: employeesError } = useEmployees(id);

// Средствами useAppointments подгружай события выбранного дня:
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());



    const { data: appointments, isLoading: isAppointmentsLoading, error: appointmentsError } = useAppointmentsByBranchAndDate(id, selectedDate);

    const groupedAppointments = groupAppointments(appointments ?? []);
    const scheduleEvents = flattenGroupedAppointments(groupedAppointments, employees ?? []);

    const { mutateAsync: createAppointmentMutate, isPending: isCreating } = useCreateAppointment();






    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedMasterIndex, setSelectedMasterIndex] = useState<number | null>(null);
    const [selectedStartMinutes, setSelectedStartMinutes] = useState<number | null>(null);

    const handleOpenCreateModal = (startMinutes: number, masterIndex: number) => {
        setSelectedMasterIndex(masterIndex);
        setSelectedStartMinutes(startMinutes);
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        setSelectedMasterIndex(null);
        setSelectedStartMinutes(null);
    };



    const handleSaveAppointment = async (data: {
        name: string;
        lastName: string;
        phone: string;
        comment: string;
        services: { id: number; qty: number }[];
    }) => {
        if (!id || selectedMasterIndex === null || selectedStartMinutes === null) return;

        // Формируем payload для API
        const newAppointment: AppointmentRequest = {
            client: {
                name: data.name,
                last_name: data.lastName,
                phone: data.phone,
            },
            client_name: data.name,
            client_last_name: data.lastName,
            client_phone: data.phone,
            branch_id: id,
            employee_id: employees[selectedMasterIndex].id,
            date: formatDateLocal(selectedDate), // YYYY-MM-DD
            time_start: formatTimeLocal(selectedStartMinutes),
            time_end: formatTimeLocal(selectedStartMinutes + 30),
            appointment_datetime: `${formatDateLocal(selectedDate)} ${formatTimeLocal(selectedStartMinutes)}`, // "YYYY-MM-DD HH:mm"
            total_duration: 30, // ⬅️ пока жёстко 30 мин, можно вычислить от услуги
            comment: data.comment,
            services: data.services.map(s => ({
                service_id: s.id,
                qty: s.qty,
            })),
        };

        try {
            // Создаём запись через React Query
            await createAppointmentMutate(newAppointment);

            // Закрываем модалку
            setIsCreateModalOpen(false);
            setSelectedMasterIndex(null);
            setSelectedStartMinutes(null);

           // alert("Запись успешно создана!");
        } catch (err: any) {
            console.error("Ошибка создания записи:", err);
            alert(err?.message || "Не удалось создать запись");
        }
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


    if (isLoading) return <p>Загрузка...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    if (isLoading) {
        return <div>Загрузка...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }


    // Пример клиентов
    const clients = [
        { id: 1, name: "Клиентская база", url: `/clients/base/${id}` },
    ];

    // Элементы меню
    const menuItems = [
        {
            label: "Сотрудники",
            icon: <UserGroupIcon className="h-8 w-8 text-gray-400" />,
            content: (
                <div className="ml-10 mt-2">
                    <EmployeesList branchId={id}/>
                </div>
            ),
        },
        {
            label: "Клиенты", // Новый пункт "Клиенты"
            icon: <UsersIcon className="h-8 w-8 text-gray-400" />,
            content: (
                <div  className="ml-10 mt-2 flex flex-col gap-2">
                    {clients.map((client) => (  // Список клиентов, аналогично сотрудникам
                        <Link
                            key={client.id}
                            href={client.url}
                            className="block text-gray-300 hover:text-white transition"
                        >
                            {client.name}
                        </Link>
                    ))}
                </div>
            ),
        },
        {
            label: (
                <Link href={`/online/booking_forms/${id}`} className="flex items-center">
                    Онлайн-запись
                </Link>
            ),
            icon: <GlobeAltIcon className="h-8 w-8 text-gray-400" />,
        },
        {
            label: (
                <Link href={`/schedule/${id}`} className="flex items-center">
                    Расписание
                </Link>
            ),
            icon: <CalendarIcon className="h-8 w-8 text-gray-200" />, isActive: true
        },
        {
            label: (
                <Link href={`/settings/menu/${id}`} className="flex items-center">
                    Настройки
                </Link>
            ),
            icon: <Cog8ToothIcon className="h-8 w-8 text-gray-200" />
        },

        { label: <hr className="border-gray-700 my-2" />, icon: null }, // Разделитель

        {
            label: (
                <div className="flex flex-col items-start p-4 border-t border-gray-700">
                    <Link href={`/cabinet`}>
                        <p className="text-gray-300 font-medium text-sm">
                            {userData?.name || "Имя пользователя"}
                        </p>
                        <p className="text-gray-500 text-xs">
                            {userData?.email || "email@example.com"}
                        </p>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="mt-2 text-green-500 hover:text-green-400 text-sm flex items-center"
                    >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                        Выйти
                    </button>
                </div>
            ),
            icon: null, // Значок не нужен, чтобы сохранить стиль
        }
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

            {/* Левая колонка (меню) */}
            <aside
                className={`bg-darkBlue text-white p-4 fixed z-20 h-full transition-transform duration-300 md:relative md:translate-x-0 ${
                    isMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Логотип */}
                <div className="border-b border-gray-400 p-2 flex items-center"
                     onClick={toggleFilModal} // Обработчик клика
                >
                    <Image
                        src="/logo.png"
                        alt="Логотип"
                        width={32}
                        height={32}
                        className="mr-2"
                    />
                    <span>{companiesData && companiesData.length > 0 ? companiesData[0]?.name : "Компания не найдена"}</span>
                </div>

                <div>
                    <nav className="mt-4">
                        {menuItems.map((item, index) => (
                            <div key={index}>
                                <div
                                    className={`flex items-center p-4 rounded transition-all ${
                                        item.isActive ? "bg-green-500" : "hover:bg-gray-700" // Зеленая подсветка для активного пункта
                                    }`}
                                    onClick={() => {
                                        if (item.label === "Сотрудники") {
                                            setIsAccordionOpenEmployees(!isAccordionOpenEmployees);
                                        } else if (item.label === "Клиенты") {
                                            setIsAccordionOpenClients(!isAccordionOpenClients);
                                        }
                                    }}
                                >
                                    {item.icon}
                                    <span className="ml-2 text-white font-medium text-lg">{item.label}</span>
                                    {(item.label === "Сотрудники" || item.label === "Клиенты") && (
                                        <span className="ml-auto text-white">
                                    {item.label === "Сотрудники"
                                        ? isAccordionOpenEmployees
                                            ? <ChevronUpIcon className="h-5 w-5 inline" />
                                            : <ChevronDownIcon className="h-5 w-5 inline" />
                                        : item.label === "Клиенты" && (isAccordionOpenClients
                                        ? <ChevronUpIcon className="h-5 w-5 inline" />
                                        : <ChevronDownIcon className="h-5 w-5 inline" />)
                                            }
                                </span>
                                    )}
                                </div>

                                {/* Показываем контент для "Сотрудников" или "Клиентов", если аккордеон открыт */}
                                {item.label === "Сотрудники" && isAccordionOpenEmployees && item.content}
                                {item.label === "Клиенты" && isAccordionOpenClients && item.content}
                            </div>
                        ))}
                    </nav>
                </div>

            </aside>

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


                {/* Бургер-иконка (для мобильных устройств) */}
                <div className="flex justify-between items-center md:hidden">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-white bg-blue-700 p-2 rounded"
                    >
                        {isMenuOpen ? "Закрыть меню" : "Открыть меню"}
                    </button>
                </div>

                {/* Заголовок */}
                <header className="mb-6">
                    <h1 className="text-2xl font-bold mb-2">Расписание (Раздел в разработке)</h1>
                </header>



                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Левая колонка: 20%, на мобильных flex с центровкой */}
                    <section className="col-span-4 md:col-span-1 bg-white text-black flex justify-center ">
                        <CustomCalendar
                            year={year}
                            month={month}
                            daysWithAppointments={bookedDaysData?.days ?? []}
                            onDateSelect={handleDateSelect}
                            onPrevMonth={handlePrevMonth}
                            onNextMonth={handleNextMonth}
                        />
                    </section>

                    {/* Правая колонка: 80% */}
                    <section className="col-span-4 bg-white text-black p-4 rounded shadow">


                        <ScheduleModule
                            employees={employees}
                            appointments={scheduleEvents}
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            onCellClick={handleOpenCreateModal}
                        />


                        <CreateEventModal
                            isOpen={isCreateModalOpen}
                            onClose={handleCloseCreateModal}
                            onSave={handleSaveAppointment}
                            loading={isCreating}
                            employeeId={selectedMasterIndex !== null ? employees[selectedMasterIndex].id : null}
                        />
                    </section>
                </div>




            </main>
        </div>
    );
};
export default withAuth(Page);
