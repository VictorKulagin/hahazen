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
import { Services, fetchServices } from "@/services/servicesApi";
import {cabinetDashboard} from "@/services/cabinetDashboard";
import { createServices } from "@/services/servicesApi";
//import { fetchEmployees } from "@/services/employeeApi"; // Импорт функции из API-файла
import { deleteServices } from "@/services/servicesApi";
import { updateServices } from "@/services/servicesApi";
import apiClient from "../../../../services/api";
import Link from "next/link";
import {AxiosError} from "axios";
import EmployeesList from "@/components/EmployeesList";
//import {fetchServices} from "@/services/servicesApi";

const Page: React.FC = ( ) => {


    // Закрыть меню при клике на элемент
    const handleMenuItemClick = () => setIsMenuOpen(false);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingServices, setEditingServices] = useState<Services | null>(null);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [userData, setUserData] = useState<any>(null);
    const [branchesData, setBranchesData] = useState<any>(null);

    const [companiesData, setCompaniesData] = useState<any>(null);
    const [isModalFilOpen, setIsModalFilOpen] = useState(false);
    const [isAccordionOpenEmployees, setIsAccordionOpenEmployees] = useState(false);
    const [isAccordionOpenClients, setIsAccordionOpenClients] = useState(false);

    const [services, setServices] = useState<Services[]>([]);

    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    const [isNotFound, setIsNotFound] = useState(false);

    const router = useRouter();

    const toggleFilModal = () => {
        setIsModalFilOpen((prev) => !prev);
    };
    const handleLogout = () => {
        localStorage.removeItem("access_token"); // Удаляем токен
        router.push("/signin"); // Перенаправляем на страницу логина
    };


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
        const loadServices = async () => {
            try {
                const servicesData = await fetchServices(); // Используем функцию из API
                setServices(servicesData); // Обновляем состояние сотрудников
            } catch (error: any) {
                setError(error.response?.data?.message || error.message); // Обработка ошибок
            } finally {
                setLoading(false); // Завершаем загрузку
            }
        };

        loadServices(); // Запуск функции загрузки сотрудников
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


    /*useEffect(() => {
        if (isModalOpen) {
            document.querySelector("input[name='name']").focus();
        }
    }, [isModalOpen]);*/

    useEffect(() => {
        if (isModalOpen) {
            nameInputRef.current?.focus();
        }
    }, [isModalOpen]);


    const [formData, setFormData] = useState({
        name: "",
        duration_minutes: 0,
        base_price: 0,
    });

    // Обработчик изменения данных в форме
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };



    const handleDelete = async (id: number) => {
        if (!window.confirm("Вы уверены, что хотите удалить сотрудника?")) {
            return;
        }

        try {
            await deleteServices(id);
            setServices((prev) => prev.filter((services) => services.id !== id));
        } catch (error) {
            console.error("Ошибка при удалении сотрудника:", error);
        }
    };


    const handleEdit = (services: Services) => {
        setEditingServices(services);
        setFormData({
            name: services.name,
            duration_minutes: services.duration_minutes,
            base_price: services.base_price,
        });
        setIsEditModalOpen(true);
    };


    const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const newServices = await createServices({ ...formData, branch_id: id, online_booking: 1, online_booking_name: '', online_booking_description: ''  });
            setServices((prev) => [...prev, newServices]);
            setFormData({ name: "", duration_minutes: 0, base_price: 0 });
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Ошибка при добавлении услуги:", error);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingServices || editingServices.id === undefined) {
            console.error("Ошибка: Нет услуги для редактирования или отсутствует ID");
            return;
        }
        try {
            const updatedServices = await updateServices(editingServices.id, formData);
            setServices((prev) => prev.map(emp => emp.id === editingServices.id ? updatedServices : emp));
            setFormData({ name: "", duration_minutes: 0, base_price: 0 });
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Ошибка при обновлении сотрудника:", error);
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


    // Пример сотрудников
    const Memployees = [
        { id: 1, name: "Иван Иванов" },
        { id: 2, name: "Мария Петрова" },
        { id: 3, name: "Алексей Сидоров" },
    ];

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
                    <EmployeesList branchId={id as number | undefined}/>
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
                            Настройки / Услуги
                        </nav>
                        <h1 className="text-2xl font-bold mb-2">Услуги</h1>
                    </>
                </header>

                {/* Кнопка "Добавить услуги" */}
                <div className="mb-4">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        + Добавить услуги
                    </button>
                </div>

                {/* Таблица Услуг */}
                <ServicesTable
                    loading={loading}
                    error={error}
                    services={services}
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

                            <h2 className="text-xl font-bold mb-4">Добавить услугу</h2>

                        </div>
                    </div>
                )}

                {/* Модальное окно добавления */}
                <ServiceModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSubmit={handleAddSubmit}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    title="Добавить Услугу"
                />

                {/* Модальное окно редактирования */}
                <ServiceModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={handleEditSubmit}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    title="Редактировать услугу"
                />
            </main>
        </div>
    );
};

