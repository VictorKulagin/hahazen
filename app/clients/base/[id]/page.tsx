"use client";
import React, { useEffect, useState } from "react";
import { withAuth } from "@/hoc/withAuth";
import Image from "next/image";
import Link from "next/link";
import { cabinetDashboard } from "@/services/cabinetDashboard";
import { companiesList } from "@/services/companiesList";
import { useClients, useClient } from '@/hooks/useClient';
import Pagination from '@/components/Pagination';
import SidebarMenu from "@/components/SidebarMenu";

import {
    GlobeAltIcon,
    UserIcon,
    ArrowRightOnRectangleIcon,
    PhoneIcon,
    CalendarIcon,
    ArrowLeftIcon,
    IdentificationIcon,
    StarIcon,
    GiftIcon,
    CreditCardIcon,
    CakeIcon,
    PencilIcon,
    SparklesIcon, UserGroupIcon, Bars3Icon,
} from "@heroicons/react/24/outline";
import {useRouter} from "next/navigation";
import {branchesList} from "@/services/branchesList";
import { useParams } from 'next/navigation';
import {useQueryClient} from "@tanstack/react-query";
import {fetchClients} from "@/services/clientApi";
import ClientCardEditable from "@/components/ClientCardEditable";

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

    const handleCancelEdit = () => {
        setIsEditing(false);
    };
    const serializeFilters = (filters: { [key: string]: string }) => {
        return Object.entries(filters)
            .filter(([_, value]) => value.trim() !== '')
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
    };

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
            {/* Меню */}
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
                        Клиентская база
                    </span>
                </div>


                {/* Контент: две колонки */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    {/* Первая колонка */}
                    <section className="bg-white text-black p-4 rounded shadow">

                        {/* Ссылка с динамическим путем */}
                        <div className="mb-2">

                            <div className="space-y-3">
                                <section className="bg-white text-black p-4 rounded shadow">
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
                                        className="p-6 bg-white text-black rounded-xl shadow-lg border border-gray-200 max-w-2xl mx-auto mt-4 mb-6"
                                    >
                                        <h2 className="text-xl font-bold text-gray-900 mb-4">Фильтр клиентов</h2>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Имя"
                                                value={filters.name}
                                                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg p-2.5 text-black bg-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                                            />

                                            <input
                                                type="text"
                                                placeholder="Фамилия"
                                                value={filters.last_name}
                                                onChange={(e) => setFilters({ ...filters, last_name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg p-2.5 text-black bg-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                                            />

                                            <input
                                                type="text"
                                                placeholder="Телефон"
                                                value={filters.phone}
                                                onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg p-2.5 text-black bg-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                                            />

                                            <select
                                                value={filters.gender}
                                                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg p-2.5 text-black bg-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                                            >
                                                <option value="">Пол (все)</option>
                                                <option value="male">Мужской</option>
                                                <option value="female">Женский</option>
                                            </select>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFilters({ name: "", last_name: "", phone: "", gender: "", vip: "" })
                                                }
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                            >
                                                Сбросить
                                            </button>
                                        </div>
                                    </form>
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
                                                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl shadow-md">
                                                        {/* Назад */}
                                                        <button
                                                            onClick={() => setSelectedClientId(null)}
                                                            className="text-green-600 hover:text-green-800 font-semibold flex items-center space-x-2"
                                                        >
                                                            <ArrowLeftIcon className="h-5 w-5" />
                                                            <span>Назад</span>
                                                        </button>

                                                        {/* Имя */}
                                                        <h1 className="text-2xl font-bold text-gray-900 truncate">{selectedClient.name}</h1>

                                                        {/* Сетка информации */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
                                                            {[
                                                                { icon: IdentificationIcon, label: "ID", value: selectedClient.user_id },
                                                                { icon: UserIcon, label: "Фамилия", value: selectedClient.last_name },
                                                                { icon: UserIcon, label: "Отчество", value: selectedClient.patronymic },
                                                                { icon: PhoneIcon, label: "Телефон", value: selectedClient.phone },
                                                                { icon: UserIcon, label: "Email", value: selectedClient.email },
                                                                { icon: UserIcon, label: "Пол", value: selectedClient.gender },
                                                                { icon: StarIcon, label: "VIP", value: selectedClient.vip === 1 ? "Да" : "Нет" },
                                                                { icon: GiftIcon, label: "Скидка", value: selectedClient.discount },
                                                                { icon: CreditCardIcon, label: "Номер карты", value: selectedClient.card_number },
                                                                { icon: CakeIcon, label: "День рождения", value: selectedClient.birth_date },
                                                                { icon: CakeIcon, label: "Запрет онлайн", value: selectedClient.forbid_online_booking === 1 ? "Да" : "Нет" },
                                                            ].map((item, idx) => (
                                                                <div key={idx} className="flex items-center space-x-2 truncate">
                                                                    <item.icon className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                                                                    <span className="truncate">
          <strong>{item.label}:</strong> {item.value ?? "-"}
        </span>
                                                                </div>
                                                            ))}

                                                            {/* Комментарий */}
                                                            <div className="col-span-1 md:col-span-2">
                                                                <span className="font-semibold">Комментарий:</span>
                                                                <p className="mt-1 text-gray-600 truncate">{selectedClient.comment ?? "-"}</p>
                                                            </div>

                                                            {/* Фото */}
                                                            <div className="col-span-1 md:col-span-2">
                                                                <span className="font-semibold">Фото:</span>
                                                                {selectedClient.photo ? (
                                                                    <img
                                                                        src={selectedClient.photo}
                                                                        alt="Фото клиента"
                                                                        className="mt-1 max-h-36 w-full object-contain rounded-lg shadow-sm"
                                                                    />
                                                                ) : (
                                                                    <p className="mt-1 text-gray-400">-</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Редактировать */}
                                                        <button
                                                            onClick={() => setIsEditing(true)}
                                                            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center justify-center space-x-2"
                                                        >
                                                            <CakeIcon className="h-4 w-4" />
                                                            <span>Редактировать</span>
                                                        </button>
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
                                                            <ul className="space-y-3">
                                                                {clientsData.clients.map((client) => (
                                                                    <li
                                                                        key={client.id}
                                                                        onClick={() => setSelectedClientId(client.id ?? null)}
                                                                        className="
            bg-white text-black rounded-xl shadow-md p-4
            flex justify-between items-center border border-gray-200
            hover:shadow-lg hover:border-green-400 hover:bg-green-50
            transition-all duration-200 cursor-pointer
          "
                                                                    >
                                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                                                                            <p className="font-semibold text-base">
                                                                                {client.name} {client.last_name}
                                                                            </p>
                                                                            <p className="text-sm text-gray-600">📞 {client.phone}</p>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => setSelectedClientId(client.id ?? null)}
                                                                            className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition"
                                                                            title="Открыть профиль клиента"
                                                                        >
                                                                            👤
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>

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
                                </section>
                                <p>ID: {userData?.id}</p>
                            </div>

                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};
export default withAuth(Page);
