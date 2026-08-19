"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowRightIcon,
    Bars3Icon,
    BellAlertIcon,
    CalendarDaysIcon,
    ChatBubbleLeftRightIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    EnvelopeIcon,
    PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { withAuth } from "@/hoc/withAuth";
import { useSidebarCollapsed } from "@/hoc/useSidebarCollapsed";
import SidebarMenu from "@/components/SidebarMenu";
import BranchInitial from "@/components/BranchInitial";
import BranchSwitcherModal from "@/components/BranchSwitcherModal";
import Loader from "@/components/Loader";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/lib/theme/theme.context";
import { cabinetDashboard } from "@/services/cabinetDashboard";
import { companiesList, Company } from "@/services/companiesList";
import { branchesList } from "@/services/branchesList";
import { authStorage } from "@/services/authStorage";
import { setApiContext } from "@/services/apiContext";
import { logoutApi } from "@/services/logoutApi";
import { getApiErrorMessage } from "@/services/apiError";
import { fetchWhatsAppSettings, isWhatsAppSettingsEnabled } from "@/services/whatsappApi";

type BranchItem = {
    id: number;
    company_id?: number;
    companyId?: number;
    name: string;
    address?: string | null;
    phone?: string | null;
};

type DashboardUser = Awaited<ReturnType<typeof cabinetDashboard>>;
type IntegrationStatus = "configured" | "not_configured" | "soon";

type IntegrationCardProps = {
    title: string;
    description: string;
    status: IntegrationStatus;
    href?: string;
    icon: React.ReactNode;
};

const statusText: Record<IntegrationStatus, string> = {
    configured: "настроено",
    not_configured: "не настроено",
    soon: "скоро",
};

const statusClass: Record<IntegrationStatus, string> = {
    configured: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200",
    not_configured: "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200",
    soon: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/55",
};

function IntegrationCard({
    title,
    description,
    status,
    href,
    icon,
}: IntegrationCardProps) {
    const body = (
        <div className={`admin-list-row flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition dark:border-white/10 dark:bg-white/5 dark:shadow-none ${
            href ? "hover:border-green-300 hover:bg-gray-50 dark:hover:border-green-400/30 dark:hover:bg-white/[0.08]" : "opacity-70"
        }`}>
            <div>
                <div className="mb-4 flex items-start justify-between gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        status === "configured"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-200"
                            : status === "soon"
                                ? "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-white/35"
                                : "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-200"
                    }`}>
                        {icon}
                    </span>

                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[status]}`}>
                        {statusText[status]}
                    </span>
                </div>

                <h3 className="text-base font-bold text-gray-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-white/60">{description}</p>
            </div>

            <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-white/45">
                    {href ? "Открыть настройки" : "Появится позже"}
                </span>
                {href && <ArrowRightIcon className="h-5 w-5 text-green-500 dark:text-green-300" />}
            </div>
        </div>
    );

    if (!href) return body;

    return (
        <Link href={href} className="block h-full focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]">
            {body}
        </Link>
    );
}

