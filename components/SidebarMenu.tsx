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
                                className={`group relative z-10 flex items-center rounded-xl py-3 transition-all duration-250 ease-out ${
                                    collapsed ? "justify-center px-0" : "px-3"
                                } ${
                                    active
                                        ? "bg-gradient-to-r from-green-500/80 to-green-600/90 text-white shadow-sm"
                                        : "text-[rgb(var(--sidebar-foreground))] hover:bg-[rgb(var(--sidebar-hover))] hover:bg-[rgb(var(--sidebar-hover))]"
                                }`}
                            >
                                {active && (
                                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-green-300 shadow-[0_0_10px_rgba(134,239,172,0.45)]" />
                                )}

                                <Icon className="h-5 w-5 md:h-6 md:w-6 shrink-0 transition-all duration-200 ease-out group-hover:scale-[1.03]" />
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
  z-[9999]
  ml-2
  -translate-y-1/2
  translate-x-1
  whitespace-nowrap
  rounded-lg
  border border-[rgb(var(--border))]
  bg-[rgb(var(--background))]
  px-3 py-1.5
  text-xs
  font-medium
  text-[rgb(var(--foreground))]
  shadow-lg
  opacity-0
  transition-all
  duration-200
  ease-out
  group-hover:translate-x-0
  group-hover:opacity-100
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
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3 transition-all duration-300 ease-out hover:-translate-y-[1px] hover:bg-white/10 hover:shadow-md"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-400 font-semibold">
                        {(userData?.name?.[0] || "T").toUpperCase()}
                    </div>

                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="truncate text-[rgb(var(--sidebar-foreground))] font-semibold text-sm">
                                {userData?.name || "Test"}
                            </p>
                            <p className="truncate text-[rgb(var(--muted-foreground))] text-xs">
                                {userData?.email || "test@mail.ru"}
                            </p>
                        </div>
                    )}
                </Link>

                <button
                    onClick={onLogout}
                    className="group mt-2 flex items-center text-sm font-medium text-green-500 transition-all duration-200 hover:text-green-400"
                >
                    <ArrowRightOnRectangleIcon className="mr-1 h-5 w-5 transition-transform duration-200 hover:text-green-400" />
                    {!collapsed && "Выйти"}
                </button>
            </div>
        </div>
    );
}
