//staff/[id]/page.tsx
"use client";
import React, {useEffect, useState, useRef} from "react";
import Image from "next/image";
import {
    UserGroupIcon,
    UsersIcon,
    GlobeAltIcon,
    Cog8ToothIcon, ArrowRightOnRectangleIcon, ChevronUpIcon, ChevronDownIcon,
    TrashIcon,
    PencilIcon, CalendarIcon,  // Для редактирования
} from "@heroicons/react/24/outline";
import {withAuth} from "@/hoc/withAuth";
import {useParams, useRouter} from "next/navigation";
import {branchesList} from "@/services/branchesList";
import {companiesList} from "@/services/companiesList";
import { Employee, fetchEmployees } from "@/services/employeeApi";
import {cabinetDashboard} from "@/services/cabinetDashboard";
import { createEmployee } from "@/services/employeeApi";
import { deleteEmployee } from "@/services/employeeApi";
import { updateEmployee } from "@/services/employeeApi";
import Link from "next/link";
import {AxiosError} from "axios";
import EmployeesList from "@/components/EmployeesList";
import usePhoneInput from '@/hooks/usePhoneInput';
import {useCreateEmployeeSchedule, useUpdateEmployeeSchedule, useEmployeeSchedules, useDeleteEmployeeSchedule} from "@/hooks/useEmployeeSchedules";
import { UI_validatePhone, validateName } from '@/components/Validations';

import {
    createEmployeeSchedule, EmployeeSchedule,
    fetchEmployeeScheduleByPeriod,
    updateEmployeeSchedule
} from "@/services/еmployeeScheduleApi";
import {useEmployeeServices, useSyncEmployeeServices, useServices} from "@/hooks/useServices";
import {EmployeeService, EmployeeServiceResponse} from "@/services/servicesApi";

const Page: React.FC = ( ) => {


    // Закрыть меню при клике на элемент
    const handleMenuItemClick = () => setIsMenuOpen(false);


    // В компоненте мастера

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [employeesList, setEmployeesList] = useState<Employee[]>([]);

    const [userData, setUserData] = useState<any>(null);
    const [branchesData, setBranchesData] = useState<any>(null);

    const [companiesData, setCompaniesData] = useState<any>(null);
    const [isModalFilOpen, setIsModalFilOpen] = useState(false);
    const [isAccordionOpenEmployees, setIsAccordionOpenEmployees] = useState(false);
    const [isAccordionOpenClients, setIsAccordionOpenClients] = useState(false);

    const [employees, setEmployees] = useState<Employee[]>([]);

    const { phone, handlePhoneChange } = usePhoneInput();

    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    const [isNotFound, setIsNotFound] = useState(false);

    const [weeklyPeriods, setWeeklyPeriods] = useState<{ day: string; start: string; end: string }[]>([]);
    // Добавим состояние блокировки отправки
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedServices, setSelectedServices] = useState<EmployeeService[]>([]);

    const router = useRouter();

    /*const {
        mutateAsync: createSchedule,
        isPending: isCreating // Используем isPending вместо isLoading
    } = useCreateEmployeeSchedule();
    const updateSchedule = useUpdateEmployeeSchedule();*/
    const { mutateAsync: createSchedule } = useCreateEmployeeSchedule();
    const { mutateAsync: updateSchedule } = useUpdateEmployeeSchedule();

    const { mutateAsync: deleteSchedule } = useDeleteEmployeeSchedule();

    const [isScheduleLoading, setIsScheduleLoading] = useState(false);


    const { data: allServices, isLoading: isLoadingAllServices } = useServices();


    useEffect(() => {
        console.log("Список услуг из API:", {
            data: allServices,
            loading: isLoadingAllServices, // Исправлено имя переменной
            //error: error?.message
        });
    }, [allServices, isLoadingAllServices, error]); // Добавлены зависимости

    useEffect(() => {
        console.log("allServices:", JSON.stringify(allServices, null, 2));
    }, [allServices]); // Добавляем allServices в зависимости

    const toggleFilModal = () => {
        setIsModalFilOpen((prev) => !prev);
    };
    const handleLogout = () => {
        localStorage.removeItem("access_token"); // Удаляем токен
        router.push("/signin"); // Перенаправляем на страницу логина
    };

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
                if (err instanceof AxiosError) {
                    setError(`Ошибка: ${err.response?.data?.message || err.message || "Неизвестная ошибка"}`);
                } else if (err instanceof Error) {
                    setError(`Ошибка: ${err.message}`);
                } else {
                    setError("Неизвестная ошибка");
                }
            } finally {
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
        const loadEmployees = async () => {
            try {
                const employeesData = await fetchEmployees(); // Используем функцию из API
                setEmployees(employeesData); // Обновляем состояние сотрудников
            } catch (error: any) {
                setError(error.response?.data?.message || error.message); // Обработка ошибок
            } finally {
                setLoading(false); // Завершаем загрузку
            }
        };

        loadEmployees(); // Запуск функции загрузки сотрудников
    }, []);

    const id = branchesData?.[0]?.id ?? null;
    console.log(id + " ID из данных филиала ....");





    const params = useParams();
    //const idFromUrl = params.id as string || null;
    let idFromUrl: string | null = null;
    if (params && 'id' in params) {
        idFromUrl = params.id as string;
    }

    console.log("ID из данных филиала:", id);
    console.log("ID из URL:", idFromUrl);

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


    useEffect(() => {
        if (isModalOpen) {
            nameInputRef.current?.focus();
        }
    }, [isModalOpen]);


    const [formData, setFormData] = useState({
        name: "",
        specialty: "",
        email: "",
        phone: "",
        hire_date: "",
        schedule_type: "weekly" as "weekly", // Добавляем поле по умолчанию
        start_date: "",
        end_date: "",
    });


    const {
        data: schedules,
        isLoading: isSchedulesLoading
    } = useEmployeeSchedules(
        id, // branchId
        editingEmployee?.id, // employeeId
        formData.start_date,
        formData.end_date
    );

    // Получение услуг мастера
