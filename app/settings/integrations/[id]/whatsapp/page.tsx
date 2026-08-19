"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Bars3Icon,
    BellAlertIcon,
    ChatBubbleLeftRightIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import { CheckCircle2, Clock3, LoaderCircle, PlugZap, Save, ShieldAlert } from "lucide-react";
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
import {
    fetchWhatsAppSettings,
    getDefaultWhatsAppSettings,
    isWhatsAppSettingsEnabled,
    saveWhatsAppSettings,
    WhatsAppSettings,
} from "@/services/whatsappApi";

type BranchItem = {
    id: number;
    company_id?: number;
    companyId?: number;
    name: string;
    address?: string | null;
    phone?: string | null;
};

type DashboardUser = Awaited<ReturnType<typeof cabinetDashboard>>;

type NotificationToggleRowProps = {
    title: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    disabledReason?: string;
    onChange: (checked: boolean) => void;
    icon: React.ReactNode;
};

const fieldClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:disabled:bg-white/[0.03] dark:disabled:text-white/35";

const getResponseStatus = (error: unknown): number | undefined =>
    (error as { response?: { status?: number } })?.response?.status;

const isEndpointUnavailable = (error: unknown): boolean =>
    [404, 405, 501].includes(getResponseStatus(error) ?? 0);

const unavailableTitle = "Настройки WhatsApp пока недоступны";
const unavailableDescription =
    "Backend не вернул настройки компании. Проверьте доступ к companies API и права company:settings:update.";

const clampReminderHours = (value: number): number => Math.min(48, Math.max(1, value));

