"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
    UserGroupIcon,
    UsersIcon,
    GlobeAltIcon,
    Cog8ToothIcon,
    ChevronUpIcon,
    ChevronDownIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

const Page: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAccordionOpenEmployees, setIsAccordionOpenEmployees] = useState(false);
    const [isAccordionOpenClients, setIsAccordionOpenClients] = useState(false);

    const handleMenuItemClick = () => setIsMenuOpen(false);
    const id = "565";


    // Пример сотрудников
    const employees = [
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
                    {employees.map((employee) => (
                        <p key={employee.id} className="text-gray-300 hover:text-white">
                            {employee.name}
                        </p>
                    ))}
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
            icon: <GlobeAltIcon className="h-8 w-8 text-gray-200" />, isActive: true,
        },
        {
            label: (
                <Link href={`/settings/menu/${id}`} className="flex items-center">
                    Настройки
                </Link>
            ),
            icon: <Cog8ToothIcon className="h-8 w-8 text-gray-400" />,
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
                <div className="border-b border-gray-400 p-2 flex items-center">
                    <Image
                        src="/logo.png"
                        alt="Логотип"
                        width={32}
                        height={32}
                        className="mr-2"
                    />
                    <span>Логотип</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Первая колонка */}
                    <section className="bg-white text-black p-4 rounded shadow">
                        <h2 className="text-lg font-semibold mb-2">Первая колонка</h2>
                        <p>Контент первой колонки. Здесь можно разместить информацию о пользователях или другие параметры.</p>
                    </section>

                    {/* Вторая колонка */}
                    <section className="bg-white text-black p-4 rounded shadow">
                        <h2 className="text-lg font-semibold mb-2">Вторая колонка</h2>
                        <p>Контент второй колонки. Здесь можно разместить настройки, таблицы или другую информацию.</p>
                    </section>
                </div>
            </main>
        </div>
    );
};

// Компонент для элементов меню
interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, isActive, onClick }) => (
    <div
        className={`flex items-center p-4 rounded transition-all ${
            isActive ? "bg-menuActive" : "hover:bg-gray-700"
        }`}
        onClick={onClick}
    >
        {icon}
        <span className="ml-2 text-white font-medium text-lg">{label}</span>
    </div>
);

export default Page;
