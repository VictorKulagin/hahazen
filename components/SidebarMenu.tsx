"use client";
import Link from "next/link";
import Image from "next/image";
import {
    CalendarIcon,
    SparklesIcon,
    UserGroupIcon,
    IdentificationIcon,
    GlobeAltIcon,
    ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";

export default function SidebarMenu({
                                        id,
                                        companyName,
                                        userData,
                                        variant = "desktop",
                                        onLogout,
                                        onNavigate,
                                    }: {
    id: string | number | null;
    companyName?: string;
    userData?: { name?: string; email?: string };
    variant?: "desktop" | "mobile";
    onLogout?: () => void;
    onNavigate?: () => void;
}) {
    const pathname = usePathname();

    const menuItems = [
        { title: "Расписание", href: `/schedule/${id}`, icon: CalendarIcon },
        { title: "Услуги", href: `/settings/service_categories/${id}`, icon: SparklesIcon },
        { title: "Сотрудники", href: `/settings/filial_staff/${id}`, icon: UserGroupIcon },
        { title: "Клиенты", href: `/clients/base/${id}`, icon: IdentificationIcon },
        { title: "Онлайн-запись", href: `/online/booking_forms/${id}`, icon: GlobeAltIcon },
    ];

    return (
        <div
            className={`flex flex-col justify-between text-white
    ${variant === "mobile"
                ? "h-full p-4"
                : "h-[20%] p-0"}`
            }
        >
            {/* ===== Верхняя часть меню ===== */}
            <div>
                {/* Логотип — показываем только на мобиле */}
                {variant === "mobile" && (
                    <div className="border-b border-gray-700 pb-3 mb-4 flex items-center">
                        <Image src="/logo.png" alt="Логотип" width={28} height={28} className="mr-2 rounded" />
                        <span className="text-sm font-medium truncate">
              {companyName || "Компания"}
            </span>
                    </div>
                )}

                {/* Основные пункты меню */}
                <nav className="space-y-1">
                    {menuItems.map(({ title, href, icon: Icon }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={onNavigate}
                                className={`flex items-center rounded-md transition-all p-3 ${
                                    active
                                        ? "bg-green-500 text-white"
                                        : "text-gray-200 hover:bg-gray-700"
                                }`}
                            >
                                <Icon className="h-7 w-7" />
                                <span
                                    className={`ml-3 font-medium ${
                                        variant === "mobile" ? "text-[16px]" : "text-[18px]"
                                    }`}
                                >
                  {title}
                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* ===== Нижняя часть (профиль + выход) ===== */}
            <div className="mt-auto pt-4 ">
                <Link
                    href="/cabinet"
                    className="flex items-center gap-3 p-4 border-t border-gray-700 mt-auto hover:bg-gray-800/40 transition-colors duration-300"
                >
                    <img
                        src="/logo.png"
                        alt="logo"
                        className="h-8 w-8 rounded-full shadow-md bg-green-600/10 p-1 animate-pulse"
                    />
                    <div>
                        <p className="text-gray-100 font-semibold text-sm drop-shadow-sm">
                            {userData?.name || "Test"}
                        </p>
                        <p className="text-gray-400 text-xs italic">
                            {userData?.email || "test@mail.ru"}
                        </p>
                    </div>
                </Link>
                <button
                    onClick={onLogout}
                    className="flex items-center text-green-500 hover:text-green-400 text-sm font-medium transition"
                >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                    Выйти
                </button>
            </div>
        </div>
    );
}
