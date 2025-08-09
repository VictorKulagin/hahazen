"use client";
import React, { useEffect, useState } from "react";
import { withAuth } from "@/hoc/withAuth";
import Image from "next/image";
import Link from "next/link";
import { cabinetDashboard } from "@/services/cabinetDashboard";
import { companiesList } from "@/services/companiesList";
import { useClients } from '@/hooks/useClient';
import Pagination from '@/components/Pagination';

import {
    UserGroupIcon,
    UsersIcon,
    GlobeAltIcon,
    Cog8ToothIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    UserIcon,
    ArrowRightOnRectangleIcon,
    AtSymbolIcon,
    PhoneIcon
} from "@heroicons/react/24/outline";
import {useRouter} from "next/navigation";
import {branchesList} from "@/services/branchesList";
import { useParams } from 'next/navigation';
import EmployeesList from "@/components/EmployeesList";
import {useQueryClient} from "@tanstack/react-query";
import {fetchClients} from "@/services/clientApi";

interface ApiError extends Error {
    data?: {
        message?: string;
    };
}

interface PageProps {
    search?: string;
    pagination?: {
        page: number;
        perPage: number;
    };
}
const Page: React.FC = () => {

    const search = ""; // или useState
    const pagination = { page: 1, perPage: 10 };

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAccordionOpenEmployees, setIsAccordionOpenEmployees] = useState(false);
    const [isAccordionOpenClients, setIsAccordionOpenClients] = useState(false);

    const [branchesData, setBranchesData] = useState<any>(null);
    const [companiesData, setCompaniesData] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");



    const [isModalFilOpen, setIsModalFilOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState(""); // Для поиска в будущем
    // ЕДИНСТВЕННЫЙ ВЫЗОВ useClients (с переименованным error):
    const { data: clientsData, isLoading: isClientsLoading, error: clientsError } = useClients(searchQuery, {
        page,
        perPage
    });


    const queryClient = useQueryClient(); // Импортируйте из @tanstack/react-query

    // Функция предзагрузки
    const prefetchPage = (targetPage: number) => {
        queryClient.prefetchQuery({
            queryKey: ['clients', searchQuery, targetPage, perPage],
            queryFn: () => fetchClients({
                search: searchQuery,
                page: targetPage,
                per_page: perPage,
            }),
            staleTime: 60_000,
        });
    };

    // Функция для открытия/закрытия модального окна
    const toggleFilModal = () => {
        setIsModalFilOpen((prev) => !prev);
    };


    //const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();



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
                // @ts-ignore
                setError(`Ошибка: ${err?.message || "Неизвестная ошибка"}`);
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
                // @ts-ignore
                setError(`Ошибка: ${err.response?.data?.message || err.message || "Неизвестная ошибка"}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("access_token"); // Или брать из cookie

        if (!token) {
            setError("Токен не найден.");
            setIsLoading(false);
            return;
        }

        const fetchUserData = async () => {
            try {
                const data = await cabinetDashboard();
                console.log("response.data", data);
                setUserData(data); // Сохраняем данные пользователя
            } catch (err: unknown) {
                // @ts-ignore
                setError(`Ошибка: ${err.data?.message || err.message || "Неизвестная ошибка"}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    //const id = branchesData?.[0]?.company_id ?? null;


    const getCompanyId = (data: any[]): number | null => {
        return data?.[0]?.id ?? null;
    };
// Использование:
    const id = getCompanyId(branchesData);

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
            console.warn(`Редирект на 404: idFromUrl (${idFromUrl}) !== id (${id})`);
            router.replace("/404");
        }
    }, [idFromUrl, id]);

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
            icon: <UsersIcon className="h-8 w-8 text-gray-200" />,
            content: (
                <div className="ml-10 mt-2">
                    {clients.map((client) => (  // Список клиентов, аналогично сотрудникам
                        <Link
                            key={client.id}
                            href={client.url}
                            target="_blank"
                            rel="noopener noreferrer"
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
                <Link href={`/settings/menu/${id}`} className="flex items-center">
                    Настройки
                </Link>
            ),
            icon: <Cog8ToothIcon className="h-8 w-8 text-gray-400" />, isActive: false
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

// Обновленный компонент Pagination с плавными анимациями
    // В компоненте Page добавьте функции:

    const Pagination = () => {
        if (!clientsData?.pagination || clientsData.pagination.totalPages <= 1) return null;

        const { currentPage, totalPages, hasPrevPage, hasNextPage, prevPage, nextPage } = clientsData.pagination;
        // Определяем размер экрана
        const [isMobile, setIsMobile] = useState(false);

        useEffect(() => {
            const checkScreenSize = () => {
                setIsMobile(window.innerWidth < 768);
            };

            checkScreenSize(); // Проверяем при загрузке
            window.addEventListener('resize', checkScreenSize);

            return () => window.removeEventListener('resize', checkScreenSize);
        }, []);


        // Умная генерация номеров страниц
        // 🎯 Адаптивная генерация страниц
        const getPageNumbers = () => {
            const pages = [];
            const maxVisiblePages = isMobile ? 3 : 7; // Мобиле: 3, Десктоп: 7

            if (totalPages <= maxVisiblePages) {
                // Простая пагинация: [1] [2] [3]
                for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                if (isMobile) {
                    // 📱 МОБИЛЬНАЯ версия: только текущая и соседние
                    // Результат: [...] [5] [6] [7] [...] ИЛИ [1] [2] [3] [...] ИЛИ [...] [18] [19] [20]

                    if (currentPage <= 2) {
                        // В начале: [1] [2] [3] [...]
                        pages.push(1, 2, 3, -1);
                    } else if (currentPage >= totalPages - 1) {
                        // В конце: [...] [18] [19] [20]
                        pages.push(-1, totalPages - 2, totalPages - 1, totalPages);
                    } else {
                        // В середине: [...] [5] [6] [7] [...]
                        pages.push(-1, currentPage - 1, currentPage, currentPage + 1, -1);
                    }
                } else {
                    // 🖥️ ДЕСКТОПНАЯ версия (как было)
                    pages.push(1);

                    const startPage = Math.max(2, currentPage - 2);
                    const endPage = Math.min(totalPages - 1, currentPage + 2);

                    if (startPage > 2) pages.push(-1);

                    for (let i = startPage; i <= endPage; i++) {
                        if (i !== 1 && i !== totalPages) pages.push(i);
                    }

                    if (endPage < totalPages - 1) pages.push(-1);
                    if (totalPages > 1) pages.push(totalPages);
                }
            }

            return pages;
        };

        return (
            <nav className="flex justify-center mt-8 mb-4" aria-label="Pagination">
                <ul className="inline-flex items-center space-x-1 bg-gray-900/50 rounded-xl p-2 backdrop-blur-sm">
                    <li>
                        <button
                            onClick={() => hasPrevPage && setPage(page - 1)}
                            disabled={!hasPrevPage || isClientsLoading}
                            className={`
                            flex items-center justify-center rounded-lg
                            transition-all duration-200 ease-in-out transform
                            ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}  // Меньше на мобиле
                            ${!hasPrevPage || isClientsLoading
                                ? 'text-gray-500 bg-gray-800 cursor-not-allowed'
                                : 'text-white bg-green-600 hover:bg-green-500 hover:scale-105'
                            }
                        `}
                        >
                            <svg className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </li>

                    {/* Номера страниц */}
                    {getPageNumbers().map((pageNum, index) => (
                        pageNum === -1 ? (
                            // Эллипс
                            <li key={`ellipsis-${index}`}>
                            <span className={`flex items-center justify-center text-gray-400 ${
                                isMobile ? 'px-1 h-8 text-xs' : 'px-3 h-10 text-sm'
                            }`}>
                                ...
                            </span>
                            </li>
                        ) : (
                            // Номер страницы
                            <li key={`page-${pageNum}`}>
                                <button
                                    onClick={() => setPage(pageNum)}
                                    disabled={isClientsLoading}
                                    className={`
                                    flex items-center justify-center rounded-lg font-semibold
                                    transition-all duration-200 ease-in-out
                                    ${isMobile ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}
                                    ${page === pageNum
                                        ? 'text-white bg-green-500 scale-105 shadow-lg shadow-green-500/30'
                                        : isClientsLoading
                                            ? 'text-gray-400 bg-gray-800'
                                            : 'text-gray-300 bg-gray-700 hover:bg-green-600'
                                    }
                                `}
                                >
                                    {isClientsLoading && page === pageNum ? (
                                        <div className={`border-2 border-white border-t-transparent rounded-full animate-spin ${
                                            isMobile ? 'w-3 h-3' : 'w-4 h-4'
                                        }`}></div>
                                    ) : pageNum}
                                </button>
                            </li>
                        )
                    ))}

                    {/* Кнопка "Вперед" */}
                    <li>
                        <button
                            onClick={() => hasNextPage && setPage(page + 1)}
                            disabled={!hasNextPage || isClientsLoading}
                            className={`
                            flex items-center justify-center rounded-lg
                            transition-all duration-200 ease-in-out transform
                            ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}
                            ${!hasNextPage || isClientsLoading
                                ? 'text-gray-500 bg-gray-800 cursor-not-allowed'
                                : 'text-white bg-green-600 hover:bg-green-500 hover:scale-105'
                            }
                        `}
                        >
                            <svg className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </li>
                </ul>

                {/* Информация - скрываем на мобиле или делаем компактнее */}
                <div className={`flex items-center text-gray-400 ${
                    isMobile ? 'ml-2 text-xs' : 'ml-4 text-sm'
                }`}>
                <span className="bg-gray-800 px-2 py-1 rounded-lg">
                    {isMobile ? `${currentPage}/${totalPages}` : `Страница ${currentPage} из ${totalPages}`}
                </span>
                </div>
            </nav>
        );
    };

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

                {/* Шапка с логотипом */}
                <div
                    className="border-b border-gray-400 p-2 flex items-center cursor-pointer"
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
                                            ? <ChevronUpIcon className="h-5 w-5 inline"/>
                                            : <ChevronDownIcon className="h-5 w-5 inline"/>
                                        : item.label === "Клиенты" && (isAccordionOpenClients
                                        ? <ChevronUpIcon className="h-5 w-5 inline"/>
                                        : <ChevronDownIcon className="h-5 w-5 inline"/>)
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
                    <h1 className="text-2xl font-bold mb-2">Клиентская база (раздел в разработке)</h1>
                </header>

                {/* Контент: две колонки */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    {/* Первая колонка */}
                    <section className="bg-white text-black p-4 rounded shadow">
                        <div className="flex items-center mb-2">
                            <h2 className="text-lg font-semibold mb-2">Личные данные</h2>
                        </div>
                        {/* Ссылка с динамическим путем */}
                        <div className="mb-2">

                            <div className="space-y-3">
                                <p className="text-2xl font-bold">Привет, {userData?.name}! Раздел ещё в режиме разработки</p>
                                <section className="bg-white text-black p-4 rounded shadow">
                                    <div className="flex items-center mb-2">
                                        <h2 className="text-lg font-semibold mb-2">Клиенты</h2>
                                    </div>

                                    {isClientsLoading ? (
                                        <div className="text-center py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span>Загрузка клиентов...</span>
                                            </div>
                                        </div>
                                    ) : clientsError ? (
                                        <div className="text-red-500 text-center py-4">
                                            Ошибка: {clientsError.message}
                                        </div>
                                    ) : clientsData?.clients && clientsData.clients.length > 0 ? (
                                        <>
                                            <ul className="space-y-3">
                                                {clientsData.clients.map(client => (
                                                    <li key={client.id} className="border-b border-gray-200 pb-3">
                                                        <p className="text-lg font-medium">Имя: {client.name}</p>
                                                        <p className="text-gray-600">Телефон: {client.phone}</p>
                                                        {client.email && (
                                                            <p className="text-gray-600">Email: {client.email}</p>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>

                                            {/* ВАЖНО: Пагинация показывается даже во время загрузки */}
                                            <Pagination />
                                        </>
                                    ) : (
                                        <div className="text-center py-4 text-gray-500">
                                            Клиенты не найдены на странице {page}
                                        </div>
                                    )}
                                </section>

                                <p>ID: {userData?.id}</p>

                            </div>

                        </div>
                        {/*{Boolean(id) && (
                            <div className="mb-2">
                                <Link href={`/settings/service_categories/${id}`} className="hover:underline">
                                    Услуги
                                </Link>
                            </div>
                        )}
                        {Boolean(id) && (
                            <div className="mb-2">
                                <Link href={`/settings/filial_staff/${id}`} className="hover:underline">
                                    Сотрудники
                                </Link>
                            </div>
                        )}*/}
                    </section>

                    {/* Вторая колонка */}
                    {/*<section className="bg-white text-black p-4 rounded shadow">
                        <div className="flex items-center mb-2">
                            <h2 className="text-lg font-semibold mb-2">Настройки</h2>
                        </div>
                        <p>Настройки филиала</p>
                    </section>*/}
                </div>
            </main>
        </div>
    );
};
export default withAuth(Page);
