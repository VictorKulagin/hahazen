"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    EyeOff,
    ImagePlus,
    LoaderCircle,
    LogOut,
    Pencil,
    Plus,
    RefreshCw,
    Send,
    ShieldAlert,
    Store,
    Trash2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { authStorage } from "@/services/authStorage";
import { getApiErrorMessage } from "@/services/apiError";
import {
    AdminCatalogProfile,
    CatalogBookingMode,
    createAdminCatalogProfile,
    deleteAdminCatalogImage,
    fetchAdminCatalogProfile,
    fetchAdminCatalogProfiles,
    hideAdminCatalogProfile,
    publishAdminCatalogProfile,
    suspendAdminCatalogProfile,
    updateAdminCatalogProfile,
    uploadAdminCatalogImage,
} from "@/services/adminCatalogApi";
import { buildPublicCatalogDetailUrl, resolveCatalogAssetUrl } from "@/services/publicCatalogApi";

type FormState = {
    name: string;
    shortDescription: string;
    description: string;
    countryCode: "KG" | "KZ" | "RU";
    city: string;
    address: string;
    phone: string;
    servicesSummary: string;
    branchId: string;
    bookingMode: CatalogBookingMode;
    externalBookingUrl: string;
    consentConfirmed: boolean;
    consentDate: string;
    consentNote: string;
};

const initialForm = (): FormState => ({
    name: "",
    shortDescription: "",
    description: "",
    countryCode: "KG",
    city: "Bishkek",
    address: "",
    phone: "",
    servicesSummary: "",
    branchId: "",
    bookingMode: "none",
    externalBookingUrl: "",
    consentConfirmed: false,
    consentDate: new Date().toISOString().slice(0, 10),
    consentNote: "",
});

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

const fieldClass = "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white";

const getResponseStatus = (error: unknown): number | undefined =>
    (error as { response?: { status?: number } })?.response?.status;

const authExpiredMessage = "Сессия истекла или токен недействителен. Войдите заново и повторите действие.";

