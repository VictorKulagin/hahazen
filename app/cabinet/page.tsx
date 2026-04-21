"use client";
import React, { useEffect, useState } from "react";
import { withAuth } from "@/hoc/withAuth";
import Image from "next/image";
import Link from "next/link";
import { cabinetDashboard } from "@/services/cabinetDashboard";
import { companiesList } from "@/services/companiesList";
import {
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    UserIcon,
    ArrowRightOnRectangleIcon,
    AtSymbolIcon,
    PhoneIcon, CalendarIcon, Bars3Icon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { branchesList } from "@/services/branchesList";
import EmployeesList from "@/components/EmployeesList";
import SidebarMenu from "@/components/SidebarMenu";
import Loader from "@/components/Loader";
import {ThemeToggle} from "@/components/theme/ThemeToggle";
import { useTheme } from "@/lib/theme/theme.context";
import {useSidebarCollapsed} from "@/hoc/useSidebarCollapsed";
import { logoutApi } from "@/services/logoutApi";

const Page: React.FC = () => {
    // ✅ ВСЕ STATE ПЕРЕМЕННЫЕ
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAccordionOpenEmployees, setIsAccordionOpenEmployees] = useState(false);
    const [isAccordionOpenClients, setIsAccordionOpenClients] = useState(false);
    const [branchesData, setBranchesData] = useState<any>(null);
    const [companiesData, setCompaniesData] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [isModalFilOpen, setIsModalFilOpen] = useState(false);
    const { theme } = useTheme();
    //const [collapsed, setCollapsed] = useState(false);
    const { collapsed, setCollapsed, isReady } = useSidebarCollapsed();

    const router = useRouter();

    const toggleFilModal = () => {
        setIsModalFilOpen((prev) => !prev);
    };

    const handleLogout = async () => {
        await logoutApi();
        localStorage.removeItem("access_token");
        router.push("/signin");
    };

    const globalLoading =
        isLoading ||
        !companiesData ||
        !branchesData ||
        !userData

    const globalError = error || !companiesData || !branchesData ? error : "";

    // useEffect для получения данных компаний
    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setError("Токен не найден.");
            setIsLoading(false);
            return;
        }

        const fetchCompaniesData = async () => {
            try {
                const data = await companiesList();
                console.log("response.data companiesList", data);
                setCompaniesData(data);
            } catch (err: unknown) {
                setError(`Ошибка: ${(err as Error)?.message || "Неизвестная ошибка"}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompaniesData();
    }, []);

    // useEffect для получения данных пользователя
    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setError("Токен не найден.");
            setIsLoading(false);
            return;
        }

        const fetchUserData = async () => {
            try {
                const data = await cabinetDashboard();
                console.log("response.data", data);
                setUserData(data);
            } catch (err: unknown) {
                setError(`Ошибка: ${(err as Error)?.message || "Неизвестная ошибка"}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // useEffect для получения данных филиалов
    useEffect(() => {
        if (!companiesData || companiesData.length === 0) return;

        const fetchBranchesData = async () => {
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
                setError(`Ошибка: ${(err as Error)?.message || "Неизвестная ошибка"}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBranchesData();
    }, [companiesData]);


    const getCompanyId = (data: any[]): number | null => {
        return data?.[0]?.id ?? null;
    };

    const id = getCompanyId(branchesData);

    const clients = [
        { id: 1, name: "Клиентская база", url: `/clients/base/${id}` },
    ];


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


    return (
        <div
            className={`relative min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--foreground))]
  md:grid ${collapsed ? "md:grid-cols-[96px_1fr]" : "md:grid-cols-[320px_1fr]"}`}
        >
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-10 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}

            <aside
                className={`bg-[rgb(var(--sidebar))] text-[rgb(var(--sidebar-foreground))]
  fixed z-20 h-full flex flex-col transition-all duration-300
  md:relative md:translate-x-0
  ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
  ${collapsed ? "w-[96px] p-3" : "w-[320px] p-4"}`}
            >
                {/* Верх: логотип */}
                <div className="border-b border-gray-400 p-2 flex items-center justify-between">
                    <button
                        className="flex items-center min-w-0 flex-1"
                        onClick={toggleFilModal}
                    >
                        <Image
                            src="/logo.png"
                            alt="Логотип"
                            width={32}
                            height={32}
                            className="mr-2"
                        />
                        {!collapsed && (
                            <span className="text-sm font-medium truncate">
        {companiesData?.[0]?.name || "Компания не найдена"}
      </span>
                        )}
                    </button>

                    <button
                        onClick={() => setCollapsed((prev) => !prev)}
                        className="ml-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition"
                    >
                        {collapsed ? (
                            <ChevronDoubleRightIcon className="h-5 w-5" />
                        ) : (
                            <ChevronDoubleLeftIcon className="h-5 w-5" />
                        )}
                    </button>
                </div>
                {/* Меню */}
                <div className="flex-grow mt-4 overflow-y-auto overflow-x-hidden">
                    <SidebarMenu
                        id={id}
                        companyName={companiesData?.[0]?.name}
                        userData={userData}
                        variant="desktop"
                        onLogout={handleLogout}
                        collapsed={collapsed}
                        setCollapsed={setCollapsed}
                    />
                </div>
            </aside>

            <main
                className="min-h-screen bg-[rgb(var(--background))] px-3 py-4 md:px-6 md:py-6"
                onClick={() => isMenuOpen && setIsMenuOpen(false)}
            >
                {isModalFilOpen && (
                    <div className="fixed inset-0 flex items-center justify-left bg-black/50 z-50"
                         onClick={toggleFilModal}
                    >
                        <div className="z-50 bg-white dark:bg-[rgb(var(--card))] p-6 rounded-lg shadow-lg dark:shadow-none text-black dark:text-white absolute top-[100px] w-full sm:w-11/12 md:w-1/3"
                             onClick={(e) => e.stopPropagation()}
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

                {/* Заголовок */}
                <div
                    className="mb-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:shadow-none">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                                Расписание
                            </h1>
                        </div>

                        <p className="mt-1 hidden text-sm text-gray-500 dark:text-gray-400 md:block">
                            Управление профилем, настройками и рабочим пространством
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400">
                            Тема: {theme}
                        </span>
                        <ThemeToggle />
                    </div>
                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <section className="bg-white dark:bg-[rgb(var(--card))] text-black dark:text-white p-4 rounded shadow dark:shadow-none">
                        <div className="flex items-center mb-2">
                            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Личные данные</h2>
                        </div>

                        <div className="mb-2">
                            <div className="space-y-3">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">Привет, {userData?.name}!</p>
                                <div className="flex items-center">
                                    <AtSymbolIcon className="h-6 w-6 text-black dark:text-white mr-2" />
                                    <p>Email: {userData?.email}</p>
                                </div>
                                <div className="flex items-center">
                                    <UserIcon className="h-6 w-6 text-black dark:text-white mr-2" />
                                    <p>Фамилия: {userData?.last_name}</p>
                                </div>
                                <div className="flex items-center">
                                    <PhoneIcon className="h-6 w-6 text-black dark:text-white mr-2" />
                                    <p>Телефон: {userData?.phone}</p>
                                </div>
                                <div className="flex items-center">
                                    <UserIcon className="h-6 w-6 text-black dark:text-white mr-2" />
                                    <p>Статус: {userData?.type}</p>
                                </div>
                                <p>ID: {userData?.id}</p>

                                <p>Компания: {companiesData && companiesData.length > 0 ? companiesData[0]?.name : "Компания не найдена"}</p>
                                <p>Адрес: {companiesData && companiesData.length > 0 ? companiesData[0]?.name : "Адрес не найден"}</p>
                                <p>Телефон: {companiesData && companiesData.length > 0 ? companiesData[0]?.phone : "Телефон не найден"}</p>
                                <p>Email: {companiesData && companiesData.length > 0 ? companiesData[0]?.email : "Email не найден"}</p>
                                <p>ID: {companiesData && companiesData.length > 0 ? companiesData[0]?.id : "id не найден"}</p>
                            </div>
                        </div>

                        {Boolean(id) && (
                            <div className="mb-2">
                                <Link href={`/settings/service_categories/${id}`} className="hover:underline text-gray-700 dark:text-gray-300">
                                    Услуги
                                </Link>
                            </div>
                        )}
                        {Boolean(id) && (
                            <div className="mb-2">
                                <Link href={`/settings/filial_staff/${id}`} className="hover:underline text-gray-700 dark:text-gray-300">
                                    Сотрудники
                                </Link>
                            </div>
                        )}
                    </section>

                    <section className="bg-white dark:bg-[rgb(var(--card))] text-black dark:text-white p-4 rounded shadow dark:shadow-none">
                        <div className="flex items-center mb-2">
                            <h2 className="text-lg font-semibold mb-2">Настройки</h2>
                        </div>
                        <p>Настройки филиала</p>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default withAuth(Page);