// Добавляем правильную инициализацию мутации
    const { mutate: syncServices } = useSyncEmployeeServices();

    // Синхронизация услуг
// Добавляем хук для услуг сотрудника
    const { data: currentEmployeeServices, isLoading: isEmployeeServicesLoading } = useEmployeeServices(
        editingEmployee?.id
    );





    // Обработчик изменения данных в форме
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        // Для полей с префиксом schedule_
        if (name.startsWith('schedule_')) {
            setFormData(prev => ({
                ...prev,
                [name.replace('schedule_', '')]: value
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };



    const handleDelete = async (id: number) => {
        if (!window.confirm("Вы уверены, что хотите удалить сотрудника?")) {
            return;
        }

        try {
            await deleteEmployee(id);
            setEmployees((prev) => prev.filter((employee) => employee.id !== id));
        } catch (error) {
            console.error("Ошибка при удалении сотрудника:", error);
        }
    };


    // 2. В родительском компоненте Page
    const handleEdit = async (employee: Employee) => {
        try {
            // Загрузка расписания сотрудника
            const schedules = await fetchEmployeeScheduleByPeriod(
                employee.id,
                new Date().toISOString().split('T')[0],
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            );

            // Заполняем данные формы
            setFormData({
                name: employee.name,
                specialty: employee.specialty,
                email: employee.email || '',
                phone: employee.phone || '',
                hire_date: employee.hire_date,
                schedule_type: schedules[0]?.schedule_type || 'weekly',
                start_date: schedules[0]?.start_date || '',
                end_date: schedules[0]?.end_date || ''
            });

            // Заполняем периоды для weekly
            if (schedules[0]?.schedule_type === 'weekly') {
                setWeeklyPeriods(
                    schedules[0].periods.map(p => ({
                        day: p[0] as string,
                        start: p[1],
                        end: p[2]
                    }))
                );
            }

            setEditingEmployee(employee);
            setIsEditModalOpen(true);
        } catch (error) {
            console.error('Ошибка загрузки расписания:', error);
        } finally {
            setIsScheduleLoading(false);
        }
    };


// 2. Модифицируем обработчик отправки
    const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Добавить тут проверку
        const errors = {
            phone: UI_validatePhone(formData.phone),
            name: validateName(formData.phone),
            //services: form.services.length === 0 ? 'Добавьте услуги' : ''
        };

        if (isSubmitting) return; // Блокировка повторной отправки
        setIsSubmitting(true);

        try {
            setIsSubmitting(true);
            // Валидация
            if (formData.schedule_type === "weekly") {
                if (!formData.start_date || !formData.end_date) {
                    alert("Укажите даты начала и окончания");
                    return;
                }
                if (weeklyPeriods.length === 0) {
                    alert("Добавьте хотя бы один период");
                    return;
                }
            }

            // Создание сотрудника
            const newEmployee = await createEmployee({
                ...formData,
                branch_id: id,
                online_booking: 1,
                email: formData.email || null,
                phone: formData.phone || null,
                // Добавляем обязательные поля со значениями null
                // @ts-ignore
                description: null,
                gender: null,
                last_name: null,
                patronymic: null,
                photo: null
            });

            // Создание расписания
            if (formData.schedule_type) {
                await createSchedule({ // Используем createSchedule
                    employee_id: newEmployee.id,
                    schedule_type: formData.schedule_type as 'weekly' /*| 'cycle'*/, // Явное приведение типа
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    night_shift: 0,
                    periods: weeklyPeriods.map(p => [p.day, p.start, p.end])
                });
            }

            // Синхронизируем услуги ТОЛЬКО после создания сотрудника
            if (selectedServices.length > 0) {
                await syncServices({
                    employeeId: newEmployee.id,
                    services: selectedServices
                });
            }

            // Обновление UI
            setEmployees(prev => [...prev, newEmployee]);
            setIsAddModalOpen(false);

        } catch (error) {
            console.error("Ошибка создания:", error);
        } finally {
            setIsSubmitting(false); // Разблокировка формы
        }
    };

    // Добавляем реф для хранения выбранных услуг


    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            if (!editingEmployee) return;

            // 1. Обновление данных сотрудника
            const updatedEmployee = await updateEmployee(editingEmployee.id, formData);

            // 2. Подготовка данных расписания
            const scheduleData: EmployeeSchedule = {
                id: 0, // Временное значение для TypeScript
                employee_id: editingEmployee.id,
                //schedule_type: formData.schedule_type,
                schedule_type: "weekly",
                start_date: formData.start_date,
                end_date: formData.end_date,
                periods: weeklyPeriods.map(p => [p.day, p.start, p.end]),
                night_shift: 0
            };

            // 2. Синхронизируем услуги
            if (selectedServices.length > 0) { // Убрали .current
                await syncServices({
                    employeeId: editingEmployee.id,
                    services: selectedServices
                });
            }


            const existingSchedules = schedules || [];

            // 4. Использование React Query мутаций
            /*if (existingSchedules.length > 0) {
                scheduleData.id = existingSchedules[0].id;
                await updateSchedule.mutateAsync(scheduleData);
            } else {
                await createSchedule.mutateAsync(scheduleData);
            }*/

            if (existingSchedules.length > 0) {
                scheduleData.id = existingSchedules[0].id;
                await updateSchedule(scheduleData); // Убрали .mutateAsync
            } else {
                await createSchedule(scheduleData); // Убрали .mutateAsync
            }

            // 5. Обновление состояния
            setEmployees(prev =>
                prev.map(emp =>
                    emp.id === editingEmployee.id ? updatedEmployee : emp
                )
            );
            setIsEditModalOpen(false);

        } catch (error) {
            const err = error as AxiosError<any>;
            console.error('Ошибка:', err);
            alert(err.response?.data?.message || 'Ошибка сохранения');
        } finally {
            setIsSubmitting(false); // Добавляем сброс состояния
        }
    };

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
    if (error) return <p style={{color: "red"}}>{error}</p>;

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
//debugger;
    // Элементы меню
    const menuItems = [
        {
            label: "Сотрудники",
            icon: <UserGroupIcon className="h-8 w-8 text-gray-400" />,
            content: (
                <div>
                    <EmployeesList branchId={id} />
                </div>
            ),
        },
        {
            label: "Клиенты", // Новый пункт "Клиенты"
            icon: <UsersIcon className="h-8 w-8 text-gray-400" />,
            content: (
                <div className="ml-10 mt-2">
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
            icon: <CalendarIcon className="h-8 w-8 text-gray-400" />
        },
        {
            label: (
                <Link href={`/settings/menu/${id}`} className="flex items-center">
                    Настройки
                </Link>
            ),
            icon: <Cog8ToothIcon className="h-8 w-8 text-gray-200" />, isActive: true
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


    return (
        <div className="relative h-screen md:grid md:grid-cols-[30%_70%] lg:grid-cols-[20%_80%]">
            {/* Подложка для клика вне меню */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}

            {/* Уведомление о загрузке */}
            {/*{isCreating && (
                <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white p-2 text-center z-50">
                    Создание расписания...
                </div>
            )}*/}
            {isSubmitting && (
                <div className="fixed top-0 left-0 right-0 bg-green-500 text-white p-2 text-center z-50">
                    Сохранение...
                </div>
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
                            <div
                                className="z-50 bg-white p-6 rounded-lg shadow-lg text-black absolute top-[100px] w-full sm:w-11/12 md:w-1/3"
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
                    <>
                        <nav aria-label="breadcrumb" className="text-sm mb-2">
                            Настройки / Сотрудники
                        </nav>
                        <h1 className="text-2xl font-bold mb-2">Сотрудники</h1>
                    </>
                </header>

                {/* Кнопка "Добавить сотрудника" */}
                <div className="mb-4">
                    <button

                        onClick={() => {
                            // Сброс данных при открытии модалки
                            setFormData(INITIAL_FORM_DATA);
                            setWeeklyPeriods([]);
                            setIsAddModalOpen(true);
                        }}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        + Добавить сотрудника
                    </button>
                </div>

                {/* Таблица сотрудников */}
                <EmployeesTable
                    loading={loading}
                    error={error}
                    employees={employees}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                />

                {/* Модальное окно */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white text-black p-6 rounded shadow-lg w-96 relative">
                            {/* Кнопка закрытия */}
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            >
                                ✖
                            </button>

                            <h2 className="text-xl font-bold mb-4">Добавить сотрудника</h2>

                        </div>
                    </div>
                )}

                {/* Модальное окно добавления */}
                <EmployeeModal
                    mode="create"
                    isOpen={isAddModalOpen}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        setFormData(INITIAL_FORM_DATA);
                        setWeeklyPeriods([]);
                    }}
                    onSubmit={handleAddSubmit}
                    formData={formData}
                    setFormData={setFormData} // Теперь типы совпадают
                    handleInputChange={handleInputChange}
                    title="Добавить сотрудника"
                    weeklyPeriods={weeklyPeriods}
                    setWeeklyPeriods={setWeeklyPeriods}
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                    isScheduleLoading={isScheduleLoading}
                    // Важные пропсы:
                    availableServices={allServices || []}
                    initialSelectedServices={[]}
                    isServicesLoading={isLoadingAllServices}
                    /*onServicesUpdate={(updatedServices) => {
                        if (employeeId) {
                            syncServices(updatedServices);
                        }
                    }}*/
                    // @ts-ignore
                    onServicesChange={(services) => selectedServices.current = services}
                />
                {/*В рендере модального окна редактирования*/}
                {isEditModalOpen && editingEmployee && (
                    <EmployeeModal
                        mode="edit"
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSubmit={handleEditSubmit}
                        formData={formData}
                        setFormData={setFormData}
                        handleInputChange={handleInputChange}
                        title="Редактировать сотрудника"
                        weeklyPeriods={weeklyPeriods}
                        setWeeklyPeriods={setWeeklyPeriods}
                        isSubmitting={isSubmitting}
                        setIsSubmitting={setIsSubmitting}
                        isScheduleLoading={isScheduleLoading}
                        availableServices={allServices || []}
                        // @ts-ignore
                        initialSelectedServices={currentEmployeeServices || []}
                        isServicesLoading={isEmployeeServicesLoading}
                        onServicesChange={setSelectedServices}
                    />
                )}
            </main>
        </div>
    );
};

export default withAuth(Page);


const EmployeesTable = ({
                            loading,
                            error,
                            employees,
                            handleEdit,
                            handleDelete,
                        }: {
    loading: boolean;
    error: string;
    employees: Employee[];
    handleEdit: (employee: Employee) => void;
    handleDelete: (id: number) => void;
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6">
            <section className="bg-white text-black p-4 rounded shadow">
                <h2 className="text-lg font-semibold mb-2">Сотрудники</h2>

                <div className="overflow-auto">
                    {loading ? (
                        <div className="text-center text-gray-500">Загрузка...</div>
                    ) : error ? (
                        <div className="text-center text-red-500">Ошибка: {error}</div>
                    ) : employees.length === 0 ? (
                        <div className="text-center text-gray-500">Нет данных</div>
                    ) : (
                        <div className="md:overflow-x-visible overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
                                <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2 text-left">Имя</th>
                                    <th className="border p-2 text-left">Специализация</th>
                                    <th className="border p-2 text-left hidden sm:table-cell">Email</th>
                                    <th className="border p-2 text-left hidden xs:table-cell">Телефон</th>
                                    <th className="border p-2 text-left">Дата найма</th>
                                    <th className="border p-2 w-0.5"></th>
                                    <th className="border p-2 w-0.5"></th>
                                </tr>
                                </thead>
                                <tbody>
                                {employees.map((employee) => (
                                    <tr key={employee.id} className="hover:bg-gray-50">
                                        <td className="border p-2">{employee.name}</td>
                                        <td className="border p-2">{employee.specialty}</td>
                                        <td className="border p-2 hidden sm:table-cell break-all">
                                            {employee.email}
                                        </td>
                                        <td className="border p-2 hidden xs:table-cell">{employee.phone}</td>
                                        <td className="border p-2">{employee.hire_date}</td>
                                        <td className="border p-2">
                                            <button
                                                onClick={() => handleEdit(employee)}
                                                className="block mx-auto"
                                            >
                                                <PencilIcon className="h-5 w-5 text-blue-500 hover:text-blue-700" />
                                            </button>
                                        </td>
                                        <td className="border p-2">
                                            <button
                                                onClick={() => handleDelete(employee.id)}
                                                className="block mx-auto"
                                            >
                                                <TrashIcon className="h-5 w-5 text-red-500 hover:text-red-700" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

interface FormData {
    name: string;
    specialty: string;
    email: string;
    phone: string;
    hire_date: string;
    schedule_type: 'weekly'; /*| 'cycle'*/// Убрали 'cycle'
    start_date: string;
    end_date: string;
}

const INITIAL_FORM_DATA: FormData = {
    name: "",
    specialty: "",
    email: "",
    phone: "",
    hire_date: "",
    schedule_type: "weekly",
    start_date: "",
    end_date: "",
    // @ts-ignore
    start_date: new Date().toISOString().split('T')[0], // Текущая дата по умолчанию
    // @ts-ignore
    end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] // +30 дней
};

const daysOfWeek = [
    { key: "mon", label: "Пн" },
    { key: "tue", label: "Вт" },
    { key: "wed", label: "Ср" },
    { key: "thu", label: "Чт" },
    { key: "fri", label: "Пт" },
    { key: "sat", label: "Сб" },
    { key: "sun", label: "Вс" },
];

class Service {
}

type EmployeeModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    title: string;
    weeklyPeriods: { day: string; start: string; end: string }[];
    setWeeklyPeriods: React.Dispatch<React.SetStateAction<{ day: string; start: string; end: string }[]>>;
    isSubmitting: boolean; // Новый проп
    setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>; // Новый проп
    mode: 'create' | 'edit'; // Добавляем режим работы
    isScheduleLoading: boolean;

    services?: EmployeeServiceResponse[];

    // Критически важные пропсы:
    availableServices: Service[]; // Убрали "?" чтобы сделать обязательным
    initialSelectedServices?: EmployeeServiceResponse[];
    //onServicesUpdate?: (services: EmployeeService[]) => void;
    isServicesLoading: boolean; // Сделали обязательным
    onServicesChange?: (services: EmployeeService[]) => void;
};

const EmployeeModal = ({
                           isSubmitting,
                           setIsSubmitting,
                           weeklyPeriods = [],
                           setWeeklyPeriods,
                           isOpen,
                           onClose,
                           onSubmit,
                           formData,
                           setFormData,
                           handleInputChange,
                           title,
                           mode, // Получаем mode из пропсов
                           isScheduleLoading,
                           availableServices = [],
                           initialSelectedServices = [], // Корректное имя
                           //onServicesUpdate,
                           onServicesChange,
                           isServicesLoading = false,
                           ...props
                       }: EmployeeModalProps) => {
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState("info");
    const [cyclePeriods, setCyclePeriods] = useState<any[]>([]);

    const [validationErrors, setValidationErrors] = useState({
        phone: '',
        name: '',
        services: ''
    });

    const [localSelectedServices, setLocalSelectedServices] = useState<
        Array<EmployeeService & { name: string }>
    >(
        initialSelectedServices.map(s => ({
            service_id: s.id,
            // @ts-ignore
            individual_price: s.pivot?.individual_price ?? s.base_price,
            // @ts-ignore
            duration_minutes: s.pivot?.duration_minutes ?? s.duration_minutes,
            // @ts-ignore
            name: s.name
        }))
    );
    // Debug-логи
    /*useEffect(() => {
        console.log("Available Services in Modal (verified):", availableServices);
        console.log("Selected Services:", selectedServices);
    }, [availableServices, selectedServices]);
    const removeWeeklyPeriod = (index: number) => {
        setWeeklyPeriods(prev => prev.filter((_, i) => i !== index));
    };*/

    const removeWeeklyPeriod = (index: number) => {
        setWeeklyPeriods(prev => prev.filter((_, i) => i !== index));
    };

    // При изменении услуг вызываем колбэк
    useEffect(() => {
        if (onServicesChange) {
            onServicesChange(localSelectedServices.map(({ service_id, individual_price, duration_minutes }) => ({
                service_id,
                individual_price,
                duration_minutes
            })));
        }
    }, [localSelectedServices]);

// Обновляем преобразование initialSelectedServices
    useEffect(() => {
        const initialServices = initialSelectedServices?.map(s => ({
            // @ts-ignore
            service_id: s.service_id, // Используем service_id из корня объекта
            // @ts-ignore
            individual_price: s.individual_price,
            duration_minutes: s.duration_minutes,
            // @ts-ignore
            name: s.service.name // Берем название из вложенного объекта service
        })) || [];

        setLocalSelectedServices(initialServices);
    }, [initialSelectedServices]);

    useEffect(() => {
        if (isOpen && mode === 'create') {
            setWeeklyPeriods([]);
            handleInputChange({
                target: {
                    name: 'reset',
                    value: INITIAL_FORM_DATA
                }
            } as unknown as React.ChangeEvent<HTMLInputElement>);
        }
    }, [isOpen, mode]); // Добавляем mode в зависимости

    // В компоненте EmployeeModal:
    useEffect(() => {
        if (isOpen && mode === 'edit') {
            // Сброс состояний при открытии модалки редактирования
            setWeeklyPeriods(weeklyPeriods || []);
        }
    }, [isOpen, mode, weeklyPeriods]);

    const addWeeklyPeriod = () => {
        setWeeklyPeriods([...weeklyPeriods, { day: "mon", start: "09:00", end: "18:00" }]);
    };

    const updateWeeklyPeriod = (index: number, field: string, value: string) => {
        const updated = [...weeklyPeriods];
        if (field === "end" && updated[index].start && value <= updated[index].start) {
            alert("Время окончания должно быть позже времени начала");
            return;
        }
        if (field === "start" && updated[index].end && value >= updated[index].end) {
            alert("Время начала должно быть раньше времени окончания");
            return;
        }
        // @ts-ignore
        updated[index][field] = value;
        setWeeklyPeriods(updated);
    };


    const handleServiceChange = (service: Service, isChecked: boolean) => {
        setLocalSelectedServices(prev => {
            if (isChecked) {
                return [...prev, {// @ts-ignore
                    service_id: service.id,
                    // @ts-ignore
                    individual_price: service.base_price,
                    // @ts-ignore
                    duration_minutes: service.duration_minutes,
                    // @ts-ignore
                    name: service.name
                }];
            }
            // @ts-ignore
            return prev.filter(s => s.service_id !== service.id);
        });
    };

    const handlePriceChange = (serviceId: number, value: number) => {
        setLocalSelectedServices(prev =>
            prev.map(s => s.service_id === serviceId
                ? { ...s, individual_price: value }
                : s
            )
        );
    };

    const handleDurationChange = (serviceId: number, value: number) => {
        setLocalSelectedServices(prev =>
            prev.map(s => s.service_id === serviceId
                ? { ...s, duration_minutes: value }
                : s
            )
        );
    };

    /*const addCyclePeriod = () => {
        setCyclePeriods([...cyclePeriods, { day: 0, start: "20:00", end: "08:00" }]); // Убрали 'cycle'
    };*/

    /*const updateCyclePeriod = (index: number, field: string, value: any) => {
        const updated = [...cyclePeriods];
        if (field === "end" && updated[index].start && value <= updated[index].start) {
            alert("Время окончания должно быть позже времени начала");
            return;
        }
        if (field === "start" && updated[index].end && value >= updated[index].end) {
            alert("Время начала должно быть раньше времени окончания");
            return;
        }
        updated[index][field] = value;
        setCyclePeriods(updated);
    };*/ // Убрали 'cycle'

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white text-black p-6 rounded shadow-lg w-[600px] relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                    ✖
                </button>
                <h2 className="text-xl font-bold mb-4">{title}</h2>

                <div className="mb-4 flex border-b">
                    <button
                        className={`px-4 py-2 font-medium ${
                            activeTab === "info" ? "border-b-2 border-blue-600" : "text-gray-500"
                        }`}
                        onClick={() => setActiveTab("info")}
                    >
                        Основное
                    </button>
                    <button
                        className={`px-4 py-2 font-medium ${
                            activeTab === "schedule" ? "border-b-2 border-blue-600" : "text-gray-500"
                        }`}
                        onClick={() => setActiveTab("schedule")}
                    >
                        График
                    </button>
                    <button
                        className={`px-4 py-2 font-medium ${
                            activeTab === "services" ? "border-b-2 border-blue-600" : "text-gray-500"
                        }`}
                        onClick={() => setActiveTab("services")}
                    >
                        Услуги
                    </button>
                </div>

                <form onSubmit={(e) => {
                    setIsSubmitting(true);
                    onSubmit(e);
                }}>
                    {activeTab === "info" && (
                        <>
                            <div className="mb-4">
                                <label className="block font-semibold mb-1">Имя</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    ref={nameInputRef}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block font-semibold mb-1">Специализация</label>
                                <input
                                    type="text"
                                    name="specialty"
                                    value={formData.specialty}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block font-semibold mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block font-semibold mb-1">Телефон</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone} // Исправлено с form на formData
                                    onChange={(e) => {
                                        const input = e.target;
                                        const cursorPosition = input.selectionStart;
                                        let value = input.value;

                                        // Автоматическое добавление '+'
                                        if (!value.startsWith('+')) {
                                            value = '+' + value.replace(/\D/g, '');
                                        } else {
                                            value = value.replace(/\D/g, '').replace(/^\+/, '+');
                                        }

                                        // Ограничение длины
                                        value = value.slice(0, 16);

                                        // Обновление состояния
                                        setFormData(prev => ({
                                            ...prev,
                                            phone: value
                                        }));

                                        // Валидация
                                        setValidationErrors(prev => ({
                                            ...prev,
                                            phone: value ? UI_validatePhone(value) : ''
                                        }));

                                        // Восстановление позиции курсора
                                        setTimeout(() => {
                                            input.setSelectionRange(cursorPosition, cursorPosition);
                                        }, 0);
                                    }}
                                    placeholder="+71234567890 (необязательно)"
                                    className={`w-full p-2 border rounded ${
                                        validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {validationErrors.phone && (
                                    <div className="text-red-500 text-sm mt-1">{validationErrors.phone}</div>
                                )}
                            </div>
                            <div className="mb-4">
                                <label className="block font-semibold mb-1">Дата найма</label>
                                <input
                                    type="date"
                                    name="hire_date"
                                    value={formData.hire_date}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {activeTab === "schedule" && (
                        <>
                            <div className="mb-4">
                                <label className="block mb-1 font-semibold">Тип графика</label>
                                <select
                                    name="schedule_type"
                                    value={formData.schedule_type}
                                    onChange={(e) => handleInputChange({
                                        ...e,
                                        target: {
                                            ...e.target,
                                            value: e.target.value as 'weekly' /*| 'cycle'*/ // Только weekly
                                        }
                                    })}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="">Выберите тип</option>
                                    <option value="weekly">Еженедельный — график повторяется по дням недели</option>
                                    {/*<option value="cycle">Цикл (например, 2 через 3) — чередование смен по дням</option>*/}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block font-semibold mb-1">Дата начала</label>
                                <input
                                    type="date"
                                    name="schedule_start_date"
                                    value={formData.start_date || ""}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block font-semibold mb-1">Дата окончания</label>
                                <input
                                    type="date"
                                    name="schedule_end_date"
                                    value={formData.end_date || ""}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>

                            {formData.schedule_type === "weekly" && (
                                <div className="mb-4">
                                    <label className="block font-semibold mb-1">Периоды</label>
                                    {weeklyPeriods.map((p, i) => (
                                        <div key={i} className="flex gap-2 mb-2">
                                            {/* Кнопки перемещения */}
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newPeriods = [...weeklyPeriods];
                                                        [newPeriods[i], newPeriods[i - 1]] = [newPeriods[i - 1], newPeriods[i]];
                                                        setWeeklyPeriods(newPeriods);
                                                    }}
                                                    disabled={i === 0}
                                                    className="disabled:opacity-50"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newPeriods = [...weeklyPeriods];
                                                        [newPeriods[i], newPeriods[i + 1]] = [newPeriods[i + 1], newPeriods[i]];
                                                        setWeeklyPeriods(newPeriods);
                                                    }}
                                                    disabled={i === weeklyPeriods.length - 1}
                                                    className="disabled:opacity-50"
                                                >
                                                    ↓
                                                </button>
                                            </div>
                                            <select
                                                value={p.day}
                                                onChange={(e) => updateWeeklyPeriod(i, "day", e.target.value)}
                                                className="p-2 border rounded w-1/3"
                                            >
                                                {daysOfWeek.map((d) => (
                                                    <option key={d.key} value={d.key}>{d.label}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="time"
                                                value={p.start}
                                                onChange={(e) => updateWeeklyPeriod(i, "start", e.target.value)}
                                                className="p-2 border rounded w-1/3"
                                            />
                                            <input
                                                type="time"
                                                value={p.end}
                                                onChange={(e) => updateWeeklyPeriod(i, "end", e.target.value)}
                                                className="p-2 border rounded w-1/3"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeWeeklyPeriod(i)}
                                                className="text-red-500 hover:text-red-700"
                                                title="Удалить период"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addWeeklyPeriod} className="text-blue-600">+ Добавить период</button>
                                </div>
                            )}
                            {/* // 5. Закомментировать секцию cycle */}
                            {/*
                                formData.schedule_type === "cycle" && (
                                <div className="mb-4">
                                    <label className="block font-semibold mb-1">Периоды</label>
                                    {cyclePeriods.map((p, i) => (
                                        <div key={i} className="flex gap-2 mb-2">
                                            <input
                                                type="number"
                                                min={0}
                                                max={31}
                                                value={p.day}
                                                onChange={(e) => updateCyclePeriod(i, "day", parseInt(e.target.value))}
                                                className="p-2 border rounded w-1/4"
                                            />
                                            <input
                                                type="time"
                                                value={p.start}
                                                onChange={(e) => updateCyclePeriod(i, "start", e.target.value)}
                                                className="p-2 border rounded w-1/3"
                                            />
                                            <input
                                                type="time"
                                                value={p.end}
                                                onChange={(e) => updateCyclePeriod(i, "end", e.target.value)}
                                                className="p-2 border rounded w-1/3"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeCyclePeriod(i)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addCyclePeriod} className="text-blue-600">+ Добавить период</button>
                                </div>
                            )
                            */}
                        </>
                    )}

                    {isScheduleLoading && (
                        <div className="text-center py-4">
                            <p>Загрузка расписания...</p>
                        </div>
                    )}

                    {/*}// 5. Реализация вкладки "Услуги":*/}
                    {activeTab === "services" && (
                        <div className="mb-4">
                            <label className="block font-semibold mb-2">Доступные услуги</label>

                            {// @ts-ignore
                                props.isServicesLoading ? (
                                <div className="text-center py-4">Загрузка услуг...</div>
                            ) : availableServices.length === 0 ? (
                                <div className="text-gray-500">Нет доступных услуг</div>
                            ) : (
                                <div className="space-y-2">
                                    {availableServices.map(service => (
                                        // @ts-ignore
                                        <div key={service.id} className="flex items-center gap-4 p-2 border rounded">
                                            <input
                                                type="checkbox"
                                                // @ts-ignore
                                                checked={localSelectedServices.some(s => s.service_id === service.id)}
                                                onChange={(e) => handleServiceChange(service, e.target.checked)}
                                            />

                                            <span className="flex-1">

      {
          // @ts-ignore
          service.name
      }
                                                {/* Название из основного объекта услуги */}
    </span>

                                            {// @ts-ignore
                                                localSelectedServices.some(s => s.service_id === service.id) && (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        // @ts-ignore
                                                        value={localSelectedServices.find(s => s.service_id === service.id)?.individual_price}
                                                        // @ts-ignore
                                                        onChange={(e) => handlePriceChange(service.id, Number(e.target.value))}
                                                    />
                                                    <input
                                                        type="number"
                                                        // @ts-ignore
                                                        value={localSelectedServices.find(s => s.service_id === service.id)?.duration_minutes}
                                                        // @ts-ignore
                                                        onChange={(e) => handleDurationChange(service.id, Number(e.target.value))}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                            disabled={isSubmitting || isServicesLoading}
                        >
                            {isSubmitting ? "Сохранение..." : "Сохранить"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
