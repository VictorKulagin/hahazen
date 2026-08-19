"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Bars3Icon,
    CalendarDaysIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    PencilSquareIcon,
    PlusIcon,
    RectangleGroupIcon,
    TagIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { withAuth } from "@/hoc/withAuth";
import { useSidebarCollapsed } from "@/hoc/useSidebarCollapsed";
import SidebarMenu from "@/components/SidebarMenu";
import BranchInitial from "@/components/BranchInitial";
import BranchSwitcherModal from "@/components/BranchSwitcherModal";
import Loader from "@/components/Loader";
import AdminDialogPortal from "@/components/AdminDialogPortal";
import ResourceServicesDialog from "@/components/resources/ResourceServicesDialog";
import ResourceScheduleDialog from "@/components/resources/ResourceScheduleDialog";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cabinetDashboard } from "@/services/cabinetDashboard";
import { companiesList, Company } from "@/services/companiesList";
import { branchesList } from "@/services/branchesList";
import { authStorage } from "@/services/authStorage";
import { setApiContext } from "@/services/apiContext";
import { logoutApi } from "@/services/logoutApi";
import { getApiErrorMessage } from "@/services/apiError";
import {
    ResourceOnlineBooking,
    ResourceType,
    ScheduleResource,
} from "@/services/resourcesApi";
import {
    useCreateResource,
    useDeleteResource,
    useResources,
    useUpdateResource,
} from "@/hooks/useResources";
import { can } from "@/lib/permissions";

type BranchItem = {
    id: number;
    company_id?: number;
    companyId?: number;
    name: string;
    address?: string | null;
    phone?: string | null;
};

type DashboardUser = Awaited<ReturnType<typeof cabinetDashboard>>;

const RESOURCE_TYPES: Array<{ value: ResourceType; label: string }> = [
    { value: "box", label: "Бокс" },
    { value: "room", label: "Кабинет" },
    { value: "equipment", label: "Оборудование" },
    { value: "other", label: "Другое" },
];

const resourceTypeLabel = (type: ResourceType) =>
    RESOURCE_TYPES.find((item) => item.value === type)?.label ?? "Другое";

type ResourceDialogProps = {
    branchId: number;
    resource?: ScheduleResource;
    onClose: () => void;
};

