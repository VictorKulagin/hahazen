"use client";
import React, { useEffect, useState } from "react";
import { withAuth } from "@/hoc/withAuth";
import Image from "next/image";
import Link from "next/link";
import { cabinetDashboard } from "@/services/cabinetDashboard";
import { companiesList } from "@/services/companiesList";

import {
    Bars3Icon
} from "@heroicons/react/24/outline";
import {useRouter} from "next/navigation";
import {branchesList} from "@/services/branchesList";
import { useParams } from 'next/navigation';
import SidebarMenu from "@/components/SidebarMenu";
import Loader from "@/components/Loader";
import {ThemeToggle} from "@/components/theme/ThemeToggle";
import { useTheme } from "@/lib/theme/theme.context";
interface ApiError extends Error {
    data?: {
        message?: string;
    };
}
const Page: React.FC = () => {
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



    useEffect(() => {
        if (!idFromUrl || !id) return;
        if (String(idFromUrl) !== String(id)) {
            console.warn(`Редирект на 404: idFromUrl (${idFromUrl}) !== id (${id})`);
            router.replace("/404");
        }
    }, [idFromUrl, id]);



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
        <div className="relative min-h-screen md:grid md:grid-cols-[320px_1fr] bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
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
                className="min-h-screen bg-[rgb(var(--background))] px-3 py-4 md:px-6 md:py-6"
                onClick={() => isMenuOpen && setIsMenuOpen(false)}
            >

                <div>
                    {/* Модальное окно Филиалы */}
                    {isModalFilOpen && (
                        <div className="fixed inset-0 flex items-center justify-left bg-black bg-opacity-50 z-50"
                             onClick={toggleFilModal} // Закрытие окна при клике по фону
                        >
                            <div className="z-50 bg-white dark:bg-[rgb(var(--card))] p-6 rounded-lg shadow-lg dark:shadow-none text-black dark:text-white absolute top-[100px] w-full sm:w-11/12 md:w-1/3"
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
                            Онлайн-запись
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400">
                            Тема: {theme}
                        </span>
                        <ThemeToggle />
                    </div>
                </div>

                {/* Контент: две колонки */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Первая колонка */}
                    <section className="bg-white dark:bg-[rgb(var(--card))] text-black dark:text-white p-4 rounded shadow dark:shadow-none">
                        <div className="flex items-center mb-2">
                            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Личные данные</h2>
                        </div>
                        {/* Ссылка с динамическим путем */}
                        <div className="mb-2">

                            <div className="space-y-3">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">Привет, {userData?.name}! Раздел ещё в режиме разработки</p>

                                <p className="text-gray-700 dark:text-gray-300">ID: {userData?.id}</p>

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
                    <section className="bg-white dark:bg-[rgb(var(--card))] text-black dark:text-white p-4 rounded shadow dark:shadow-none">
                        <div className="flex items-center mb-2">
                            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Настройки</h2>
                        </div>
                        <p>Настройки филиала</p>
                    </section>
                </div>
            </main>
        </div>
    );
};
export default withAuth(Page);
