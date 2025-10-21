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
            className={`flex flex-col justify-between h-full text-white ${
                variant === "mobile" ? "p-4" : "p-0"
            }`}
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
                                        variant === "mobile" ? "text-[16px]" : "text-[15px]"
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
            <div className="mt-auto pt-4 border-t border-gray-700">
                <p className="text-gray-300 font-medium text-sm">
                    {userData?.name || "Test"}
                </p>
                <p className="text-gray-500 text-xs mb-2">
                    {userData?.email || "test@mail.ru"}
                </p>
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