const Page: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const routeBranchId = Number(params?.id);
    const branchId = Number.isFinite(routeBranchId) ? routeBranchId : null;
    const { collapsed, setCollapsed } = useSidebarCollapsed();
    const { theme } = useTheme();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModalFilOpen, setIsModalFilOpen] = useState(false);
    const [companiesData, setCompaniesData] = useState<Company[] | null>(null);
    const [branchesData, setBranchesData] = useState<BranchItem[] | null>(null);
    const [userData, setUserData] = useState<DashboardUser | null>(null);
    const [whatsAppConfigured, setWhatsAppConfigured] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const branch = useMemo(
        () => branchesData?.find((item) => item.id === branchId) ?? null,
        [branchesData, branchId],
    );
    const company = companiesData?.[0] ?? null;

    useEffect(() => {
        const load = async () => {
            if (!branchId) {
                setError("Филиал не найден.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError("");

            try {
                const context = authStorage.getContext();
                const [user, companies] = await Promise.all([
                    cabinetDashboard(),
                    companiesList().catch(() => []),
                ]);

                const companyRows = companies.length > 0
                    ? companies
                    : context?.company_id
                        ? [{ id: context.company_id, name: context.company_name ?? "Компания" } as Company]
                        : [];
                const currentCompany = companyRows[0] ?? null;
                const branches = currentCompany?.id
                    ? await branchesList(currentCompany.id).catch(() => [])
                    : [];
                const branchRows = branches.length > 0
                    ? branches
                    : context?.branch_id
                        ? [{
                            id: context.branch_id,
                            name: context.branch_name ?? "Филиал",
                            company_id: context.company_id,
                        }]
                        : [];

                if (currentCompany?.id && context?.branch_id !== branchId) {
                    await setApiContext({
                        company_id: currentCompany.id,
                        branch_id: branchId,
                    }).then((updatedContext) => {
                        if (updatedContext) authStorage.setContext(updatedContext);
                    }).catch(() => null);
                }

                const whatsAppSettings = currentCompany?.id
                    ? await fetchWhatsAppSettings(currentCompany.id).catch(() => null)
                    : null;

                setUserData(user);
                setCompaniesData(companyRows);
                setBranchesData(branchRows);
                setWhatsAppConfigured(isWhatsAppSettingsEnabled(whatsAppSettings));
            } catch (err) {
                setError(getApiErrorMessage(err, "Не удалось загрузить интеграции."));
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [branchId]);

    const handleLogout = async () => {
        await logoutApi().catch(() => null);
        authStorage.clear();
        router.push("/signin");
    };

    if (isLoading) {
        return <Loader type="default" visible />;
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--background))] px-4 text-center text-red-500">
                <div>
                    <p className="text-lg font-semibold">Ошибка загрузки</p>
                    <p className="mt-2 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
            {isMenuOpen && (
                <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setIsMenuOpen(false)}>
                    <div className="absolute left-0 top-0 h-full w-4/5 border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--foreground))]" onClick={(event) => event.stopPropagation()}>
                        <SidebarMenu
                            id={branchId}
                            companyName={company?.name}
                            branchName={branch?.name}
                            userData={userData ?? undefined}
                            variant="mobile"
                            onLogout={handleLogout}
                            onBranchClick={() => {
                                setIsMenuOpen(false);
                                setIsModalFilOpen(true);
                            }}
                            onNavigate={() => setIsMenuOpen(false)}
                        />
                    </div>
                </div>
            )}

            <aside className={`fixed z-10 hidden h-full flex-col border-r border-slate-200/70 bg-[rgb(var(--sidebar))] text-[rgb(var(--sidebar-foreground))] transition-all duration-300 dark:border-white/10 md:flex ${collapsed ? "w-[96px]" : "w-[320px]"}`}>
                <div className="flex h-full flex-col p-4">
                    <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-200/70 pb-3 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => setIsModalFilOpen(true)}
                            className={`flex min-w-0 items-center rounded-2xl p-1 text-left transition hover:bg-white/70 dark:hover:bg-white/[0.07] ${
                                collapsed ? "justify-center" : "flex-1"
                            }`}
                            title={collapsed ? branch?.name || "Филиал" : undefined}
                        >
                            <BranchInitial name={branch?.name} className={collapsed ? "" : "mr-2"} />
                            {!collapsed && (
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold">{branch?.name || "Филиал"}</span>
                                    <span className="block truncate text-xs text-[rgb(var(--muted-foreground))]">{company?.name || "Компания"}</span>
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                setCollapsed(!collapsed);
                            }}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                            aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
                        >
                            {collapsed ? <ChevronDoubleRightIcon className="h-5 w-5" /> : <ChevronDoubleLeftIcon className="h-5 w-5" />}
                        </button>
                    </div>
                    <SidebarMenu
                        id={branchId}
                        companyName={company?.name}
                        branchName={branch?.name}
                        userData={userData ?? undefined}
                        variant="desktop"
                        onLogout={handleLogout}
                        collapsed={collapsed}
                        setCollapsed={setCollapsed}
                    />
                </div>
            </aside>

            <main className={`min-h-screen px-3 py-4 transition-all duration-300 md:px-6 md:py-6 ${collapsed ? "md:ml-[96px]" : "md:ml-[320px]"}`}>
                <BranchSwitcherModal
                    isOpen={isModalFilOpen}
                    branches={branchesData}
                    company={company}
                    activeBranchId={branchId}
                    redirectPathPrefix="/settings/integrations"
                    onClose={() => setIsModalFilOpen(false)}
                    onBranchesChange={setBranchesData}
                />

                <div className="admin-page-header mb-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:shadow-none">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Открыть меню"
                            className="shrink-0 rounded-md bg-green-500 p-2 shadow transition hover:bg-green-600 md:hidden"
                        >
                            <Bars3Icon className="h-6 w-6 text-white" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="truncate text-lg font-semibold text-gray-900 dark:text-white">Интеграции</h1>
                            <p className="hidden text-sm text-gray-500 dark:text-gray-400 md:block">
                                Подключения для автоматического общения с клиентами и внешними сервисами
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:inline">Тема: {theme}</span>
                        <ThemeToggle />
                    </div>
                </div>

                <section className="admin-list-surface rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-white dark:shadow-none">
                    <div className="mb-5">
                        <h2 className="text-xl font-bold">Доступные интеграции</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-white/55">
                            Сейчас доступен WhatsApp. Остальные каналы можно добавить позже без изменения структуры кабинета.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <IntegrationCard
                            title="WhatsApp"
                            description="Подтверждения, отмены и напоминания по записям. Отправка выполняется через backend по сохраненным настройкам."
                            status={whatsAppConfigured ? "configured" : "not_configured"}
                            href={branchId ? `/settings/integrations/${branchId}/whatsapp` : undefined}
                            icon={<BellAlertIcon className="h-5 w-5" />}
                        />
                        <IntegrationCard
                            title="SMS"
                            description="Резервный канал для клиентов без WhatsApp и важных сервисных сообщений."
                            status="soon"
                            icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />}
                        />
                        <IntegrationCard
                            title="Telegram"
                            description="Быстрые сообщения клиентам и внутренние уведомления команде."
                            status="soon"
                            icon={<PaperAirplaneIcon className="h-5 w-5" />}
                        />
                        <IntegrationCard
                            title="Email"
                            description="Письма клиентам, подтверждения, квитанции и маркетинговые рассылки."
                            status="soon"
                            icon={<EnvelopeIcon className="h-5 w-5" />}
                        />
                        <IntegrationCard
                            title="Google Calendar"
                            description="Синхронизация расписания мастеров и внешних календарей."
                            status="soon"
                            icon={<CalendarDaysIcon className="h-5 w-5" />}
                        />
                    </div>
                </section>
            </main>
        </div>
    );
};

export default withAuth(Page);
