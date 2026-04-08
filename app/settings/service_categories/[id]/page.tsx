// app\settings\service_categories\[id]\page
"use client";
import React, {useEffect, useState, useRef} from "react";

import {
    TrashIcon,
    PencilIcon, Bars3Icon // Для редактирования
} from "@heroicons/react/24/outline";
import {withAuth} from "@/hoc/withAuth";
import {useParams, useRouter} from "next/navigation";
import {branchesList} from "@/services/branchesList";
import {companiesList} from "@/services/companiesList";
import { Services, fetchServices } from "@/services/servicesApi";
import {cabinetDashboard} from "@/services/cabinetDashboard";
import SidebarMenu from "@/components/SidebarMenu";



import { useServices, useDeleteService } from "@/hooks/useServices";

import { ServiceManager } from "@/components/schedulePage/ServiceManager";
import { ServiceManagerUpdateOne } from "@/components/schedulePage/ServiceManagerUpdateOne";


import {AxiosError} from "axios";
import Image from "next/image";
import Loader from "@/components/Loader";
import {authStorage} from "@/services/authStorage";

import { Pencil, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/lib/theme/theme.context";

const Page: React.FC = ( ) => {


    // Закрыть меню при клике на элемент
    const handleMenuItemClick = () => setIsMenuOpen(false);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [userData, setUserData] = useState<any>(null);
    const [branchesData, setBranchesData] = useState<any>(null);

    const [companiesData, setCompaniesData] = useState<any>(null);
    const [isModalFilOpen, setIsModalFilOpen] = useState(false);
    const [isAccordionOpenEmployees, setIsAccordionOpenEmployees] = useState(false);
    const [isAccordionOpenClients, setIsAccordionOpenClients] = useState(false);

    const [isServiceManagerOpen, setIsServiceManagerOpen] = useState(false);
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);

    const [selectedService, setSelectedService] = useState<Services | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    const [isNotFound, setIsNotFound] = useState(false);

    const router = useRouter();

    const { data: services = [], isLoading: servicesLoading, error: servicesError } = useServices();
    const { mutateAsync: deleteService } = useDeleteService(); // ✅ Добавлено

    const { theme } = useTheme();

    const toggleFilModal = () => {
        setIsModalFilOpen((prev) => !prev);
    };
    const handleLogout = () => {
        localStorage.removeItem("access_token"); // Удаляем токен
        router.push("/signin"); // Перенаправляем на страницу логина
    };

    const globalLoading =
        isLoading ||
        !companiesData ||
        !branchesData ||
        !userData

    const globalError = error || !companiesData || !branchesData ? error : "";

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



    useEffect(() => {
        if (isModalOpen) {
            nameInputRef.current?.focus();
        }
    }, [isModalOpen]);



    const handleDelete = async (id: number) => {
        if (!window.confirm("Удалить услугу?")) return;
        await deleteService(id); // React Query сам инвалидацией обновит список
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


    return (
        <div className="relative min-h-screen md:grid md:grid-cols-[30%_70%] lg:grid-cols-[20%_80%] bg-backgroundBlue">
            {/* Подложка для клика вне меню */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}

            {/* Меню */}
            <aside
                className={`bg-[rgb(var(--sidebar))] text-[rgb(var(--sidebar-foreground))] p-4 fixed z-20 h-full flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${
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
                    <Bars3Icon className="h-6 w-6 text-white" />
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
                className="bg-backgroundBlue  p-4 h-full md:h-auto"
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

                {/* Заголовок */}
                <div className="flex items-center bg-[#081b27] text-white p-3 rounded-md mb-4">

                    <div className="flex items-center gap-3">
                        <span>Тема: {theme}</span>
                        <ThemeToggle />
                    </div>

                    <span className="ml-auto font-semibold text-sm">
                        Услуги
                    </span>
                </div>

                {/* Кнопка "Добавить услуги" */}
                {authStorage.has("master:create") && (
                    <div className="mb-4">
                        <button
                            onClick={() => setIsServiceManagerOpen(true)}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            + Добавить услуги
                        </button>
                    </div>
                )}
                {/* Таблица Услуг */}
                <ServicesTable
                    loading={servicesLoading}
                    error={servicesError?.message || ""}  // чтобы тип совпал
                    services={services}
                    handleDelete={handleDelete}
                    setIsUpdateOpen={setIsUpdateOpen}
                    setSelectedService={setSelectedService}
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

                {isServiceManagerOpen && (
                    <ServiceManager
                        branchId={id}
                        onClose={() => setIsServiceManagerOpen(false)}
                    />
                )}

                <ServiceManagerUpdateOne
                    service={selectedService}
                    onClose={() => setSelectedService(null)}
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
                           handleDelete,
                           setIsUpdateOpen,
                           setSelectedService
                       }: {
    loading: boolean;
    error: string;
    services: Services[];
    handleDelete: (id: number) => void;
    setIsUpdateOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedService: React.Dispatch<React.SetStateAction<Services | null>>;
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
                        <div className="space-y-3">
                            {services.map((service) => (
                                <div
                                    key={service.id}
                                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm"
                                >
                                    {/* Левая часть */}
                                    <div>
                                        <div className="font-semibold text-gray-800">
                                            {service.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {service.duration_minutes} мин • {service.base_price} ₽
                                        </div>
                                    </div>

                                    {/* Правая часть */}
                                    <div className="flex items-center gap-2">
                                        {authStorage.has("master:update") && (
                                            <button
                                                onClick={() => setSelectedService(service)}
                                                className="inline-flex items-center gap-2 rounded-md bg-blue-100 px-3 py-2 text-sm text-blue-700 hover:bg-blue-200 transition"
                                            >
                                                <Pencil size={14} />
                                                <span className="hidden sm:inline">Редактировать</span>
                                            </button>
                                        )}

                                        {authStorage.has("master:delete") && (
                                            <button
                                                onClick={() => handleDelete(service.id)}
                                                className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