export default function AdminCatalogSalonsPage() {
    const router = useRouter();
    const [accessState, setAccessState] = useState<"checking" | "allowed" | "denied">("checking");
    const [profiles, setProfiles] = useState<AdminCatalogProfile[]>([]);
    const [statusFilter, setStatusFilter] = useState("");
    const [form, setForm] = useState<FormState>(initialForm);
    const [editingProfile, setEditingProfile] = useState<AdminCatalogProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [files, setFiles] = useState<Record<number, File | null>>({});
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadProfiles = useCallback(async (status?: string) => {
        setIsLoading(true);
        setError("");
        try {
            setProfiles(await fetchAdminCatalogProfiles(status || undefined));
            setAccessState("allowed");
        } catch (err) {
            const statusCode = getResponseStatus(err);
            if (statusCode === 401) {
                authStorage.clear();
                router.replace("/signin");
                return;
            }
            if (statusCode === 403) {
                setAccessState("denied");
                return;
            }
            setAccessState("allowed");
            setError(getApiErrorMessage(err, "Не удалось загрузить карточки салонов."));
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        if (!authStorage.getToken()) {
            router.replace("/signin");
            return;
        }

        void Promise.resolve().then(() => loadProfiles());
    }, [loadProfiles, router]);

    const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const resetForm = () => {
        setEditingProfile(null);
        setForm(initialForm());
        setError("");
        setSuccess("");
    };

    const startEdit = (profile: AdminCatalogProfile) => {
        setEditingProfile(profile);
        setError("");
        setSuccess("");
        setForm({
            name: profile.name,
            shortDescription: profile.shortDescription ?? "",
            description: profile.description ?? "",
            countryCode: profile.countryCode === "KZ" || profile.countryCode === "RU" ? profile.countryCode : "KG",
            city: profile.city,
            address: profile.address ?? "",
            phone: profile.phone ?? "",
            servicesSummary: profile.servicesSummary ?? "",
            branchId: profile.branchId ? String(profile.branchId) : "",
            bookingMode: profile.bookingMode === "hahazen" || profile.bookingMode === "external" ? profile.bookingMode : "none",
            externalBookingUrl: profile.externalBookingUrl ?? "",
            consentConfirmed: profile.branchId == null,
            consentDate: new Date().toISOString().slice(0, 10),
            consentNote: "",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        const branchId = form.branchId.trim() ? Number(form.branchId) : undefined;
        if (branchId !== undefined && (!Number.isInteger(branchId) || branchId < 1)) {
            setError("branch_id должен быть положительным целым числом.");
            return;
        }
        if (!editingProfile && !branchId && !form.consentConfirmed) {
            setError("Для салона без CRM подтвердите получение согласия.");
            return;
        }
        if (!branchId && form.bookingMode === "hahazen") {
            setError("Запись через Hahazen доступна только салону с branch_id.");
            return;
        }
        if (form.bookingMode === "external" && !form.externalBookingUrl.trim().startsWith("https://")) {
            setError("Для внешней записи укажите HTTPS-ссылку.");
            return;
        }

        setIsCreating(true);
        try {
            const payload = {
                ...(branchId ? { branch_id: branchId } : {}),
                name: form.name.trim(),
                short_description: form.shortDescription.trim(),
                description: form.description.trim() || undefined,
                country_code: form.countryCode,
                city: form.city.trim(),
                address: form.address.trim() || undefined,
                phone: form.phone.trim() || undefined,
                services_summary: form.servicesSummary.trim() || undefined,
                booking_mode: form.bookingMode,
                external_booking_url: form.bookingMode === "external"
                    ? form.externalBookingUrl.trim()
                    : undefined,
                ...(!editingProfile && !branchId && form.consentConfirmed ? {
                    consent_received_at: Math.floor(new Date(`${form.consentDate}T12:00:00`).getTime() / 1000),
                    consent_note: form.consentNote.trim() || "Согласие подтверждено",
                } : {}),
            };

            if (editingProfile) {
                const updated = await updateAdminCatalogProfile(editingProfile.id, payload);
                setProfiles((current) => current.map((item) =>
                    item.id === updated.id ? { ...item, ...updated } : item,
                ));
                resetForm();
                setSuccess(`Карточка «${updated.name}» обновлена.`);
                await loadProfiles(statusFilter);
                return;
            }

            const created = await createAdminCatalogProfile(payload);
            setForm(initialForm());
            setSuccess(`Черновик «${created.name}» создан. Теперь загрузите фото и опубликуйте карточку.`);
            await loadProfiles();
        } catch (err) {
            setError(getApiErrorMessage(err, editingProfile ? "Не удалось обновить карточку салона." : "Не удалось создать карточку салона."));
        } finally {
            setIsCreating(false);
        }
    };

    const runAction = async (key: string, action: () => Promise<void>, message: string) => {
        setActiveAction(key);
        setError("");
        setSuccess("");
        try {
            await action();
            setSuccess(message);
            await loadProfiles(statusFilter);
        } catch (err) {
            setError(getApiErrorMessage(err, "Не удалось выполнить действие."));
        } finally {
            setActiveAction(null);
        }
    };

    const uploadImage = async (profile: AdminCatalogProfile) => {
        const file = files[profile.id];
        if (!file) return;
        if (profile.galleryUrls.length >= 7) {
            setError("Достигнут лимит фотографий (7). Удалите старое фото перед загрузкой нового.");
            return;
        }

        setActiveAction(`upload-${profile.id}`);
        setError("");
        setSuccess("");
        try {
            const uploadedUrl = await uploadAdminCatalogImage(profile.id, file);
            setFiles((current) => ({ ...current, [profile.id]: null }));
            if (uploadedUrl) {
                setProfiles((current) => current.map((item) =>
                    item.id === profile.id
                        ? {
                            ...item,
                            galleryUrls: item.galleryUrls.includes(uploadedUrl)
                                ? item.galleryUrls
                                : [...item.galleryUrls, uploadedUrl],
                        }
                        : item,
                ));
            }
            setSuccess(`Фото для «${profile.name}» загружено.`);
        } catch (err) {
            setError(getApiErrorMessage(err, "Не удалось загрузить фото."));
        } finally {
            setActiveAction(null);
        }
    };

    const deleteImage = async (profile: AdminCatalogProfile, url: string) => {
        const confirmed = window.confirm("Удалить это фото из галереи салона?");
        if (!confirmed) return;

        setActiveAction(`delete-image-${profile.id}-${url}`);
        setError("");
        setSuccess("");
        try {
            await deleteAdminCatalogImage(profile.id, url);
            const updatedProfile = await fetchAdminCatalogProfile(profile.id).catch(() => null);
            setProfiles((current) => current.map((item) =>
                item.id === profile.id
                    ? updatedProfile ?? { ...item, galleryUrls: item.galleryUrls.filter((imageUrl) => imageUrl !== url) }
                    : item,
            ));
            setSuccess(`Фото для «${profile.name}» удалено.`);
        } catch (err) {
            if (getResponseStatus(err) === 401) {
                authStorage.clear();
                setError(authExpiredMessage);
                router.replace("/signin");
                return;
            }
            if ([500, 502, 504].includes(getResponseStatus(err) ?? 0)) {
                try {
                    const updatedProfile = await fetchAdminCatalogProfile(profile.id);
                    if (!updatedProfile.galleryUrls.includes(url)) {
                        setProfiles((current) => current.map((item) =>
                            item.id === profile.id ? updatedProfile : item,
                        ));
                        setSuccess(`Фото для «${profile.name}» удалено.`);
                        return;
                    }
                } catch (verifyError) {
                    if (getResponseStatus(verifyError) === 401) {
                        authStorage.clear();
                        setError(authExpiredMessage);
                        router.replace("/signin");
                        return;
                    }
                }
            }
            setError(getApiErrorMessage(err, "Не удалось удалить фото."));
        } finally {
            setActiveAction(null);
        }
    };

    const logout = () => {
        authStorage.clear();
        router.push("/signin");
    };

    const selectImage = (profileId: number, file: File | null) => {
        setError("");
        if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setError("Разрешены только JPEG, PNG и WebP.");
            return;
        }
        if (file && file.size > 8 * 1024 * 1024) {
            setError("Размер фотографии не должен превышать 8 МБ.");
            return;
        }
        setFiles((current) => ({ ...current, [profileId]: file }));
    };

    if (accessState === "checking") {
        return <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--background))]"><LoaderCircle className="h-8 w-8 animate-spin text-emerald-500" /></div>;
    }

    if (accessState === "denied") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--background))] px-4 text-[rgb(var(--foreground))]">
                <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-400/20 dark:bg-[rgb(var(--card))]">
                    <ShieldAlert className="mx-auto h-10 w-10 text-red-500" />
                    <h1 className="mt-4 text-xl font-bold">Нет доступа к каталогу</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-white/60">Для этого раздела требуется право catalogManage.</p>
                    <button onClick={logout} className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">Войти другим пользователем</button>
                </div>
            </div>
        );
    }

    return (
        <div className="catalog-admin-page min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
            <header className="catalog-admin-header sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[rgb(var(--background))]/85">
                <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white"><Store className="h-5 w-5" /></span>
                        <div>
                            <p className="font-bold">Каталог салонов</p>
                            <p className="text-xs text-slate-500 dark:text-white/55">Platform Admin</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/" className="hidden rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5 sm:inline-flex">На сайт</Link>
                        <ThemeToggle />
                        <button onClick={logout} aria-label="Выйти" className="rounded-xl border border-slate-200 p-2.5 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"><LogOut className="h-4 w-4" /></button>
                    </div>
                </div>
            </header>

            <main className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[420px_minmax(0,1fr)]">
                <section className="catalog-admin-surface h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] xl:sticky xl:top-24">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Plus className="h-5 w-5" /></span>
                        <div>
                            <h1 className="font-bold">{editingProfile ? "Редактировать салон" : "Добавить салон"}</h1>
                            <p className="text-xs text-slate-500 dark:text-white/55">
                                {editingProfile ? `ID: ${editingProfile.id} · slug: ${editingProfile.slug}` : "Сначала создаётся черновик"}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        <label className="block text-sm font-medium">Название *<input required maxLength={180} value={form.name} onChange={(e) => updateForm("name", e.target.value)} className={fieldClass} /></label>
                        <label className="block text-sm font-medium">Краткое описание *<textarea required maxLength={300} rows={2} value={form.shortDescription} onChange={(e) => updateForm("shortDescription", e.target.value)} className={fieldClass} /></label>
                        <label className="block text-sm font-medium">Полное описание<textarea maxLength={5000} rows={3} value={form.description} onChange={(e) => updateForm("description", e.target.value)} className={fieldClass} /></label>
                        <div className="grid grid-cols-[110px_1fr] gap-3">
                            <label className="block text-sm font-medium">Страна *<select value={form.countryCode} onChange={(e) => updateForm("countryCode", e.target.value as FormState["countryCode"])} className={fieldClass}><option value="KG">KG</option><option value="KZ">KZ</option><option value="RU">RU</option></select></label>
                            <label className="block text-sm font-medium">Город *<input required value={form.city} onChange={(e) => updateForm("city", e.target.value)} className={fieldClass} /></label>
                        </div>
                        <label className="block text-sm font-medium">Адрес<input value={form.address} onChange={(e) => updateForm("address", e.target.value)} className={fieldClass} /></label>
                        <label className="block text-sm font-medium">Телефон<input value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} className={fieldClass} placeholder="+996..." /></label>
                        <label className="block text-sm font-medium">Услуги<input maxLength={300} value={form.servicesSummary} onChange={(e) => updateForm("servicesSummary", e.target.value)} className={fieldClass} placeholder="Стрижка · Борода · Укладка" /></label>
                        <label className="block text-sm font-medium">CRM branch_id<input type="number" min="1" value={form.branchId} onChange={(e) => updateForm("branchId", e.target.value)} className={fieldClass} placeholder="Оставьте пустым для unclaimed" /></label>
                        <label className="block text-sm font-medium">Онлайн-запись<select value={form.bookingMode} onChange={(e) => updateForm("bookingMode", e.target.value as CatalogBookingMode)} className={fieldClass}><option value="none">Нет</option><option value="hahazen">Через Hahazen</option><option value="external">Внешняя ссылка</option></select></label>
                        {form.bookingMode === "external" && <label className="block text-sm font-medium">Ссылка на внешнюю запись *<input required type="url" value={form.externalBookingUrl} onChange={(e) => updateForm("externalBookingUrl", e.target.value)} className={fieldClass} placeholder="https://..." /></label>}

                        {!editingProfile && !form.branchId.trim() && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-400/20 dark:bg-amber-400/5">
                                <label className="flex items-start gap-2 text-sm font-medium"><input type="checkbox" checked={form.consentConfirmed} onChange={(e) => updateForm("consentConfirmed", e.target.checked)} className="mt-1" />Согласие салона на публикацию получено</label>
                                {form.consentConfirmed && (
                                    <div className="mt-3 space-y-3">
                                        <label className="block text-xs font-medium">Дата согласия<input required type="date" value={form.consentDate} onChange={(e) => updateForm("consentDate", e.target.value)} className={fieldClass} /></label>
                                        <label className="block text-xs font-medium">Заметка<input value={form.consentNote} onChange={(e) => updateForm("consentNote", e.target.value)} className={fieldClass} placeholder="Согласие получено устно" /></label>
                                    </div>
                                )}
                            </div>
                        )}

                        <button disabled={isCreating} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60">
                            {isCreating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : editingProfile ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {isCreating ? (editingProfile ? "Сохранение..." : "Создание...") : editingProfile ? "Сохранить изменения" : "Создать черновик"}
                        </button>
                        {editingProfile && (
                            <button type="button" onClick={resetForm} className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
                                Отменить редактирование
                            </button>
                        )}
                    </form>
                </section>

                <section>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Карточки салонов</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-white/55">Загрузите фото и опубликуйте готовую карточку.</p>
                        </div>
                        <div className="flex gap-2">
                            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); void loadProfiles(e.target.value); }} className="catalog-admin-control rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[rgb(var(--card))]">
                                <option value="">Все статусы</option><option value="draft">Черновики</option><option value="published">Опубликованные</option><option value="hidden">Скрытые</option><option value="suspended">Приостановленные</option>
                            </select>
                            <button onClick={() => void loadProfiles()} aria-label="Обновить" className="catalog-admin-control rounded-xl border border-slate-200 bg-white p-2.5 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[rgb(var(--card))] dark:hover:bg-white/5"><RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /></button>
                        </div>
                    </div>

                    {(error || success) && (
                        <div className={`mt-4 whitespace-pre-line rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/5 dark:text-red-200" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/5 dark:text-emerald-200"}`}>{error || success}</div>
                    )}

                    <div className="mt-5 space-y-4">
                        {isLoading && profiles.length === 0 && <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-emerald-500" /></div>}
                        {!isLoading && profiles.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-white/[0.02]">Карточек пока нет. Создайте первый салон.</div>}
                        {profiles.map((profile) => {
                            const isPhotoLimitReached = profile.galleryUrls.length >= 7;

                            return (
                            <article key={profile.id} className="catalog-admin-surface rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))]">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="truncate text-lg font-bold">{profile.name}</h3>
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[profile.status] ?? statusClasses.hidden}`}>{statusLabels[profile.status] ?? profile.status}</span>
                                            {profile.isPartner && <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-400/10 dark:text-teal-200">Партнёр</span>}
                                        </div>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-white/55">{profile.city}{profile.address ? ` · ${profile.address}` : ""}</p>
                                        <p className="mt-2 text-sm">{profile.shortDescription || "Краткое описание не заполнено"}</p>
                                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-white/50">
                                            <span>ID: {profile.id}</span><span>Slug: {profile.slug || "создаётся автоматически"}</span><span>Фото: {profile.galleryUrls.length}/7</span><span>branch_id: {profile.branchId ?? "нет"}</span>
                                        </div>
                                    </div>
                                    {profile.status === "published" && profile.slug && <a href={buildPublicCatalogDetailUrl(profile.slug)} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">Проверить публичный API</a>}
                                </div>

                                {profile.galleryUrls.length > 0 && (
                                    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 dark:border-white/10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                        {profile.galleryUrls.map((url, index) => {
                                            const imageUrl = resolveCatalogAssetUrl(url);
                                            const deleteActionKey = `delete-image-${profile.id}-${url}`;

                                            return (
                                                <div key={url} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                                                    <div className="relative aspect-[4/3] bg-slate-200 dark:bg-white/10">
                                                        {imageUrl && (
                                                            // eslint-disable-next-line @next/next/no-img-element -- Admin thumbnails use raw API asset URLs to avoid optimizer cache/config issues.
                                                            <img
                                                                src={imageUrl}
                                                                alt={`${profile.name}: фото ${index + 1}`}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        )}
                                                        {index === 0 && (
                                                            <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white">
                                                                Обложка
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={activeAction !== null}
                                                        onClick={() => void deleteImage(profile, url)}
                                                        className="flex w-full items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-400/10"
                                                    >
                                                        {activeAction === deleteActionKey ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                        Удалить
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-white/10 xl:flex-row xl:items-center xl:justify-between">
                                    <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                                        <label className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium transition dark:border-white/10 ${
                                            isPhotoLimitReached
                                                ? "cursor-not-allowed opacity-50"
                                                : "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                                        }`}>
                                            <ImagePlus className="h-4 w-4" />{isPhotoLimitReached ? "Лимит 7 фото" : files[profile.id]?.name ?? "Выбрать фото"}
                                            <input disabled={isPhotoLimitReached} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => selectImage(profile.id, e.target.files?.[0] ?? null)} />
                                        </label>
                                        <button disabled={isPhotoLimitReached || !files[profile.id] || activeAction === `upload-${profile.id}`} onClick={() => void uploadImage(profile)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-slate-900">
                                            {activeAction === `upload-${profile.id}` && <LoaderCircle className="h-4 w-4 animate-spin" />}Загрузить
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button disabled={activeAction !== null} onClick={() => startEdit(profile)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"><Pencil className="h-4 w-4" />Редактировать</button>
                                        <button disabled={activeAction !== null} onClick={() => void runAction(`publish-${profile.id}`, () => publishAdminCatalogProfile(profile.id), `«${profile.name}» опубликован.`)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"><Send className="h-4 w-4" />Опубликовать</button>
                                        <button disabled={activeAction !== null} onClick={() => void runAction(`hide-${profile.id}`, () => hideAdminCatalogProfile(profile.id), `«${profile.name}» скрыт.`)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"><EyeOff className="h-4 w-4" />Скрыть</button>
                                        <button disabled={activeAction !== null} onClick={() => void runAction(`suspend-${profile.id}`, () => suspendAdminCatalogProfile(profile.id), `«${profile.name}» приостановлен.`)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-400/5"><ShieldAlert className="h-4 w-4" />Приостановить</button>
                                    </div>
                                </div>
                            </article>
                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
}
