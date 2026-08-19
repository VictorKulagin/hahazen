// app\settings\service_categories\[id]\page
"use client";
import React, {useEffect, useState} from "react";

import {
    Bars3Icon, // Для редактирования
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    FolderPlusIcon,
    PlusIcon
} from "@heroicons/react/24/outline";
import {withAuth} from "@/hoc/withAuth";
import {useParams, useRouter} from "next/navigation";
import {branchesList} from "@/services/branchesList";
import {companiesList} from "@/services/companiesList";
import { ServiceGroup, Services } from "@/services/servicesApi";
import {cabinetDashboard} from "@/services/cabinetDashboard";
import SidebarMenu from "@/components/SidebarMenu";
import BranchSwitcherModal from "@/components/BranchSwitcherModal";
import SetupStepNav from "@/components/SetupStepNav";

import {
    useCreateServiceGroup,
    useDeleteService,
    useServiceGroups,
    useServices,
} from "@/hooks/useServices";

import { ServiceManager } from "@/components/schedulePage/ServiceManager";
import { ServiceManagerUpdateOne } from "@/components/schedulePage/ServiceManagerUpdateOne";


import {AxiosError} from "axios";
import BranchInitial from "@/components/BranchInitial";
import Loader from "@/components/Loader";

import { ChevronDown, Folder, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/lib/theme/theme.context";
import {useSidebarCollapsed} from "@/hoc/useSidebarCollapsed";
import { logoutApi } from "@/services/logoutApi";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/currency";
import AdminDialogPortal from "@/components/AdminDialogPortal";

const Page: React.FC = ( ) => {


    // Закрыть меню при клике на элемент
    const handleMenuItemClick = () => setIsMenuOpen(false);

    const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [userData, setUserData] = useState<any>(null);
    const [branchesData, setBranchesData] = useState<any>(null);

    const [companiesData, setCompaniesData] = useState<any>(null);
    const [isModalFilOpen, setIsModalFilOpen] = useState(false);
    const [isAccordionOpenEmployees, setIsAccordionOpenEmployees] = useState(false);
    const [isAccordionOpenClients, setIsAccordionOpenClients] = useState(false);

    const [isServiceManagerOpen, setIsServiceManagerOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Services | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    const [isNotFound, setIsNotFound] = useState(false);

    //const [collapsed, setCollapsed] = useState(false);
    const { collapsed, setCollapsed, isReady } = useSidebarCollapsed();

    const router = useRouter();

    const params = useParams();
    let idFromUrl: string | null = null;
    if (params && 'id' in params) {
        idFromUrl = params.id as string;
    }
    const parsedIdFromUrl = idFromUrl ? Number(idFromUrl) : NaN;
    const routeBranchId = Number.isFinite(parsedIdFromUrl) ? parsedIdFromUrl : null;
    const id = routeBranchId ?? branchesData?.[0]?.id ?? null;

    const { data: services = [], isLoading: servicesLoading, error: servicesError } = useServices(id ?? undefined);
    const {
        data: serviceGroups = [],
        isLoading: groupsLoading,
        error: groupsError,
    } = useServiceGroups(id ?? undefined);
    const { mutateAsync: deleteService } = useDeleteService(); // ✅ Добавлено

    const { theme } = useTheme();
    const currencyCode = companiesData?.[0]?.currency_code;


    const toggleFilModal = () => {
        setIsModalFilOpen((prev) => !prev);
    };
    const handleLogout = async () => {
        await logoutApi();
        localStorage.removeItem("access_token"); // Удаляем токен
        router.push("/signin"); // Перенаправляем на страницу логина
    };

    const globalLoading =
        isLoading ||
        !companiesData ||
        !branchesData ||
        !userData

    const globalError = error || !companiesData || !branchesData ? error : "";

    useEffect(() => {
        if (!companiesData || companiesData.length === 0) return;

        const fetchUserData = async () => {
            try {
                const companyId = companiesData[0]?.id;
                if (!companyId) {
                    setError("Идентификатор компании отсутствует.");
                    return;
                }

                const data = await branchesList(companyId);
                console.log("response.data setBranchesData", data);
                setBranchesData(data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(`Ошибка: ${err.message}`);
                } else {
                    setError("Неизвестная ошибка");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [companiesData]);


    useEffect(() => {
        const token = localStorage.getItem("access_token"); // Или брать из cookie

        if (!token) {
            setError("Токен не найден.");
            setIsLoading(false);
            return;
        }

        const fetchUserData = async () => {
            try {
                const data = await companiesList();
                console.log("response.data companiesList", data);
                setCompaniesData(data); // Сохраняем данные пользователя
            } catch (err: unknown) {
                if (err instanceof AxiosError) {
                    setError(`Ошибка: ${err.response?.data?.message || err.message || "Неизвестная ошибка"}`);
                } else if (err instanceof Error) {
                    setError(`Ошибка: ${err.message}`);
                } else {
                    setError("Неизвестная ошибка");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);


    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("access_token");
            if (!token) {
                setError("Токен не найден.");
                setIsLoading(false);
                return;
            }

            const fetchUserData = async () => {
                try {
                    const data = await cabinetDashboard();
                    console.log("Данные пользователя:", data);
                    setUserData(data);
                } catch (err: any) {
                    console.error("Ошибка API:", err);
                    setError(err.response?.data?.message || "Ошибка при загрузке данных.");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchUserData();
        }
    }, []);


    console.log("ID из данных филиала:", id);
    console.log("ID из URL:", idFromUrl);

    useEffect(() => {
        if (!idFromUrl || !branchesData) return;
        const branchExists = branchesData.some((branch: any) => String(branch.id) === String(idFromUrl));
        if (!branchExists) {
            console.warn(`Несоответствие ID: idFromUrl (${idFromUrl}) !== id (${id})`);
            setIsNotFound(true);
        } else {
            setIsNotFound(false);
        }
    }, [idFromUrl, branchesData, id]);

    useEffect(() => {
        // Изменяем заголовок страницы
        document.title = isNotFound ? "404 - Страница не найдена" : "Название вашей страницы";
    }, [isNotFound]);



    const handleDelete = async (id: number) => {
        if (!window.confirm("Удалить услугу?")) return;
        await deleteService(id); // React Query сам инвалидацией обновит список
    };


    if (isNotFound) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold mb-4">404 - Страница не найдена</h1>
                <p className="mb-2">Такой страницы нет</p>
                <p>Проверьте ссылку — возможно, в ней ошибка.</p>
            </div>
        );
    }


    // 🔹 Единая обработка загрузки
    if (globalLoading) {
        return (
            <div className="h-screen bg-backgroundBlue">
                <Loader type="default" visible={true} />
            </div>
        );
    }

    // 🔹 Единая обработка ошибок
    if (globalError) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-backgroundBlue text-red-400 text-center">
                <p className="text-xl font-semibold mb-2">Ошибка загрузки данных</p>
                <p>{globalError}</p>
                <button
                    onClick={() => location.reload()}
                    className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
                >
                    Перезагрузить страницу
                </button>
            </div>
        );
    }


    // Пример сотрудников
    const Memployees = [
        { id: 1, name: "Иван Иванов" },
        { id: 2, name: "Мария Петрова" },
        { id: 3, name: "Алексей Сидоров" },
    ];

    // Пример клиентов
    const clients = [
        { id: 1, name: "Клиентская база", url: `/clients/base/${id}` },
    ];


    return (
        <div
            className={`relative min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--foreground))]
  md:grid ${collapsed ? "md:grid-cols-[96px_1fr]" : "md:grid-cols-[320px_1fr]"}`}
        >
            {/* Подложка для клика вне меню */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}

            {/* Меню */}
            <aside
                className={`bg-[rgb(var(--sidebar))] text-[rgb(var(--sidebar-foreground))]
  fixed z-20 h-full flex flex-col transition-all duration-300
  md:relative md:translate-x-0
  ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
  ${collapsed ? "w-[96px] p-3" : "w-[320px] p-4"}`}
            >
                {/* Верх: логотип */}
                <div className="border-b border-gray-400 p-2 flex items-center justify-between">
                    <button
                        className="flex items-center min-w-0 flex-1"
                        onClick={toggleFilModal}
                    >
                        <BranchInitial
                            name={branchesData?.find((branch: any) => branch.id === id)?.name || branchesData?.[0]?.name}
                            className="mr-2"
                        />
                        {!collapsed && (
                            <div className="min-w-0 text-left">
                                <p className="truncate text-sm font-semibold">
                                    {branchesData?.find((branch: any) => branch.id === id)?.name ||
                                        branchesData?.[0]?.name ||
                                        "Филиал не найден"}
                                </p>
                                <p className="truncate text-xs text-[rgb(var(--muted-foreground))]">
                                    {companiesData?.[0]?.name || "Компания не найдена"}
                                </p>
                            </div>
                        )}
                    </button>

                    <button
                        onClick={() => setCollapsed((prev) => !prev)}
                        className="ml-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition"
                    >
                        {collapsed ? (
                            <ChevronDoubleRightIcon className="h-5 w-5" />
                        ) : (
                            <ChevronDoubleLeftIcon className="h-5 w-5" />
                        )}
                    </button>
                </div>
                {/* Меню */}
                <div className="flex-grow mt-4 overflow-y-auto overflow-x-hidden">
                    <SidebarMenu
                        id={id}
                        companyName={companiesData?.[0]?.name}
                        branchName={branchesData?.find((branch: any) => branch.id === id)?.name || branchesData?.[0]?.name}
                        userData={userData}
                        variant="desktop"
                        onLogout={handleLogout}
                        collapsed={collapsed}
                        setCollapsed={setCollapsed}
                    />
                </div>
            </aside>

            {/* Мобильный дровер */}
            {isMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 z-20 bg-black/50"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <div
                        className="absolute left-0 top-0 h-full w-4/5 sm:w-2/3 flex-shrink-0 bg-[rgb(var(--card))] text-[rgb(var(--foreground))] border border-[rgb(var(--border))] transform translate-x-0 transition-transform duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <SidebarMenu
                            id={id}
                            companyName={companiesData?.[0]?.name}
                            branchName={branchesData?.find((branch: any) => branch.id === id)?.name || branchesData?.[0]?.name}
                            userData={userData}
                            variant="mobile"
                            onLogout={handleLogout}
                            onBranchClick={() => {
                                setIsMenuOpen(false);
                                setIsModalFilOpen(true);
                            }}
                            onNavigate={() => setIsMenuOpen(false)} // закрываем при переходе
                        />
                    </div>
                </div>
            )}


            {/* Правая колонка (контент) */}
            <main
                className="min-h-screen bg-[rgb(var(--background))] px-3 py-4 md:px-6 md:py-6"
                onClick={() => isMenuOpen && setIsMenuOpen(false)}
            >


                <div>
                    {/* Модальное окно Филиалы */}
                    <BranchSwitcherModal
                        isOpen={isModalFilOpen}
                        branches={branchesData}
                        company={companiesData?.[0]}
                        activeBranchId={id}
                        redirectPathPrefix="/settings/service_categories"
                        onClose={toggleFilModal}
                        onBranchesChange={setBranchesData}
                    />

                    {false && isModalFilOpen && (
                        <div className="fixed inset-0 flex items-center justify-left bg-black bg-opacity-50 z-50"
                             onClick={toggleFilModal} // Закрытие окна при клике по фону
                        >
                            <div
                                className="z-50 bg-white p-6 rounded-lg shadow-lg text-black absolute top-[100px] w-full sm:w-11/12 md:w-1/3"
                                onClick={(e) => e.stopPropagation()} // Остановка всплытия события
                            >
                                <h2 className="text-lg font-bold mb-4">Филиалы</h2>
                                <p>{branchesData && branchesData.length > 0 ? branchesData[0]?.name : "Филиал не найдена"}</p>
                                <button
                                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    onClick={toggleFilModal}
                                >
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Заголовок */}
                <div className="admin-page-header mb-6 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:shadow-none">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-label="Открыть меню"
                                aria-expanded={isMenuOpen}
                                className="shrink-0 rounded-md bg-green-500 p-2 shadow transition hover:bg-green-600 md:hidden"
                            >
                                <Bars3Icon className="h-6 w-6 text-white" />
                            </button>

                            <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                                    Услуги
                                </h1>

                                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-2 text-xs font-medium text-gray-500 dark:bg-white/10 dark:text-gray-400">
                    {services.length}
                </span>
                            </div>

                            <p className="mt-1 hidden text-sm text-gray-500 dark:text-gray-400 md:block">
                                Управление услугами, длительностью и стоимостью
                            </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3">
                            {can.services.create() && (
                                <>
                                    <button
                                        onClick={() => setIsGroupManagerOpen(true)}
                                        className="hidden md:inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                    >
                                        <FolderPlusIcon className="h-4 w-4" />
                                        Добавить категорию
                                    </button>
                                    <button
                                        onClick={() => setIsServiceManagerOpen(true)}
                                        className="hidden md:inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-600"
                                    >
                                        + Добавить услугу
                                    </button>
                                </>
                            )}

                            <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400">
                                Тема: {theme}
            </span>

                            <ThemeToggle />
                        </div>
                    </div>
                </div>

                <SetupStepNav branchId={id} currentStep="services" />

                {/* Кнопка "Добавить услуги" */}
                {/*authStorage.has("master:create") && (
                    <div className="mb-6">
                        <button
                            onClick={() => setIsServiceManagerOpen(true)}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            + Добавить услуги
                        </button>
                    </div>
                )*/}
                {/* Таблица Услуг */}
                <ServicesTable
                    loading={servicesLoading}
                    services={services}
                    groups={serviceGroups}
                    groupsLoading={groupsLoading}
                    currencyCode={currencyCode}
                    error={[servicesError?.message, groupsError?.message].filter(Boolean).join(" ")}
                    handleDelete={handleDelete}
                    setSelectedService={setSelectedService}
                />

                {can.services.create() && (
                    <>
                        <button
                            onClick={() => setIsGroupManagerOpen(true)}
                            className="fixed bottom-5 right-20 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-lg transition hover:bg-gray-100 dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-white md:hidden"
                            aria-label="Добавить категорию"
                        >
                            <FolderPlusIcon className="h-6 w-6" />
                        </button>
                        <button
                            onClick={() => setIsServiceManagerOpen(true)}
                            className="fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:bg-green-600 md:hidden"
                            aria-label="Добавить услугу"
                        >
                            <PlusIcon className="h-6 w-6" />
                        </button>
                    </>
                )}

                {can.services.create() && isServiceManagerOpen && (
                    <ServiceManager
                        branchId={id}
                        onClose={() => setIsServiceManagerOpen(false)}
                        currencyCode={currencyCode}
                    />
                )}

                {can.services.create() && isGroupManagerOpen && id && (
                    <ServiceGroupManager
                        branchId={id}
                        onClose={() => setIsGroupManagerOpen(false)}
                    />
                )}

                {can.services.update() && selectedService && (
                    <ServiceManagerUpdateOne
                        key={selectedService.id}
                        service={selectedService}
                        onClose={() => setSelectedService(null)}
                        currencyCode={currencyCode}
                    />
                )}


            </main>
        </div>
    );
};

export default withAuth(Page);

const formatServicePrice = (
    service: Services,
    currencyCode?: string | null
) => {
    const priceFrom = formatMoney(service.base_price, currencyCode);

    return service.price_to == null
        ? priceFrom
        : `${priceFrom}–${formatMoney(service.price_to, currencyCode)}`;
};

const ServicesTable = ({
                           loading,
                           error,
                           services,
                           groups,
                           groupsLoading,
                           currencyCode,
                           handleDelete,
                           setSelectedService
                       }: {
    loading: boolean;
    error: string;
    services: Services[];
    groups: ServiceGroup[];
    groupsLoading: boolean;
    currencyCode?: string | null;
    handleDelete: (id: number) => void;
    setSelectedService: React.Dispatch<React.SetStateAction<Services | null>>;
}) => {
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const knownGroupIds = new Set(groups.map((group) => group.id));
    const fallbackGroupNames = Array.from(
        new Set(
            services
                .filter(
                    (service) =>
                        service.group_name?.trim() &&
                        (service.service_group_id == null || !knownGroupIds.has(service.service_group_id))
                )
                .map((service) => service.group_name!.trim())
        )
    );
    const groupedSections = [
        ...groups.map((group) => ({
            key: `group-${group.id}`,
            name: group.name,
            services: services.filter(
                (service) =>
                    service.service_group_id === group.id ||
                    (service.service_group_id == null && service.group_name === group.name)
            ),
        })),
        ...fallbackGroupNames
            .filter((name) => !groups.some((group) => group.name === name))
            .map((name) => ({
                key: `legacy-${name}`,
                name,
                services: services.filter((service) => service.group_name?.trim() === name),
            })),
    ];
    const groupedServiceIds = new Set(
        groupedSections.flatMap((section) => section.services.map((service) => service.id))
    );
    const ungroupedServices = services.filter((service) => !groupedServiceIds.has(service.id));

    const toggleGroup = (key: string) => {
        setCollapsedGroups((current) => {
            const next = new Set(current);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    return (
        <div className="grid grid-cols-1">
            <section className="admin-list-surface rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-white dark:shadow-none md:p-6">
                <div className="mb-5 flex items-center gap-3">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Услуги
                    </h2>

                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 px-2 text-xs font-medium text-gray-500 dark:bg-white/10 dark:text-gray-400">
        {services.length}
    </span>
                </div>

                <div className="overflow-auto">
                    {loading || groupsLoading ? (
                        <div className="text-center text-gray-500">Загрузка...</div>
                    ) : error ? (
                        <div className="text-center text-red-500">Ошибка: {error}</div>
                    ) : services.length === 0 && groups.length === 0 ? (
                        <div className="text-center text-gray-500">Нет данных</div>
                    ) : (
                        <div className="space-y-4">
                            {groupedSections.map((section) => (
                                <ServiceGroupSection
                                    key={section.key}
                                    sectionKey={section.key}
                                    name={section.name}
                                    services={section.services}
                                    collapsed={collapsedGroups.has(section.key)}
                                    currencyCode={currencyCode}
                                    onToggle={toggleGroup}
                                    onDelete={handleDelete}
                                    onEdit={setSelectedService}
                                />
                            ))}

                            {(ungroupedServices.length > 0 || groupedSections.length === 0) && (
                                <ServiceGroupSection
                                    sectionKey="ungrouped"
                                    name="Без категории"
                                    services={ungroupedServices}
                                    collapsed={collapsedGroups.has("ungrouped")}
                                    currencyCode={currencyCode}
                                    onToggle={toggleGroup}
                                    onDelete={handleDelete}
                                    onEdit={setSelectedService}
                                    ungrouped
                                />
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

const ServiceGroupSection = ({
    sectionKey,
    name,
    services,
    collapsed,
    currencyCode,
    onToggle,
    onDelete,
    onEdit,
    ungrouped = false,
}: {
    sectionKey: string;
    name: string;
    services: Services[];
    collapsed: boolean;
    currencyCode?: string | null;
    onToggle: (key: string) => void;
    onDelete: (id: number) => void;
    onEdit: (service: Services) => void;
    ungrouped?: boolean;
}) => (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.025]">
        <button
            type="button"
            onClick={() => onToggle(sectionKey)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-100 dark:hover:bg-white/5 md:px-5"
        >
            <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                    <Folder className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {name}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {services.length} {services.length === 1 ? "услуга" : "услуг"}
                    </span>
                </span>
            </span>
            <ChevronDown
                className={`h-5 w-5 shrink-0 text-gray-400 transition ${collapsed ? "-rotate-90" : ""}`}
            />
        </button>

        {!collapsed && (
            <div className="space-y-2 border-t border-gray-200 p-3 dark:border-white/10">
                {services.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-500 dark:border-white/10">
                        {ungrouped ? "Все услуги распределены по категориям" : "В категории пока нет услуг"}
                    </div>
                ) : (
                    services.map((service) => (
                        <ServiceRow
                            key={service.id}
                            service={service}
                            currencyCode={currencyCode}
                            onDelete={onDelete}
                            onEdit={onEdit}
                        />
                    ))
                )}
            </div>
        )}
    </div>
);

const ServiceRow = ({
    service,
    currencyCode,
    onDelete,
    onEdit,
}: {
    service: Services;
    currencyCode?: string | null;
    onDelete: (id: number) => void;
    onEdit: (service: Services) => void;
}) => (
    <div className="admin-list-row rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm transition-colors dark:border-white/10 dark:bg-white/5 dark:shadow-none md:px-5">
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(220px,1fr)_110px_140px_auto] lg:items-center lg:gap-6">
            <div className="min-w-0">
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                    {service.name}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm lg:hidden">
                    <span className="text-gray-500 dark:text-gray-400">
                        {service.duration_minutes} мин
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                        {formatServicePrice(service, currencyCode)}
                    </span>
                </div>
            </div>

            <div className="hidden text-sm text-gray-500 dark:text-gray-400 lg:block">
                {service.duration_minutes} мин
            </div>
            <div className="hidden text-sm font-semibold text-gray-900 dark:text-white lg:block">
                {formatServicePrice(service, currencyCode)}
            </div>
            <div className="flex items-center gap-2 self-start lg:self-center lg:justify-end">
                {can.services.update() && (
                    <button
                        onClick={() => onEdit(service)}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    >
                        Редактировать
                    </button>
                )}
                {can.services.delete() && (
                    <button
                        onClick={() => onDelete(service.id)}
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                    >
                        <span className="sm:hidden"><Trash2 size={15} /></span>
                        <span className="hidden sm:inline">Удалить</span>
                    </button>
                )}
            </div>
        </div>
    </div>
);

const ServiceGroupManager = ({
    branchId,
    onClose,
}: {
    branchId: number;
    onClose: () => void;
}) => {
    const [name, setName] = useState("");
    const [submitError, setSubmitError] = useState<string | null>(null);
    const { mutateAsync: createGroup, isPending } = useCreateServiceGroup();

    const handleSave = async () => {
        const normalizedName = name.trim();
        if (!normalizedName) {
            setSubmitError("Введите название категории.");
            return;
        }

        setSubmitError(null);
        try {
            await createGroup({ branch_id: branchId, name: normalizedName });
            onClose();
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Не удалось создать категорию.");
        }
    };

    return (
        <AdminDialogPortal onEscape={onClose}>
            <div className="admin-dialog-overlay fixed inset-0 z-50 flex justify-end bg-black/50">
                <div className="admin-dialog-panel flex h-full w-full flex-col overflow-hidden bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-lg sm:w-[28rem] sm:rounded-l-2xl">
                    <div className="border-b border-gray-200 bg-white/95 px-5 py-4 backdrop-blur-md dark:border-white/10 dark:bg-[rgb(var(--card))]/95">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                <h2 className="text-lg font-semibold">Создание категории</h2>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-gray-500 transition hover:bg-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-6">
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Название категории
                            </span>
                            <input
                                autoFocus
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") handleSave();
                                }}
                                placeholder="Например: Поклейка"
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-black outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                        </label>
                    </div>

                    <div className="border-t border-gray-200 bg-white/95 px-4 py-4 dark:border-white/10 dark:bg-[rgb(var(--card))]/95">
                        {submitError && (
                            <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                                {submitError}
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-11 rounded-xl border border-gray-300 bg-white px-5 text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/10"
                            >
                                Закрыть
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isPending}
                                className="h-11 rounded-xl bg-green-600 px-5 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isPending ? "Сохранение..." : "Сохранить"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminDialogPortal>
    );
};
