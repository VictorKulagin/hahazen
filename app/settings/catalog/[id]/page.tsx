"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Bars3Icon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import { ChevronDown, EyeOff, ImagePlus, LoaderCircle, Save, Send, Trash2 } from "lucide-react";
import { withAuth } from "@/hoc/withAuth";
import { useSidebarCollapsed } from "@/hoc/useSidebarCollapsed";
import SidebarMenu from "@/components/SidebarMenu";
import BranchInitial from "@/components/BranchInitial";
import BranchSwitcherModal from "@/components/BranchSwitcherModal";
import SetupStepNav from "@/components/SetupStepNav";
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
import { resolveCatalogAssetUrl } from "@/services/publicCatalogApi";
import {
    deleteOwnerCatalogImage,
    fetchOwnerCatalogProfile,
    hideOwnerCatalogProfile,
    OwnerCatalogBookingMode,
    OwnerCatalogProfile,
    publishOwnerCatalogProfile,
    saveOwnerCatalogProfile,
    uploadOwnerCatalogImage,
} from "@/services/ownerCatalogApi";

type BranchItem = {
    id: number;
    company_id?: number;
    companyId?: number;
    name: string;
    address?: string | null;
    phone?: string | null;
};

type DashboardUser = Awaited<ReturnType<typeof cabinetDashboard>>;

type FormState = {
    name: string;
    shortDescription: string;
    description: string;
    countryCode: "KG" | "KZ" | "RU";
    city: string;
    address: string;
    phone: string;
    websiteUrl: string;
    instagramUrl: string;
    servicesSummary: string;
    bookingMode: OwnerCatalogBookingMode;
    externalBookingUrl: string;
};

type CatalogSelectOption<T extends string> = {
    value: T;
    label: string;
};

type CatalogSelectProps<T extends string> = {
    value: T;
    options: CatalogSelectOption<T>[];
    onChange: (value: T) => void;
    ariaLabel: string;
};

const countryOptions: CatalogSelectOption<FormState["countryCode"]>[] = [
    { value: "KG", label: "KG" },
    { value: "KZ", label: "KZ" },
    { value: "RU", label: "RU" },
];

const bookingModeOptions: CatalogSelectOption<OwnerCatalogBookingMode>[] = [
    { value: "hahazen", label: "Через Hahazen" },
    { value: "external", label: "Внешняя ссылка" },
    { value: "none", label: "Нет" },
];

const initialForm = (branch?: BranchItem | null, company?: Company | null): FormState => ({
    name: branch?.name ?? "",
    shortDescription: "",
    description: "",
    countryCode: company?.country_code === "KZ" || company?.country_code === "RU" ? company.country_code : "KG",
    city: "Bishkek",
    address: branch?.address ?? "",
    phone: branch?.phone ?? "",
    websiteUrl: "",
    instagramUrl: "",
    servicesSummary: "",
    bookingMode: "hahazen",
    externalBookingUrl: "",
});

const formFromProfile = (profile: OwnerCatalogProfile): FormState => ({
    name: profile.name,
    shortDescription: profile.shortDescription ?? "",
    description: profile.description ?? "",
    countryCode: profile.countryCode === "KZ" || profile.countryCode === "RU" ? profile.countryCode : "KG",
    city: profile.city || "Bishkek",
    address: profile.address ?? "",
    phone: profile.phone ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    instagramUrl: profile.instagramUrl ?? "",
    servicesSummary: profile.servicesSummary ?? "",
    bookingMode: profile.bookingMode === "external" || profile.bookingMode === "none" ? profile.bookingMode : "hahazen",
    externalBookingUrl: profile.externalBookingUrl ?? "",
});

const fieldClass = "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white";

const statusLabels: Record<string, string> = {
    draft: "Черновик",
    published: "Опубликован",
    hidden: "Скрыт",
    suspended: "Приостановлен",
};

const statusClasses: Record<string, string> = {
    draft: "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200",
    published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200",
    hidden: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/70",
    suspended: "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-200",
};

