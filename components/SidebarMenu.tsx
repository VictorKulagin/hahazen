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
import {useState} from "react";

export default function SidebarMenu({
                                        id,
                                        companyName,
                                        userData,
                                        variant = "desktop",
                                        onLogout,
                                        onNavigate,
                                        collapsed = false,
                                        setCollapsed,
                                    }: {
    id: string | number | null;
    companyName?: string;
    userData?: { name?: string; email?: string };
    variant?: "desktop" | "mobile";
    onLogout?: () => void;
    onNavigate?: () => void;
    collapsed?: boolean;
    setCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
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
            className={`flex flex-col text-[rgb(var(--sidebar-foreground))] font-sans leading-snug transition-all duration-300
  ${
                variant === "mobile"
                    ? "h-full p-4 justify-between bg-[rgb(var(--sidebar-background))] w-full"
                    : `${collapsed ? "w-[80px]" : "w-[260px]"} h-full`
            }`}
        >

            {/* ===== Верхняя часть меню ===== */}
            <div>
                {/* Логотип — только для мобилки */}
                {variant === "mobile" && (
                    <div className="border-b border-[rgb(var(--border))] pb-3 mb-4 flex items-center">
                        <Image src="/logo.png" alt="Логотип" width={28} height={28} className="mr-2 rounded" />
                        <span className="text-sm font-medium truncate text-[rgb(var(--sidebar-foreground))]">
                            {companyName || "Компания"}
                        </span>
                    </div>
                )}

                {/* Основное меню */}
                <nav className="space-y-1.5 text-[15px] font-medium">
                    {menuItems.map(({ title, href, icon: Icon }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={onNavigate}
                                title={collapsed ? title : undefined}
                                className={`group relative z-10 flex items-center rounded-xl py-3 transition-all duration-200 ${
                                    collapsed ? "justify-center px-0" : "px-3"
                                } ${
                                    active
                                        ? "bg-gradient-to-r from-green-500/80 to-green-600/90 text-white shadow-md"
                                        : "text-[rgb(var(--sidebar-foreground))] hover:bg-[rgb(var(--sidebar-hover))]"
                                }`}
                            >
                                {active && (
                                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-green-300" />
                                )}

                                <Icon className="h-5 w-5 md:h-6 md:w-6 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                                {!collapsed && (
                                    <span
                                        className={`ml-3 font-medium ${
                                            variant === "mobile" ? "text-[18px]" : "text-[16px]"
                                        }`}
                                    >
                                        {title}
                                    </span>
                                )}

                                {collapsed && (
                                    <span
                                        className="
      pointer-events-none
      absolute
      left-full
      top-1/2
      -translate-y-1/2
      ml-2
      px-3 py-1.5
      text-xs
      font-medium
      rounded-lg
      shadow-lg
      whitespace-nowrap
      opacity-0
      group-hover:opacity-100
      transition-all duration-150
      z-[9999]
      bg-[rgb(var(--background))]
      text-[rgb(var(--foreground))]
      border border-[rgb(var(--border))]
      opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
    "
                                    >
    {title}
  </span>
                                )}

                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* ===== Профиль и выход (сразу под меню) ===== */}
            <div className="border-t border-[rgb(var(--border))] mt-auto pt-3">

                <Link
                    href="/cabinet"
                    className="flex items-center gap-3 hover:bg-white/5 transition-colors duration-300 rounded-xl p-3"
                >
                    <img
                        src="/logo.png"
                        alt="logo"
                        className="h-8 w-8 rounded-full shadow-md bg-green-600/10 p-1"
                    />
                    {!collapsed && (
                        <div>
                            <p className="text-[rgb(var(--sidebar-foreground))] font-semibold text-sm">
                                {userData?.name || "Test"}
                            </p>
                            <p className="text-[rgb(var(--muted-foreground))] text-xs italic">
                                {userData?.email || "test@mail.ru"}
                            </p>
                        </div>
                    )}
                </Link>
                <button
                    onClick={onLogout}
                    className="flex items-center text-green-500 hover:text-green-400 text-sm font-medium transition mt-2"
                >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />

                    {!collapsed && "Выйти"}
                </button>
            </div>
        </div>
    );
}
