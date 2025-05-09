"use client";
import React, {useEffect, useState} from "react";
import { withAuth } from "@/hoc/withAuth";
import Image from "next/image";
import Link from "next/link";
import Calendar from "@/components/Calendar/Calendar";
import {
    UserGroupIcon,
    UsersIcon,
    GlobeAltIcon,
    Cog8ToothIcon,
    ChevronUpIcon,
    ChevronDownIcon, ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import {branchesList} from "@/services/branchesList";
import EmployeesList from "@/components/EmployeesList";
import {companiesList} from "@/services/companiesList";
import {useParams, useRouter} from "next/navigation";


const Page: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAccordionOpenEmployees, setIsAccordionOpenEmployees] = useState(false);
    const [isAccordionOpenClients, setIsAccordionOpenClients] = useState(false);

    const [branchesData, setBranchesData] = useState<any>(null);
    const [companiesData, setCompaniesData] = useState<any>(null);
    const [isModalFilOpen, setIsModalFilOpen] = useState(false);

    const [employeeId, setEmployeeId] = useState<number | undefined>(); // Вместо null

    const [userData, setUserData] = useState<any>(null);


    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    const toggleFilModal = () => {
        setIsModalFilOpen((prev) => !prev);
    };

    const handleMenuItemClick = () => setIsMenuOpen(false);
    //const id = "565";

    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("access_token"); // Удаляем токен
        router.push("/signin"); // Перенаправляем на страницу логина
    };

    useEffect(() => {
        const parseHash = () => {
            const hash = window.location.hash; // Получаем текущий хэш
            const match = hash.match(/master=(\d+)/); // Ищем параметр master
            if (match) {
                setEmployeeId(Number(match[1])); // Конвертируем в число
            }
        };

        parseHash(); // Первоначальный парсинг

        // Слушатель изменений хэша
        window.addEventListener('hashchange', parseHash);
        return () => window.removeEventListener('hashchange', parseHash);
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

    // Пример клиентов
    const clients = [
        { id: 1, name: "Клиентская база", url: `/clients/base/${id}` },
    ];

    // Элементы меню
    const menuItems = [
        {
            label: "Сотрудники", isActive: true,
            icon: <UserGroupIcon className="h-8 w-8 text-gray-200" />,
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
            icon: <GlobeAltIcon className="h-8 w-8 text-gray-200" />,
        },
        {
            label: (
                <Link href={`/settings/menu/${id}`} className="flex items-center">
                    Настройки
                </Link>
            ),
            icon: <Cog8ToothIcon className="h-8 w-8 text-gray-400" />,
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
        <div className="relative h-screen md:grid md:grid-cols-[15%_85%]">
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
                    <h1 className="text-2xl font-bold mb-2">Настройки</h1>
                </header>

                {/* Контент: две колонки */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    {/* Первая колонка */}
                    <section className="bg-white text-black p-4 rounded shadow">
                        <h2 className="text-lg font-semibold mb-2">Первая колонка</h2>
                        <p>Контент первой колонки. Здесь можно разместить информацию о пользователях или другие параметры.</p>
                        <div className="container mx-auto p-4">
                            <h1 className="text-3xl font-bold mb-4">Календарь событий</h1>
                            {id !== null && employeeId !== undefined && (
                                <Calendar
                                    branchId={id}
                                    //employeeId={employeeId}
                                />
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};
export default withAuth(Page);