function ResourceDialog({ branchId, resource, onClose }: ResourceDialogProps) {
    const createMutation = useCreateResource();
    const updateMutation = useUpdateResource();
    const [name, setName] = useState(resource?.name ?? "");
    const [type, setType] = useState<ResourceType>(resource?.type ?? "box");
    const [sortOrder, setSortOrder] = useState<number | string>(
        resource?.sort_order ?? 0
    );
    const [onlineBooking, setOnlineBooking] = useState(
        resource?.online_booking === 1
    );
    const [error, setError] = useState("");
    const isSaving = createMutation.isPending || updateMutation.isPending;

    const inputClass =
        "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white";

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedName = name.trim();
        const numericSortOrder = Number(sortOrder);

        if (!normalizedName) {
            setError("Укажите название ресурса.");
            return;
        }

        if (!Number.isInteger(numericSortOrder)) {
            setError("Порядок должен быть целым числом.");
            return;
        }

        setError("");

        try {
            const commonData = {
                name: normalizedName,
                type,
                sort_order: numericSortOrder,
                online_booking: (onlineBooking ? 1 : 0) as ResourceOnlineBooking,
            };

            if (resource) {
                await updateMutation.mutateAsync({
                    id: resource.id,
                    branchId,
                    data: commonData,
                });
            } else {
                await createMutation.mutateAsync({
                    branch_id: branchId,
                    ...commonData,
                });
            }

            onClose();
        } catch (err) {
            setError(getApiErrorMessage(err, "Не удалось сохранить ресурс."));
        }
    };

    return (
        <AdminDialogPortal onEscape={onClose}>
            <div className="admin-dialog-overlay fixed inset-0 z-50 flex justify-end bg-black/50">
                <form
                    onSubmit={handleSubmit}
                    className="admin-dialog-panel flex h-full w-full flex-col overflow-hidden bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-xl sm:w-[28rem] sm:rounded-l-2xl"
                >
                    <div className="flex items-center justify-between border-b border-gray-200 bg-white/95 px-5 py-4 dark:border-white/10 dark:bg-[rgb(var(--card))]/95">
                        <div>
                            <h2 className="text-lg font-semibold">
                                {resource ? "Редактировать ресурс" : "Создать ресурс"}
                            </h2>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Бокс, кабинет или оборудование филиала
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition hover:bg-gray-200 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
                            aria-label="Закрыть"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex-1 space-y-5 overflow-y-auto p-5">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">
                                Название *
                            </span>
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Например: Бокс №1"
                                maxLength={255}
                                className={inputClass}
                                autoFocus
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">Тип</span>
                            <select
                                value={type}
                                onChange={(event) =>
                                    setType(event.target.value as ResourceType)
                                }
                                className={inputClass}
                            >
                                {RESOURCE_TYPES.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">
                                Порядок отображения
                            </span>
                            <input
                                type="number"
                                step={1}
                                value={sortOrder}
                                onChange={(event) => setSortOrder(event.target.value)}
                                className={inputClass}
                            />
                        </label>

                        <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
                            <input
                                type="checkbox"
                                checked={onlineBooking}
                                onChange={(event) =>
                                    setOnlineBooking(event.target.checked)
                                }
                                className="mt-0.5 h-4 w-4"
                            />
                            <span>
                                <span className="block text-sm font-medium">
                                    Доступен для онлайн-записи
                                </span>
                                <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                                    Настройка сохраняется как задел; текущий публичный виджет ресурсы ещё не показывает.
                                </span>
                            </span>
                        </label>

                        {error && (
                            <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 bg-white/95 px-5 py-4 dark:border-white/10 dark:bg-[rgb(var(--card))]/95">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-medium transition hover:bg-gray-100 disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/5"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="h-11 rounded-xl bg-green-500 px-5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
                        >
                            {isSaving ? "Сохранение..." : "Сохранить"}
                        </button>
                    </div>
                </form>
            </div>
        </AdminDialogPortal>
    );
}

const Page: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const routeBranchId = Number(params?.id);
    const branchId = Number.isFinite(routeBranchId) ? routeBranchId : null;
    const { collapsed, setCollapsed } = useSidebarCollapsed();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [companiesData, setCompaniesData] = useState<Company[] | null>(null);
    const [branchesData, setBranchesData] = useState<BranchItem[] | null>(null);
    const [userData, setUserData] = useState<DashboardUser | null>(null);
    const [isContextReady, setIsContextReady] = useState(false);
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [pageError, setPageError] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingResource, setEditingResource] =
        useState<ScheduleResource | null>(null);
    const [servicesResource, setServicesResource] =
        useState<ScheduleResource | null>(null);
    const [scheduleResource, setScheduleResource] =
        useState<ScheduleResource | null>(null);

    const canView = can.resources.view();
    const resourcesQuery = useResources(
        branchId ?? undefined,
        isContextReady && canView
    );
    const deleteMutation = useDeleteResource();

    const branch = useMemo(
        () => branchesData?.find((item) => item.id === branchId) ?? null,
        [branchesData, branchId]
    );
    const company = companiesData?.[0] ?? null;

    useEffect(() => {
        const load = async () => {
            if (!branchId) {
                setPageError("Филиал не найден.");
                setIsLoadingPage(false);
                return;
            }

            setIsLoadingPage(true);
            setPageError("");

            try {
                const context = authStorage.getContext();
                const [user, companies] = await Promise.all([
                    cabinetDashboard(),
                    companiesList(),
                ]);
                const currentCompany = companies[0] ?? null;
                const branches = currentCompany
                    ? await branchesList(currentCompany.id)
                    : [];

                if (currentCompany?.id && context?.branch_id !== branchId) {
                    const updatedContext = await setApiContext({
                        company_id: currentCompany.id,
                        branch_id: branchId,
                    });
                    if (updatedContext) authStorage.setContext(updatedContext);
                }

                setUserData(user);
                setCompaniesData(companies);
                setBranchesData(branches);
                setIsContextReady(true);
            } catch (err) {
                setPageError(
                    getApiErrorMessage(err, "Не удалось загрузить страницу ресурсов.")
                );
            } finally {
                setIsLoadingPage(false);
            }
        };

        void load();
    }, [branchId]);

    const handleLogout = async () => {
        await logoutApi().catch(() => null);
        authStorage.clear();
        router.push("/signin");
    };

    const handleDelete = async (resource: ScheduleResource) => {
        if (!branchId || !window.confirm(`Удалить ресурс «${resource.name}»?`)) {
            return;
        }

        try {
            await deleteMutation.mutateAsync({ id: resource.id, branchId });
        } catch (err) {
            setPageError(getApiErrorMessage(err, "Не удалось удалить ресурс."));
        }
    };

    if (isLoadingPage) return <Loader type="default" visible />;

    if (pageError && !companiesData) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--background))] px-4 text-center text-red-500">
                {pageError}
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <div
                        className="absolute left-0 top-0 h-full w-4/5 bg-[rgb(var(--card))]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <SidebarMenu
                            id={branchId}
                            companyName={company?.name}
                            branchName={branch?.name}
                            userData={userData ?? undefined}
                            variant="mobile"
                            onLogout={handleLogout}
                            onBranchClick={() => {
                                setIsMenuOpen(false);
                                setIsBranchModalOpen(true);
                            }}
                            onNavigate={() => setIsMenuOpen(false)}
                        />
                    </div>
                </div>
            )}

            <aside
                className={`fixed z-10 hidden h-full flex-col border-r border-slate-200/70 bg-[rgb(var(--sidebar))] transition-all duration-300 dark:border-white/10 md:flex ${
                    collapsed ? "w-[96px]" : "w-[320px]"
                }`}
            >
                <div className="flex h-full flex-col p-4">
                    <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-200/70 pb-3 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => setIsBranchModalOpen(true)}
                            className={`flex min-w-0 items-center rounded-2xl p-1 text-left transition hover:bg-white/70 dark:hover:bg-white/[0.07] ${
                                collapsed ? "justify-center" : "flex-1"
                            }`}
                        >
                            <BranchInitial name={branch?.name} className={collapsed ? "" : "mr-3"} />
                            {!collapsed && (
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold">
                                        {branch?.name || "Филиал"}
                                    </span>
                                    <span className="block truncate text-xs text-gray-500">
                                        {company?.name || "Компания"}
                                    </span>
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setCollapsed((value) => !value)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 transition hover:bg-white/10"
                        >
                            {collapsed ? (
                                <ChevronDoubleRightIcon className="h-5 w-5" />
                            ) : (
                                <ChevronDoubleLeftIcon className="h-5 w-5" />
                            )}
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

            <main
                className={`min-h-screen px-3 py-4 transition-all duration-300 md:px-6 md:py-6 ${
                    collapsed ? "md:ml-[96px]" : "md:ml-[320px]"
                }`}
            >
                <BranchSwitcherModal
                    isOpen={isBranchModalOpen}
                    branches={branchesData}
                    company={company}
                    activeBranchId={branchId}
                    redirectPathPrefix="/settings/resources"
                    onClose={() => setIsBranchModalOpen(false)}
                    onBranchesChange={setBranchesData}
                />

                <div className="admin-page-header mb-6 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:shadow-none">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(true)}
                            className="shrink-0 rounded-md bg-green-500 p-2 text-white md:hidden"
                            aria-label="Открыть меню"
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>
                        <span className="hidden h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-200 sm:flex">
                            <RectangleGroupIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="truncate text-lg font-semibold">Ресурсы</h1>
                            <p className="mt-1 hidden text-sm text-gray-500 dark:text-gray-400 sm:block">
                                Боксы, кабинеты и оборудование филиала
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {can.resources.create() && (
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(true)}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-green-500 px-4 text-sm font-semibold text-white transition hover:bg-green-600"
                            >
                                <PlusIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Добавить ресурс</span>
                            </button>
                        )}
                        <ThemeToggle />
                    </div>
                </div>

                {!canView ? (
                    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                        У вас нет права на просмотр ресурсов.
                    </section>
                ) : resourcesQuery.isLoading ? (
                    <Loader type="default" visible />
                ) : resourcesQuery.error ? (
                    <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                        {getApiErrorMessage(
                            resourcesQuery.error,
                            "Не удалось загрузить ресурсы."
                        )}
                    </section>
                ) : (
                    <section className="admin-list-surface rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-white dark:shadow-none md:p-6">
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold">Ресурсы филиала</h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {resourcesQuery.data?.length ?? 0} шт.
                                </p>
                            </div>
                        </div>

                        {pageError && (
                            <div className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
                                {pageError}
                            </div>
                        )}

                        {resourcesQuery.data?.length === 0 ? (
                            <div className="admin-list-row rounded-2xl border border-dashed border-gray-300 px-5 py-12 text-center dark:border-white/15">
                                <RectangleGroupIcon className="mx-auto h-10 w-10 text-gray-300 dark:text-white/20" />
                                <h3 className="mt-3 font-semibold">Ресурсов пока нет</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
                                    Добавьте бокс или кабинет. Пока компания не переключит календарь на ресурсы, действующее расписание не изменится.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {resourcesQuery.data?.map((resource) => (
                                    <article
                                        key={resource.id}
                                        className="admin-list-row flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm transition-colors dark:border-white/10 dark:bg-white/5 dark:shadow-none sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-200">
                                                <RectangleGroupIcon className="h-5 w-5" />
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="truncate font-semibold">
                                                    {resource.name}
                                                </h3>
                                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <span>{resourceTypeLabel(resource.type)}</span>
                                                    <span>Порядок: {resource.sort_order}</span>
                                                    {resource.online_booking === 1 && (
                                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
                                                            Онлайн
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {can.resources.update() && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setScheduleResource(resource)
                                                    }
                                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium transition hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                                >
                                                    <CalendarDaysIcon className="h-4 w-4" />
                                                    График
                                                </button>
                                            )}
                                            {can.resources.update() && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setServicesResource(resource)
                                                    }
                                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium transition hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                                >
                                                    <TagIcon className="h-4 w-4" />
                                                    Услуги
                                                </button>
                                            )}
                                            {can.resources.update() && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingResource(resource)}
                                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium transition hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                                >
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                    Изменить
                                                </button>
                                            )}
                                            {can.resources.delete() && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(resource)}
                                                    disabled={deleteMutation.isPending}
                                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/30 dark:text-red-300"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                    Удалить
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </main>

            {branchId && isCreateOpen && (
                <ResourceDialog
                    branchId={branchId}
                    onClose={() => setIsCreateOpen(false)}
                />
            )}
            {branchId && editingResource && (
                <ResourceDialog
                    key={editingResource.id}
                    branchId={branchId}
                    resource={editingResource}
                    onClose={() => setEditingResource(null)}
                />
            )}
            {branchId && servicesResource && (
                <ResourceServicesDialog
                    key={servicesResource.id}
                    branchId={branchId}
                    resource={servicesResource}
                    onClose={() => setServicesResource(null)}
                />
            )}
            {scheduleResource && (
                <ResourceScheduleDialog
                    key={scheduleResource.id}
                    resource={scheduleResource}
                    onClose={() => setScheduleResource(null)}
                />
            )}
        </div>
    );
};

export default withAuth(Page);
