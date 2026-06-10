"use client";

import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import BranchInitial from "@/components/BranchInitial";
import {
    ArrowRightOnRectangleIcon,
    CalendarIcon,
    GlobeAltIcon,
    IdentificationIcon,
    SparklesIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";

type SidebarMenuProps = {
    id: string | number | null;
    companyName?: string;
    branchName?: string;
    userData?: { name?: string; email?: string };
    variant?: "desktop" | "mobile";
    onLogout?: () => void;
    onNavigate?: () => void;
    onBranchClick?: () => void;
    collapsed?: boolean;
    setCollapsed?: Dispatch<SetStateAction<boolean>>;
};

export default function SidebarMenu({
    id,
    companyName,
    branchName,
    userData,
    variant = "desktop",
    onLogout,
    onNavigate,
    onBranchClick,
    collapsed = false,
}: SidebarMenuProps) {
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
            className={`admin-sidebar-menu flex flex-col text-[rgb(var(--sidebar-foreground))] font-sans leading-snug transition-all duration-300 ${
                variant === "mobile"
                    ? "h-full w-full justify-between bg-[rgb(var(--sidebar-background))] p-4"
                    : `${collapsed ? "w-[80px]" : "w-[260px]"} h-full`
            }`}
        >
            <div>
                {variant === "mobile" && (
                    <button
                        type="button"
                        disabled={!onBranchClick}
                        onClick={onBranchClick}
                        className="mb-4 flex w-full items-center rounded-2xl border border-slate-200/80 bg-white/70 p-3 text-left shadow-sm backdrop-blur-xl transition hover:border-emerald-300/70 hover:bg-white disabled:cursor-default dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/30 dark:hover:bg-white/10"
                    >
                        <BranchInitial
                            name={branchName}
                            className="mr-3"
                        />
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-[rgb(var(--sidebar-foreground))]">
                                {branchName || "Филиал"}
                            </span>
                            <span className="block truncate text-xs text-[rgb(var(--muted-foreground))]">
                                {companyName || "Компания"}
                            </span>
                        </span>
                    </button>
                )}

                <nav className="space-y-1.5 text-[15px] font-medium">
                    {menuItems.map(({ title, href, icon: Icon }) => {
                        const active = pathname === href;

                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={onNavigate}
                                title={collapsed ? title : undefined}
                                aria-current={active ? "page" : undefined}
                                className={`group relative z-10 flex items-center overflow-visible rounded-2xl py-3 transition-all duration-200 ease-out ${
                                    collapsed ? "mx-1 justify-center px-0" : "px-3.5"
                                } ${
                                    active
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_10px_28px_rgba(5,150,105,0.22)]"
                                        : "text-[rgb(var(--sidebar-foreground))] hover:translate-x-0.5 hover:bg-white/70 hover:shadow-sm dark:hover:bg-white/[0.07] dark:hover:shadow-none"
                                }`}
                            >
                                {active && (
                                    <span className="absolute bottom-2.5 left-0 top-2.5 w-1 rounded-r-full bg-emerald-200 shadow-[0_0_12px_rgba(167,243,208,0.55)]" />
                                )}

                                <Icon className="h-5 w-5 shrink-0 transition-all duration-200 ease-out group-hover:scale-105 md:h-6 md:w-6" />
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
                                    <span className="pointer-events-none absolute left-full top-1/2 z-[9999] ml-2 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--foreground))] opacity-0 shadow-lg transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100">
                                        {title}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto border-t border-slate-200/70 pt-3 dark:border-white/10">
                <Link
                    href="/cabinet"
                    className={`flex items-center rounded-2xl border border-slate-200/80 bg-white/65 p-2.5 shadow-sm backdrop-blur-xl transition-all duration-200 ease-out hover:-translate-y-px hover:border-emerald-300/60 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/25 dark:hover:bg-white/10 ${
                        collapsed ? "justify-center" : "gap-3"
                    }`}
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 font-semibold text-white shadow-[0_8px_18px_rgba(5,150,105,0.22)]">
                        {(userData?.name?.[0] || "T").toUpperCase()}
                    </div>

                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[rgb(var(--sidebar-foreground))]">
                                {userData?.name || "Test"}
                            </p>
                            <p className="truncate text-xs text-[rgb(var(--muted-foreground))]">
                                {userData?.email || "test@mail.ru"}
                            </p>
                        </div>
                    )}
                </Link>

                <button
                    type="button"
                    onClick={onLogout}
                    title={collapsed ? "Выйти" : undefined}
                    className={`group mt-2 flex h-10 w-full items-center rounded-xl text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-white/70 hover:text-emerald-600 dark:text-white/55 dark:hover:bg-white/[0.07] dark:hover:text-emerald-300 ${
                        collapsed ? "justify-center" : "px-3"
                    }`}
                >
                    <ArrowRightOnRectangleIcon
                        className={`h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 ${
                            collapsed ? "" : "mr-2"
                        }`}
                    />
                    {!collapsed && "Выйти"}
                </button>
            </div>
        </div>
    );
}