export default withAuth(Page);

const ServicesTable = ({
                           loading,
                           error,
                           services,
                           handleEdit,
                           handleDelete,
                       }: {
    loading: boolean;
    error: string;
    services: Services[];
    handleEdit: (service: Services) => void;
    handleDelete: (id: number) => void;
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6">
            <section className="bg-white text-black p-4 rounded shadow">
                <h2 className="text-lg font-semibold mb-2">Услуги</h2>

                <div className="overflow-auto">
                    {loading ? (
                        <div className="text-center text-gray-500">Загрузка...</div>
                    ) : error ? (
                        <div className="text-center text-red-500">Ошибка: {error}</div>
                    ) : services.length === 0 ? (
                        <div className="text-center text-gray-500">Нет данных</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300 min-w-[400px]">
                                <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2 text-left whitespace-nowrap">Услуга</th>
                                    <th className="border p-2 text-left whitespace-nowrap">Длительность</th>
                                    <th className="border p-2 text-left whitespace-nowrap">Цена</th>
                                    <th className="border p-2 w-0.5"></th>
                                    <th className="border p-2 w-0.5"></th>
                                </tr>
                                </thead>
                                <tbody>
                                {services.map((service) => (
                                    <tr key={service.id} className="hover:bg-gray-50">
                                        <td className="border p-2 whitespace-nowrap">{service.name}</td>
                                        <td className="border p-2 whitespace-nowrap">
                                            {service.duration_minutes} мин
                                        </td>
                                        <td className="border p-2 whitespace-nowrap">
                                            {service.base_price} ₽
                                        </td>
                                        <td className="border p-2">
                                            <button
                                                onClick={() => handleEdit(service)}
                                                className="p-1 hover:bg-gray-100 rounded-full"
                                            >
                                                <PencilIcon className="h-6 w-6 text-blue-500" />
                                            </button>
                                        </td>
                                        <td className="border p-2">
                                            <button
                                                onClick={() => handleDelete(service.id)}
                                                className="p-1 hover:bg-gray-100 rounded-full"
                                            >
                                                <TrashIcon className="h-6 w-6 text-red-500" />
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


type ServiceModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    formData: {
        name: string;
        duration_minutes: number;
        base_price: number;
    };
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    title: string;
};

const ServiceModal = ({
                          isOpen,
                          onClose,
                          onSubmit,
                          formData,
                          handleInputChange,
                          title,
                      }: ServiceModalProps) => {
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            nameInputRef.current?.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white text-black p-6 rounded shadow-lg w-96 relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                    ✖
                </button>
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <form onSubmit={onSubmit}>
                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Услуга</label>
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
                        <label className="block font-semibold mb-1">Длительность минут</label>
                        <input
                            type="number"
                            name="duration_minutes"
                            value={formData.duration_minutes}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Базовая цена</label>
                        <input
                            type="number"
                            name="base_price"
                            value={formData.base_price}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div className="flex justify-end">
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
                        >
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
