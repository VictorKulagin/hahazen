"use client";
import React, { useEffect, useState } from "react";
import { withAuth } from "@/hoc/withAuth";
import Image from "next/image";
import Link from "next/link";
import { cabinetDashboard } from "@/services/cabinetDashboard";
import { companiesList } from "@/services/companiesList";
import { useClients, useClient, useDeleteClient } from '@/hooks/useClient';
import Pagination from '@/components/Pagination';
import SidebarMenu from "@/components/SidebarMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/lib/theme/theme.context";

import {Phone, Pencil, UserCircle2, Trash2} from "lucide-react";



import {
    UserIcon,
    PhoneIcon,
    ArrowLeftIcon,
    IdentificationIcon,
    StarIcon,
    GiftIcon,
    CreditCardIcon,
    CakeIcon,
    SparklesIcon,
    UserGroupIcon,
    Bars3Icon,
    ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";
import {useRouter} from "next/navigation";
import {branchesList} from "@/services/branchesList";
import { useParams } from 'next/navigation';
import {useQueryClient} from "@tanstack/react-query";
import {fetchClients} from "@/services/clientApi";
import ClientCardEditable from "@/components/ClientCardEditable";
import Loader from "@/components/Loader";
import {authStorage} from "@/services/authStorage";
import {fetchEmployees} from "@/services/employeeApi";
import {EditClientModal} from "@/components/schedulePage/EditСlientModal";
import {CreateClientModal} from "@/components/schedulePage/CreateСlientModal";



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
    const [filters, setFilters] = useState({
        name: '',
        phone: '',
        last_name: '',
        gender: '',
        vip: '',
    });

    const [isModalFilOpen, setIsModalFilOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState(""); // Для поиска в будущем
    // ЕДИНСТВЕННЫЙ ВЫЗОВ useClients (с переименованным error):
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const { data: clientsData, isLoading: isClientsLoading, error: clientsError } = useClients(filters, { page, perPage });
    const { data: selectedClient, isLoading: isClientLoading, error: clientError } = useClient(selectedClientId ?? undefined);
    const [isEditing, setIsEditing] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const deleteClientMutation = useDeleteClient();
    const [editingClientId, setEditingClientId] = useState<number | null>(null);
    const { data: editingClient } = useClient(editingClientId ?? undefined);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [isFilterOpen, setIsFilterOpen] = useState(true);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    const { theme } = useTheme();

    const totalClients = (clientsData?.pagination?.totalPages ?? 0) * 20;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    const handleCancelEdit = () => {
        setIsEditing(false);
    };
    const serializeFilters = (filters: { [key: string]: string }) => {
        return Object.entries(filters)
            .filter(([_, value]) => value.trim() !== '')
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
    };

    const globalLoading =
        isLoading ||
        !companiesData ||
        !branchesData ||
        !userData

    const globalError = error || !companiesData || !branchesData ? error : "";

    const queryClient = useQueryClient(); // Импортируйте из @tanstack/react-query


    const avatarColors = [
        "bg-indigo-500",
        "bg-pink-500",
        "bg-orange-500",
        "bg-green-500",
        "bg-blue-500",
        "bg-purple-500",
        "bg-emerald-500",
        "bg-rose-500",
    ];

    function getAvatarColor(name: string = "") {
        let hash = 0;

        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % avatarColors.length;
        return avatarColors[index];
    }

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

    const Section = ({ title, items }: any) => (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{title}</h2>

            <div className="space-y-3">
                {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <item.icon className="h-5 w-5 text-gray-400 dark:text-gray-400" />
                            <span>{item.label}</span>
                        </div>

                        <div className="font-medium text-gray-900 dark:text-white">
                            {item.value || "—"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );


/* Карточка клиента */

    const mainInfo = selectedClient
        ? [
            { icon: IdentificationIcon, label: "ID", value: selectedClient.user_id },
            { icon: UserIcon, label: "Имя", value: selectedClient.name },
            { icon: UserIcon, label: "Фамилия", value: selectedClient.last_name },
            { icon: UserIcon, label: "Отчество", value: selectedClient.patronymic },
            { icon: UserIcon, label: "Пол", value: selectedClient.gender },
        ]
        : [];

    const contactInfo = selectedClient
        ? [
            { icon: PhoneIcon, label: "Телефон", value: selectedClient.phone },
            { icon: UserIcon, label: "Email", value: selectedClient.email },
        ]
        : [];

    const extraInfo = selectedClient
        ? [
            { icon: StarIcon, label: "VIP", value: selectedClient.vip === 1 ? "Да" : "Нет" },
            { icon: GiftIcon, label: "Скидка", value: selectedClient.discount },
            { icon: CreditCardIcon, label: "Номер карты", value: selectedClient.card_number },
            { icon: CakeIcon, label: "День рождения", value: selectedClient.birth_date },
            { icon: CakeIcon, label: "Запрет онлайн", value: selectedClient.forbid_online_booking === 1 ? "Да" : "Нет" },
            { icon: ChatBubbleLeftRightIcon, label: "Комментарий", value: selectedClient.comment },
        ]
        : [];

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


    /*useEffect(() => {
        const apply = () => {
            const mobile = window.innerWidth < 768;
            setIsFilterOpen(!mobile);
        };

        apply();
        window.addEventListener("resize", apply);
        return () => window.removeEventListener("resize", apply);
    }, []);*/

    useEffect(() => {
        // один раз при первом рендере (когда уже есть window)
        if (window.matchMedia("(max-width: 767px)").matches) {
            setIsFilterOpen(false); // свернуть только один раз
        }
    }, []);

    //const id = branchesData?.[0]?.company_id ?? null;


    /*const getCompanyId = (data: any[]): number | null => {
        return data?.[0]?.id ?? null;
    };
// Использование:
    const id = getCompanyId(branchesData);*/

    const branchId = branchesData?.[0]?.id ?? null;

// ✅ временно оставляем старое имя, чтобы ничего не ломать
    const id = branchId;

    const params = useParams();
    //const idFromUrl = params.id as string || null;
    let idFromUrl: string | null = null;
    if (params && 'id' in params) {
        idFromUrl = params.id as string;
    }

    const companyId = companiesData?.[0]?.id ?? null;
    const userId = userData?.id ?? null; // у тебя внизу уже есть userData?.id

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


    // 🔹 Если загрузка — показываем Loader
    if (globalLoading) {
        return (
            <div className="h-screen bg-backgroundBlue">
                <Loader type="default" visible={true} />
            </div>
        );
    }

// 🔹 Если ошибка — показываем fallback
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




    return (
        <div className="relative min-h-screen md:grid md:grid-cols-[320px_1fr] bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
            {/* Подложка для клика вне меню */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}


            {/* Левая колонка (меню) */}
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
                        className="absolute left-0 top-0 h-full w-4/5 sm:w-2/3 flex-shrink-0 bg-[rgb(var(--card))] text-[rgb(var(--foreground))] border border-[rgb(var(--border))] transform translate-x-0 transition-transform duration-300"
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
                className="min-h-screen bg-[rgb(var(--background))] px-3 py-4 md:px-6 md:py-6"
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
                <div className="mb-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:shadow-none">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Клиентская база
                        </h1>
                    </div>


                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400">
                            Тема: {theme}
                        </span>
                        <ThemeToggle />
                    </div>
                </div>


                {/* Кнопка "Добавить сотрудника" */}
                {authStorage.has("master:create") && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        + Добавить клиента
                    </button>
                )}


                {/* ✅ Новое окно — добавление сотрудника */}
                <CreateClientModal
                    isOpen={isAddModalOpen}
                    companyId={companyId}
                    userId={userId ?? 0}
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={() => {
                        setIsAddModalOpen(false);
                        // если список клиентов на другой странице — тут можно ничего не делать
                        // если ты всё же держишь клиентов локально — тогда refetch/перезагрузка там
                    }}
                />


                <EditClientModal
                    isOpen={isEditModalOpen}
                    //client={selectedClient ?? null}
                    client={editingClient ?? null}
                    companyId={companyId}
                    userId={userId}
                    /*onClose={() => setIsEditModalOpen(false)}
                    onSave={(updated) => {
                        // если ты показываешь карточку — можно обновить selectedClientId/refetch
                        setIsEditModalOpen(false);
                    }}*/
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingClientId(null);
                    }}
                    onSave={() => {
                        setIsEditModalOpen(false);
                        setEditingClientId(null);
                    }}
                />


                {/* Контент: две колонки */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6">
                    {/* Первая колонка */}
                    <section className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-white dark:shadow-none md:p-6">

                        {/* Ссылка с динамическим путем */}
                        {/*<div className="mb-2">*/}

                            <div className="space-y-3">
                                {/*<section className="bg-white text-black p-4 rounded shadow">*/}
                                    <div
                                        className={`transition-all duration-300 ${
                                            selectedClientId !== null ? "hidden" : "block"
                                        }`}
                                    >
                                    {/* === Форма фильтра (ВСЕГДА показывается) === */}
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                setPage(1);
                                                setSearchQuery(serializeFilters(filters));
                                            }}
                                            className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none"
                                        >
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsFilterOpen((v) => !v)}
                                                    className="text-base font-semibold text-gray-900 dark:text-white"
                                                >
                                                    Фильтр клиентов {isFilterOpen ? "▲" : "▼"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setFilters({ name: "", last_name: "", phone: "", gender: "", vip: "" })
                                                    }
                                                    className="text-sm text-gray-400 transition hover:text-gray-700 dark:text-gray-500 dark:hover:text-white"
                                                >
                                                    Сбросить
                                                </button>
                                            </div>

                                            {isFilterOpen && (
                                                <>
                                                    {/* Inputs */}
                                                    <div className="flex flex-col md:flex-row gap-3">
                                                        <input
                                                            type="text"
                                                            placeholder="Имя"
                                                            value={filters.name}
                                                            onChange={(e) =>
                                                                setFilters({ ...filters, name: e.target.value })
                                                            }
                                                            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                                        />

                                                        <input
                                                            type="text"
                                                            placeholder="Фамилия"
                                                            value={filters.last_name}
                                                            onChange={(e) =>
                                                                setFilters({ ...filters, last_name: e.target.value })
                                                            }
                                                            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                                        />

                                                        <input
                                                            type="text"
                                                            placeholder="Телефон"
                                                            value={filters.phone}
                                                            onChange={(e) =>
                                                                setFilters({ ...filters, phone: e.target.value })
                                                            }
                                                            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                                        />

                                                        <select
                                                            value={filters.gender}
                                                            onChange={(e) =>
                                                                setFilters({ ...filters, gender: e.target.value })
                                                            }
                                                            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                                        >
                                                            <option value="">Пол</option>
                                                            <option value="male">Мужской</option>
                                                            <option value="female">Женский</option>
                                                        </select>

                                                        <button
                                                            type="submit"
                                                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
                                                        >
                                                            Найти
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </form>

                                        <div className="flex items-center gap-2 mb-4">
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Клиенты
                                            </h2>

                                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-2 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
                                                {totalClients ?? 0}
                                            </span>
                                        </div>

                                    </div>
                                    {isClientsLoading ? (
                                        <div className="text-center py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span>Загрузка клиентов...</span>
                                            </div>
                                        </div>
                                    ) : clientsError ? (
                                        <div className="text-red-500 text-center py-4">Ошибка: {clientsError.message}</div>
                                    ) : clientsData?.clients && clientsData.clients.length > 0 ? (
                                        <>
                                            {selectedClientId !== null && selectedClient ? (
                                                isEditing ? (
                                                    <ClientCardEditable selectedClient={selectedClient} onCancel={handleCancelEdit} />
                                                ) : isClientLoading ? (
                                                    <p>Загрузка карточки клиента...</p>
                                                ) : clientError ? (
                                                    <p className="text-red-600">Ошибка загрузки клиента: {clientError.message}</p>
                                                ) : (
                                                    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:shadow-none md:p-6">
                                                        {/* Назад */}
                                                        <button
                                                            onClick={() => setSelectedClientId(null)}
                                                            className="flex items-center space-x-2 font-semibold text-green-600 transition hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                                        >
                                                            <ArrowLeftIcon className="h-5 w-5" />
                                                            <span>Назад</span>
                                                        </button>

                                                        {/* Сетка информации */}
                                                        {/* Header с аватаром */}
                                                        <div className="flex items-center gap-5 mb-6">

                                                            {/* Аватар в карточке*/}
                                                            <div
                                                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(selectedClient.name)}`}
                                                            >
                                                                {`${selectedClient.name?.[0] ?? ""}${selectedClient.last_name?.[0] ?? ""}`.toUpperCase() || "?"}

                                                            </div>

                                                            <div className="min-w-0">
                                                                <h1 className="text-2xl font-semibold text-gray-900 leading-tight truncate dark:text-white">
                                                                    {selectedClient.name}
                                                                </h1>
                                                                <p className="text-base text-gray-500 truncate dark:text-gray-400">
                                                                    {selectedClient.last_name ?? "-"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Сетка информации */}
                                                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                                            <Section title="Основное" items={mainInfo} />
                                                            <Section title="Контакты" items={contactInfo} />

                                                            <div className="xl:col-span-2">
                                                                <Section title="Дополнительно" items={extraInfo} />
                                                            </div>
                                                        </div>

                                                        {/* Редактировать */}


                                                        {authStorage.has("master:create") && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingClientId(selectedClient.id ?? null);
                                                                    setIsEditModalOpen(true);
                                                                }}
                                                                className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center justify-center space-x-2"
                                                            >
                                                                <Pencil size={16} />
                                                                <span>Редактировать</span>
                                                            </button>
                                                        )}

                                                    </div>
                                                )
                                            ) : (
                                                <>

                                                    {/* === Список клиентов / состояние === */}
                                                    {isClientsLoading ? (
                                                        <div className="text-center py-4 text-gray-500">Загрузка клиентов...</div>
                                                    ) : clientsError ? (
                                                        <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                                                            <UserIcon className="h-10 w-10 text-red-400 mb-2" />
                                                            <p className="font-medium text-red-600">Не удалось загрузить список клиентов</p>
                                                            <p className="text-sm text-gray-400 mt-1">
                                                                {String((clientsError as any)?.message ?? clientsError ?? "Неизвестная ошибка")}
                                                            </p>
                                                            <button
                                                                onClick={() => location.reload()}
                                                                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                                            >
                                                                Повторить попытку
                                                            </button>
                                                        </div>
                                                    ) : clientsData?.clients && clientsData.clients.length > 0 ? (
                                                        <>
                                                            <div className="space-y-3">
                                                                {clientsData.clients.map((client) => (
                                                                    <div
                                                                        key={client.id}
                                                                        onClick={
                                                                            authStorage.has("master:create")
                                                                                ? () => setSelectedClientId(client.id ?? null)
                                                                                : undefined
                                                                        }
                                                                        className={`rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm transition-colors dark:border-white/10 dark:bg-white/5 dark:shadow-none md:px-5 md:py-5 ${
                                                                            authStorage.has("master:create")
                                                                                ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10"
                                                                                : "cursor-default"
                                                                        }`}
                                                                    >
                                                                        <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[56px_minmax(220px,1fr)_220px_220px_auto] xl:items-center xl:gap-6">
                                                                            <div className="flex items-center gap-3 xl:contents">

                                                                                {/* Аватар */}





                                                                                    {/* Аватар */}
                                                                                    <div
                                                                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(client.name)}`}
                                                                                    >
                                                                                        {`${client.name?.[0] ?? ""}${client.last_name?.[0] ?? ""}`.toUpperCase() || "?"}

                                                                                    </div>




                                                                                {/* Имя */}
                                                                                <div className="min-w-0">
                                                                                    <div className="truncate text-[22px] font-semibold leading-tight text-gray-900 dark:text-white md:text-xl xl:text-lg">
                                                                                        {[client.name, client.last_name].filter(Boolean).join(" ")}
                                                                                    </div>

                                                                                    {/* мобила */}
                                                                                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate xl:hidden">
                                                                                        {client.phone || "— не указан —"}
                                                                                    </div>
                                                                                </div>

                                                                                {/* Телефон (только desktop) */}
                                                                                <div className="hidden text-sm text-gray-500 dark:text-gray-400 xl:block">
                                                                                    {client.phone || "— не указан —"}
                                                                                </div>

                                                                                {/* Email (только desktop) */}
                                                                                <div className="hidden truncate text-sm text-gray-500 dark:text-gray-400 xl:block">
                                                                                    {client.email || "—"}
                                                                                </div>

                                                                            </div>

                                                                            <div className="flex items-center gap-2 shrink-0">
                                                                                {authStorage.has("master:create") && (
                                                                                    <>
                                                                                        {/* Редактировать */}
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setEditingClientId(client.id ?? null);
                                                                                                setIsEditModalOpen(true);
                                                                                            }}
                                                                                            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                                                                                        >
                                                                                            <span>Редактировать</span>
                                                                                        </button>

                                                                                        {/* Удалить */}
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={async (e) => {
                                                                                                e.stopPropagation();

                                                                                                if (!confirm("Удалить клиента?")) return;

                                                                                                try {
                                                                                                    await deleteClientMutation.mutateAsync(client.id!);
                                                                                                } catch (error) {
                                                                                                    console.error("Ошибка удаления:", error);
                                                                                                }
                                                                                            }}
                                                                                            className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                                                                                        >
                <span className="sm:hidden">
                    <Trash2 size={15} />
                </span>
                                                                                            <span className="hidden sm:inline">Удалить</span>
                                                                                        </button>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <Pagination
                                                                page={page}
                                                                setPage={setPage}
                                                                isClientsLoading={isClientsLoading}
                                                                clientsData={clientsData}
                                                            />
                                                        </>
                                                    ) : (
                                                        <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                                                            <UserIcon className="h-10 w-10 text-gray-400 mb-2" />
                                                            <p className="font-medium text-gray-600">Клиенты не найдены</p>
                                                            <p className="text-sm text-gray-400">Попробуйте изменить фильтры поиска</p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-4 text-gray-500">
                                            Клиенты не найдены на странице {page}
                                        </div>
                                    )}

                                <p>ID: {userData?.id}</p>
                            </div>

                    </section>
                </div>
            </main>
        </div>
    );
};
export default withAuth(Page);