function NotificationToggleRow({
    title,
    description,
    checked,
    disabled = false,
    disabledReason,
    onChange,
    icon,
}: NotificationToggleRowProps) {
    return (
        <div className={`flex items-center gap-4 border-b border-slate-200/80 py-4 last:border-b-0 dark:border-white/10 ${disabled ? "opacity-50" : ""}`}>
            <div className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex ${
                disabled
                    ? "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-white/35"
                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-200"
            }`}>
                {icon}
            </div>

            <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-white/55">{description}</p>
                {disabled && disabledReason && (
                    <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-200">
                        {disabledReason}
                    </p>
                )}
            </div>

            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={`relative h-8 w-14 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed ${
                    disabled
                        ? "bg-slate-200 dark:bg-white/10"
                        : checked
                            ? "bg-emerald-500"
                            : "bg-slate-300 dark:bg-white/18"
                }`}
            >
                <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${
                        checked ? "left-7" : "left-1"
                    }`}
                />
            </button>
        </div>
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
    const [settings, setSettings] = useState<WhatsAppSettings>(getDefaultWhatsAppSettings());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isApiUnavailable, setIsApiUnavailable] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const branch = useMemo(
        () => branchesData?.find((item) => item.id === branchId) ?? null,
        [branchesData, branchId],
    );
    const company = companiesData?.[0] ?? null;
    const companyId = company?.id ?? null;
    const settingsEnabled = isWhatsAppSettingsEnabled(settings);
    const canEditSettings = !isApiUnavailable;
    const controlsDisabled = !canEditSettings || isSaving;
    const controlsDisabledReason = !canEditSettings ? "Настройки временно недоступны" : undefined;
    const saveButtonLabel = canEditSettings ? "Сохранить настройки" : "Настройки недоступны";

    useEffect(() => {
        const load = async () => {
            if (!branchId) {
                setError("Филиал не найден.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError("");
            setSuccess("");
            setIsApiUnavailable(false);

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

                if (!currentCompany?.id) {
                    throw new Error("Компания не найдена.");
                }

                if (context?.branch_id !== branchId) {
                    await setApiContext({
                        company_id: currentCompany.id,
                        branch_id: branchId,
                    }).then((updatedContext) => {
                        if (updatedContext) authStorage.setContext(updatedContext);
                    }).catch(() => null);
                }

                const loadedSettings = await fetchWhatsAppSettings(currentCompany.id).catch((err) => {
                    if (isEndpointUnavailable(err)) {
                        setIsApiUnavailable(true);
                        return getDefaultWhatsAppSettings();
                    }

                    throw err;
                });

                setUserData(user);
                setCompaniesData(companyRows);
                setBranchesData(branchRows);
                setSettings(loadedSettings);
            } catch (err) {
                setError(getApiErrorMessage(err, "Не удалось загрузить настройки WhatsApp."));
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

    const updateSettings = <K extends keyof WhatsAppSettings>(
        key: K,
        value: WhatsAppSettings[K],
    ) => {
        setSettings((current) => ({ ...current, [key]: value }));
    };

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!companyId) {
            setError("Компания не найдена.");
            return;
        }

        if (!canEditSettings) {
            setError("");
            return;
        }

        setIsSaving(true);
        setError("");
        setSuccess("");

        try {
            const saved = await saveWhatsAppSettings(companyId, {
                confirmationEnabled: settings.confirmationEnabled,
                cancellationEnabled: settings.cancellationEnabled,
                reminderEnabled: settings.reminderEnabled,
                reminderHoursBefore: clampReminderHours(settings.reminderHoursBefore),
            });

            setSettings(saved);
            setSuccess("Настройки WhatsApp сохранены. Отправка сообщений выполняется backend при создании, отмене и напоминании записи.");
        } catch (err) {
            if (isEndpointUnavailable(err)) {
                setIsApiUnavailable(true);
                setError("");
                return;
            }

            setError(getApiErrorMessage(err, "Не удалось сохранить настройки WhatsApp."));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <Loader type="default" visible />;
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
                            <h1 className="truncate text-lg font-semibold text-gray-900 dark:text-white">WhatsApp</h1>
                            <p className="hidden text-sm text-gray-500 dark:text-gray-400 md:block">
                                Сообщения клиентам на номер телефона из карточки записи
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:inline">Тема: {theme}</span>
                        <ThemeToggle />
                    </div>
                </div>

                {(error || success || isApiUnavailable) && (
                    <div className={`mb-5 whitespace-pre-line rounded-2xl border px-4 py-3 text-sm ${
                        error
                            ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/5 dark:text-red-200"
                            : success
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/5 dark:text-emerald-200"
                                : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/5 dark:text-amber-200"
                    }`}>
                        {error || success || (
                            <>
                                <p className="font-semibold">{unavailableTitle}</p>
                                <p className="mt-1 leading-5">{unavailableDescription}</p>
                            </>
                        )}
                    </div>
                )}

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <form onSubmit={handleSave} className="admin-list-surface rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-white dark:shadow-none">
                        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <BellAlertIcon className="h-6 w-6 text-emerald-500" />
                                    <h2 className="text-xl font-bold">События записи</h2>
                                </div>
                                <p className="mt-1 text-sm text-slate-500 dark:text-white/55">
                                    Компания: <span className="font-semibold">{company?.name || companyId || "не найдена"}</span>
                                </p>
                            </div>

                            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                settingsEnabled
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200"
                            }`}>
                                {settingsEnabled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                                {settingsEnabled ? "Настройки включены" : "Настройки выключены"}
                            </span>
                        </div>

                        <div className="rounded-2xl border border-slate-200/80 bg-white/60 px-4 dark:border-white/10 dark:bg-white/[0.03]">
                            <NotificationToggleRow
                                title="Подтверждение записи"
                                description="Клиент получит сообщение сразу после создания записи."
                                checked={settings.confirmationEnabled}
                                disabled={controlsDisabled}
                                disabledReason={controlsDisabledReason}
                                onChange={(checked) => updateSettings("confirmationEnabled", checked)}
                                icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />}
                            />
                            <NotificationToggleRow
                                title="Уведомление об отмене"
                                description="Клиент получит сообщение при отмене записи."
                                checked={settings.cancellationEnabled}
                                disabled={controlsDisabled}
                                disabledReason={controlsDisabledReason}
                                onChange={(checked) => updateSettings("cancellationEnabled", checked)}
                                icon={<ShieldAlert className="h-5 w-5" />}
                            />
                            <NotificationToggleRow
                                title="Напоминание о записи"
                                description="Backend отправит напоминание за указанное время до визита."
                                checked={settings.reminderEnabled}
                                disabled={controlsDisabled}
                                disabledReason={controlsDisabledReason}
                                onChange={(checked) => updateSettings("reminderEnabled", checked)}
                                icon={<Clock3 className="h-5 w-5" />}
                            />
                        </div>

                        <div className={`mt-5 grid gap-3 rounded-2xl border border-slate-200/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center ${!settings.reminderEnabled || !canEditSettings ? "opacity-55" : ""}`}>
                            <div>
                                <label htmlFor="reminderHoursBefore" className="font-semibold text-slate-900 dark:text-white">
                                    Напомнить за
                                </label>
                                <p className="mt-1 text-sm text-slate-500 dark:text-white/55">
                                    Часов до начала записи, от 1 до 48.
                                </p>
                            </div>

                            <div className="relative">
                                <input
                                    id="reminderHoursBefore"
                                    type="number"
                                    min={1}
                                    max={48}
                                    value={settings.reminderHoursBefore}
                                    disabled={!settings.reminderEnabled || !canEditSettings || isSaving}
                                    onChange={(event) => updateSettings("reminderHoursBefore", clampReminderHours(Number(event.target.value)))}
                                    className={`${fieldClass} pr-10`}
                                />
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                                    ч
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving || !canEditSettings}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-55"
                            >
                                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {saveButtonLabel}
                            </button>
                        </div>
                    </form>

                    <aside className="space-y-5">
                        <section className="admin-list-surface rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-white dark:shadow-none">
                            <div className="flex items-start gap-3">
                                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                    settingsEnabled
                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-200"
                                        : "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-200"
                                }`}>
                                    <PlugZap className="h-5 w-5" />
                                </span>
                                <div>
                                    <h2 className="text-lg font-bold">
                                        {settingsEnabled ? "Автоуведомления включены" : "Автоуведомления выключены"}
                                    </h2>
                                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-white/55">
                                        Фронт сохраняет только настройки. Отправка WhatsApp идёт через backend при создании, отмене и напоминании записи.
                                    </p>
                                    <p className="mt-2 text-xs font-medium text-slate-400 dark:text-white/35">
                                        Тест: создайте запись с тестовым телефоном, который дал backend-разработчик.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default withAuth(Page);