const getResponseStatus = (error: unknown): number | undefined =>
    (error as { response?: { status?: number } })?.response?.status;

function CatalogSelect<T extends string>({
    value,
    options,
    onChange,
    ariaLabel,
}: CatalogSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const selected = options.find((option) => option.value === value);

    return (
        <div
            className="relative mt-1.5"
            onBlur={(event) => {
                const nextTarget = event.relatedTarget;
                if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
                    setIsOpen(false);
                }
            }}
        >
            <button
                type="button"
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((current) => !current)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-left text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
                <span>{selected?.label ?? value}</span>
                <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    className="absolute left-0 right-0 z-40 mt-1 overflow-hidden rounded-xl border border-emerald-500/20 bg-white py-1 shadow-xl shadow-slate-950/10 dark:border-emerald-300/15 dark:bg-[rgb(var(--card))] dark:shadow-black/30"
                >
                    {options.map((option) => {
                        const isSelected = option.value === value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`flex w-full items-center px-3 py-2 text-left text-sm font-medium transition ${
                                    isSelected
                                        ? "bg-emerald-500 text-white"
                                        : "text-slate-700 hover:bg-emerald-50 dark:text-white/80 dark:hover:bg-emerald-400/10"
                                }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            )}
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
    const [profile, setProfile] = useState<OwnerCatalogProfile | null>(null);
    const [form, setForm] = useState<FormState>(initialForm());
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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

                const loadedProfile = await fetchOwnerCatalogProfile(branchId);
                const currentBranch = branchRows.find((item) => item.id === branchId) ?? null;

                setUserData(user);
                setCompaniesData(companyRows);
                setBranchesData(branchRows);
                setProfile(loadedProfile);
                setForm(loadedProfile ? formFromProfile(loadedProfile) : initialForm(currentBranch, currentCompany));
            } catch (err) {
                setError(getApiErrorMessage(err, "Не удалось загрузить карточку салона."));
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

    const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!branchId) return;

        if (form.bookingMode === "external" && !form.externalBookingUrl.trim().startsWith("https://")) {
            setError("Для внешней записи укажите HTTPS-ссылку.");
            return;
        }

        setIsSaving(true);
        setError("");
        setSuccess("");
        try {
            const saved = await saveOwnerCatalogProfile(branchId, {
                name: form.name.trim(),
                shortDescription: form.shortDescription.trim() || undefined,
                description: form.description.trim() || undefined,
                countryCode: form.countryCode,
                city: form.city.trim(),
                address: form.address.trim() || undefined,
                phone: form.phone.trim() || undefined,
                websiteUrl: form.websiteUrl.trim() || undefined,
                instagramUrl: form.instagramUrl.trim() || undefined,
                servicesSummary: form.servicesSummary.trim() || undefined,
                bookingMode: form.bookingMode,
                externalBookingUrl: form.bookingMode === "external"
                    ? form.externalBookingUrl.trim()
                    : undefined,
            });
            setProfile(saved);
            setForm(formFromProfile(saved));
            setSuccess("Карточка салона сохранена.");
        } catch (err) {
            setError(getApiErrorMessage(err, "Не удалось сохранить карточку салона."));
        } finally {
            setIsSaving(false);
        }
    };

    const runAction = async (key: string, action: () => Promise<void>, message: string) => {
        if (!branchId) return;
        setActiveAction(key);
        setError("");
        setSuccess("");
        try {
            await action();
            setProfile(await fetchOwnerCatalogProfile(branchId));
            setSuccess(message);
        } catch (err) {
            setError(getApiErrorMessage(err, "Не удалось выполнить действие."));
        } finally {
            setActiveAction(null);
        }
    };

    const uploadImage = async () => {
        if (!branchId || !file || !profile) return;
        if (profile.galleryUrls.length >= 7) {
            setError("Достигнут лимит фотографий (7).");
            return;
        }

        setActiveAction("upload");
        setError("");
        setSuccess("");
        try {
            await uploadOwnerCatalogImage(branchId, file);
            setFile(null);
            setProfile(await fetchOwnerCatalogProfile(branchId));
            setSuccess("Фото загружено.");
        } catch (err) {
            setError(getApiErrorMessage(err, "Не удалось загрузить фото."));
        } finally {
            setActiveAction(null);
        }
    };

    const deleteImage = async (url: string) => {
        if (!branchId || !profile) return;
        const confirmed = window.confirm("Удалить это фото из карточки салона?");
        if (!confirmed) return;

        setActiveAction(`delete-${url}`);
        setError("");
        setSuccess("");
        try {
            await deleteOwnerCatalogImage(branchId, url);
            setProfile(await fetchOwnerCatalogProfile(branchId));
            setSuccess("Фото удалено.");
        } catch (err) {
            if ([500, 502, 504].includes(getResponseStatus(err) ?? 0)) {
                const updated = await fetchOwnerCatalogProfile(branchId).catch(() => null);
                if (updated && !updated.galleryUrls.includes(url)) {
                    setProfile(updated);
                    setSuccess("Фото удалено.");
                    setActiveAction(null);
                    return;
                }
            }
            setError(getApiErrorMessage(err, "Не удалось удалить фото."));
        } finally {
            setActiveAction(null);
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
                        {false && !collapsed && (
                            <div>
                                <p className="text-sm font-semibold">{branch?.name || "Филиал"}</p>
                                <p className="text-xs text-[rgb(var(--muted-foreground))]">{company?.name || "Компания"}</p>
                            </div>
                        )}
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
                    redirectPathPrefix="/settings/catalog"
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
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Карточка салона</h1>
                            <p className="hidden text-sm text-gray-500 dark:text-gray-400 md:block">Публичный профиль филиала в каталоге Hahazen</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:inline">Тема: {theme}</span>
                        <ThemeToggle />
                    </div>
                </div>

                <SetupStepNav branchId={branchId} currentStep="catalog" />

                {(error || success) && (
                    <div className={`mb-5 whitespace-pre-line rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/5 dark:text-red-200" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/5 dark:text-emerald-200"}`}>
                        {error || success}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <section className="admin-list-surface rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-white dark:shadow-none">
                        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold">Данные карточки</h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-white/55">
                                    Связано с CRM branch_id: <span className="font-semibold">{branchId}</span>
                                </p>
                            </div>
                            {profile && (
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[profile.status] ?? statusClasses.hidden}`}>
                                    {statusLabels[profile.status] ?? profile.status}
                                </span>
                            )}
                        </div>

                        <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
                            <label className="block text-sm font-medium md:col-span-2">Название *<input required maxLength={180} value={form.name} onChange={(event) => updateForm("name", event.target.value)} className={fieldClass} /></label>
                            <label className="block text-sm font-medium md:col-span-2">Краткое описание<textarea maxLength={300} rows={2} value={form.shortDescription} onChange={(event) => updateForm("shortDescription", event.target.value)} className={fieldClass} /></label>
                            <label className="block text-sm font-medium md:col-span-2">Полное описание<textarea maxLength={5000} rows={5} value={form.description} onChange={(event) => updateForm("description", event.target.value)} className={fieldClass} /></label>
                            <label className="block text-sm font-medium">Страна<CatalogSelect value={form.countryCode} options={countryOptions} onChange={(value) => updateForm("countryCode", value)} ariaLabel="Страна" /></label>
                            <label className="block text-sm font-medium">Город *<input required value={form.city} onChange={(event) => updateForm("city", event.target.value)} className={fieldClass} /></label>
                            <label className="block text-sm font-medium">Адрес<input value={form.address} onChange={(event) => updateForm("address", event.target.value)} className={fieldClass} /></label>
                            <label className="block text-sm font-medium">Телефон<input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} className={fieldClass} placeholder="+996..." /></label>
                            <label className="block text-sm font-medium">Сайт<input type="url" value={form.websiteUrl} onChange={(event) => updateForm("websiteUrl", event.target.value)} className={fieldClass} placeholder="https://..." /></label>
                            <label className="block text-sm font-medium">Instagram<input type="url" value={form.instagramUrl} onChange={(event) => updateForm("instagramUrl", event.target.value)} className={fieldClass} placeholder="https://instagram.com/..." /></label>
                            <label className="block text-sm font-medium md:col-span-2">Услуги<input maxLength={300} value={form.servicesSummary} onChange={(event) => updateForm("servicesSummary", event.target.value)} className={fieldClass} placeholder="Стрижка · Борода · Укладка" /></label>
                            <label className="block text-sm font-medium">Онлайн-запись<CatalogSelect value={form.bookingMode} options={bookingModeOptions} onChange={(value) => updateForm("bookingMode", value)} ariaLabel="Онлайн-запись" /></label>
                            {form.bookingMode === "external" && (
                                <label className="block text-sm font-medium">Ссылка записи<input required type="url" value={form.externalBookingUrl} onChange={(event) => updateForm("externalBookingUrl", event.target.value)} className={fieldClass} placeholder="https://..." /></label>
                            )}
                            <div className="md:col-span-2">
                                <button disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60">
                                    {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {profile ? "Сохранить изменения" : "Создать карточку"}
                                </button>
                            </div>
                        </form>
                    </section>

                    <aside className="space-y-5">
                        <section className="admin-list-surface rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-white dark:shadow-none">
                            <h2 className="text-lg font-bold">Публикация</h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-white/55">
                                Для публикации нужны название, город и хотя бы одно фото.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button disabled={!profile || activeAction !== null} onClick={() => void runAction("publish", () => publishOwnerCatalogProfile(branchId!), "Карточка опубликована.")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"><Send className="h-4 w-4" />Опубликовать</button>
                                <button disabled={!profile || activeAction !== null} onClick={() => void runAction("hide", () => hideOwnerCatalogProfile(branchId!), "Карточка скрыта.")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"><EyeOff className="h-4 w-4" />Скрыть</button>
                            </div>
                        </section>

                        <section className="admin-list-surface rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-white dark:shadow-none">
                            <h2 className="text-lg font-bold">Фото</h2>
                            {!profile && <p className="mt-2 text-sm text-slate-500 dark:text-white/55">Сначала сохраните карточку, затем загрузите фото.</p>}
                            {profile && (
                                <>
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        {profile.galleryUrls.map((url, index) => {
                                            const imageUrl = resolveCatalogAssetUrl(url);
                                            return (
                                                <div key={url} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                                                    <div className="relative aspect-[4/3] bg-slate-200 dark:bg-white/10">
                                                        {imageUrl && (
                                                            // eslint-disable-next-line @next/next/no-img-element -- Catalog thumbnails use API upload URLs directly.
                                                            <img src={imageUrl} alt={`${profile.name}: фото ${index + 1}`} className="h-full w-full object-cover" />
                                                        )}
                                                        {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white">Обложка</span>}
                                                    </div>
                                                    <button type="button" disabled={activeAction !== null} onClick={() => void deleteImage(url)} className="flex w-full items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-400/10">
                                                        {activeAction === `delete-${url}` ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                        Удалить
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                        <label className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium transition dark:border-white/10 ${profile.galleryUrls.length >= 7 ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"}`}>
                                            <ImagePlus className="h-4 w-4" />{profile.galleryUrls.length >= 7 ? "Лимит 7 фото" : file?.name ?? "Выбрать фото"}
                                            <input disabled={profile.galleryUrls.length >= 7} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                                        </label>
                                        <button disabled={!file || activeAction !== null || profile.galleryUrls.length >= 7} onClick={() => void uploadImage()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-slate-900">
                                            {activeAction === "upload" && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                            Загрузить
                                        </button>
                                    </div>
                                </>
                            )}
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default withAuth(Page);
