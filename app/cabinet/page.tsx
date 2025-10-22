"use client";
import React, { useEffect, useState } from "react";
import { withAuth } from "@/hoc/withAuth";
import Image from "next/image";
import Link from "next/link";
import { cabinetDashboard } from "@/services/cabinetDashboard";
import { companiesList } from "@/services/companiesList";
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
    PhoneIcon, CalendarIcon, Bars3Icon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { branchesList } from "@/services/branchesList";
import EmployeesList from "@/components/EmployeesList";
import SidebarMenu from "@/components/SidebarMenu";
import Loader from "@/components/Loader";

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

    const router = useRouter();

    const toggleFilModal = () => {
        setIsModalFilOpen((prev) => !prev);
    };

    const handleLogout = () => {
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
        <div className="relative h-screen md:grid md:grid-cols-[30%_70%] lg:grid-cols-[20%_80%]">
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}

            <aside
                className={`bg-darkBlue text-white p-4 fixed z-20 h-full transition-transform duration-300 md:relative md:translate-x-0 ${
                    isMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
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
                    <span>{companiesData && companiesData.length > 0 ? companiesData[0]?.name : "Компания не найдена"}</span>


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

            <main
                className="bg-backgroundBlue text-white p-4 h-full md:h-auto"
                onClick={() => isMenuOpen && setIsMenuOpen(false)}
            >
                {isModalFilOpen && (
                    <div className="fixed inset-0 flex items-center justify-left bg-black bg-opacity-50 z-50"
                         onClick={toggleFilModal}
                    >
                        <div className="z-50 bg-white p-6 rounded-lg shadow-lg text-black absolute top-[100px] w-full sm:w-11/12 md:w-1/3"
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

                {/* Заголовок */}
                <div className="flex items-center bg-[#081b27] text-white p-3 rounded-md mb-4">

                    <span className="ml-auto font-semibold text-sm">
                        Кабинет
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <section className="bg-white text-black p-4 rounded shadow">
                        <div className="flex items-center mb-2">
                            <h2 className="text-lg font-semibold mb-2">Личные данные</h2>
                        </div>

                        <div className="mb-2">
                            <div className="space-y-3">
                                <p className="text-2xl font-bold">Привет, {userData?.name}!</p>
                                <div className="flex items-center">
                                    <AtSymbolIcon className="h-6 w-6 text-black mr-2" />
                                    <p>Email: {userData?.email}</p>
                                </div>
                                <div className="flex items-center">
                                    <UserIcon className="h-6 w-6 text-black mr-2" />
                                    <p>Фамилия: {userData?.last_name}</p>
                                </div>
                                <div className="flex items-center">
                                    <PhoneIcon className="h-6 w-6 text-black mr-2" />
                                    <p>Телефон: {userData?.phone}</p>
                                </div>
                                <div className="flex items-center">
                                    <UserIcon className="h-6 w-6 text-black mr-2" />
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
                        )}
                    </section>

                    <section className="bg-white text-black p-4 rounded shadow">
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
