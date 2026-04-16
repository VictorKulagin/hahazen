//staff/[id]/page.tsx
"use client";
import React, {useEffect, useState, useRef} from "react";
import {
   Bars3Icon, // Для редактирования  // Для редактирования
   ChevronDoubleLeftIcon,
   ChevronDoubleRightIcon,
   PlusIcon
} from "@heroicons/react/24/outline";
import {withAuth} from "@/hoc/withAuth";
import {useParams, useRouter} from "next/navigation";
import {branchesList} from "@/services/branchesList";
import {companiesList} from "@/services/companiesList";
import { Employee, fetchEmployees } from "@/services/employeeApi";
import {cabinetDashboard} from "@/services/cabinetDashboard";
import { deleteEmployee } from "@/services/employeeApi";
import {AxiosError} from "axios";
import usePhoneInput from '@/hooks/usePhoneInput';
import { CreateEmployeeModal } from "@/components/schedulePage/CreateEmployeeModal";
import { EditEmployeeModal } from "@/components/schedulePage/EditEmployeeModal";
import {useEmployeeServices, useSyncEmployeeServices} from "@/hooks/useServices";
import SidebarMenu from "@/components/SidebarMenu";
import Image from "next/image";
import Loader from "@/components/Loader";
import { authStorage } from "@/services/authStorage";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/lib/theme/theme.context";

import { Trash2 } from "lucide-react";
import {useSidebarCollapsed} from "@/hoc/useSidebarCollapsed";

const Page: React.FC = ( ) => {


    // Закрыть меню при клике на элемент
    const handleMenuItemClick = () => setIsMenuOpen(false);


    // В компоненте мастера

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const nameInputRef = useRef<HTMLInputElement>(null);

    const [employeesList, setEmployeesList] = useState<Employee[]>([]);

    const [userData, setUserData] = useState<any>(null);
    const [branchesData, setBranchesData] = useState<any>(null);

    const [companiesData, setCompaniesData] = useState<any>(null);
    const [isModalFilOpen, setIsModalFilOpen] = useState(false);
    const [isAccordionOpenEmployees, setIsAccordionOpenEmployees] = useState(false);
    const [isAccordionOpenClients, setIsAccordionOpenClients] = useState(false);

    const [employees, setEmployees] = useState<Employee[]>([]);

    const { phone, handlePhoneChange } = usePhoneInput();

    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    const [isNotFound, setIsNotFound] = useState(false);
    //const [collapsed, setCollapsed] = useState(false);
    const { collapsed, setCollapsed, isReady } = useSidebarCollapsed();

    const { theme } = useTheme();

    const router = useRouter();

    const globalLoading =
        isLoading ||
        !companiesData ||
        !branchesData ||
        !userData ||
        employeesList.length === 0;

    const globalError = error || !companiesData || !branchesData ? error : "";



    const toggleFilModal = () => {
        setIsModalFilOpen((prev) => !prev);
    };
    const handleLogout = () => {
        localStorage.removeItem("access_token"); // Удаляем токен
        router.push("/signin"); // Перенаправляем на страницу логина
    };

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const employees = await fetchEmployees();
                setEmployeesList(employees);
            } catch (err) {
                setError("Ошибка при загрузке сотрудников.");
            } finally {
                setIsLoading(false);
            }
        };

        loadEmployees();
    }, []);

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


    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const employeesData = await fetchEmployees(); // Используем функцию из API
                setEmployees(employeesData); // Обновляем состояние сотрудников
            } catch (error: any) {
                setError(error.response?.data?.message || error.message); // Обработка ошибок
            } finally {
                setLoading(false); // Завершаем загрузку
            }
        };

        loadEmployees(); // Запуск функции загрузки сотрудников
    }, []);

    const id = branchesData?.[0]?.id ?? null;
    console.log(id + " ID из данных филиала ....");


    const params = useParams();
    //const idFromUrl = params.id as string || null;
    let idFromUrl: string | null = null;
    if (params && 'id' in params) {
        idFromUrl = params.id as string;
    }

    console.log("ID из данных филиала:", id);
    console.log("ID из URL:", idFromUrl);

    useEffect(() => {
        if (!idFromUrl || !id) return;
        if (String(idFromUrl) !== String(id)) {
            console.warn(`Несоответствие ID: idFromUrl (${idFromUrl}) !== id (${id})`);
            setIsNotFound(true);
        }
    }, [idFromUrl, id]);

    useEffect(() => {
        // Изменяем заголовок страницы
        document.title = isNotFound ? "404 - Страница не найдена" : "Название вашей страницы";
    }, [isNotFound]);


    // Получение услуг мастера
// Добавляем правильную инициализацию мутации
    const { mutate: syncServices } = useSyncEmployeeServices();

    // Синхронизация услуг
// Добавляем хук для услуг сотрудника
    const { data: currentEmployeeServices, isLoading: isEmployeeServicesLoading } = useEmployeeServices(
        editingEmployee?.id
    );



    const handleDelete = async (id: number) => {
        if (!window.confirm("Вы уверены, что хотите удалить сотрудника?")) {
            return;
        }

        try {
            await deleteEmployee(id);
            setEmployees((prev) => prev.filter((employee) => employee.id !== id));
        } catch (error) {
            console.error("Ошибка при удалении сотрудника:", error);
        }
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsEditModalOpen(true);
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



    // Пример клиентов
    const clients = [
        { id: 1, name: "Клиентская база", url: `/clients/base/${id}` },
    ];
//debugger;

    // Элементы меню

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
                        <Image
                            src="/logo.png"
                            alt="Логотип"
                            width={32}
                            height={32}
                            className="mr-2"
                        />
                        {!collapsed && (
                            <span className="text-sm font-medium truncate">
        {companiesData?.[0]?.name || "Компания не найдена"}
      </span>
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
                        userData={userData}
                        variant="desktop"
                        onLogout={handleLogout}
                        collapsed={collapsed}
                        setCollapsed={setCollapsed}
                    />
                </div>
            </aside>

            {/* ✅ Кнопка открытия меню (мобильная версия) */}
            {/* Мобильная кнопка */}
            <div className="md:hidden fixed top-3 left-3 z-30">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="bg-green-500 p-2 rounded-md shadow hover:bg-green-600 transition"
                >
                    <Bars3Icon className="h-6 w-6 text-white" />
                </button>
            </div>

            {/* Мобильное всплывающее меню */}
            {/* КНОПКА ОТКРЫТИЯ МЕНЮ — только мобильная */}
            <div className="md:hidden fixed top-3 left-3 z-30">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="bg-green-500 p-2 rounded-md shadow hover:bg-green-600 transition"
                >
                    <Bars3Icon className="h-6 w-6 text-white" />
                </button>
            </div>

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
                            userData={userData}
                            variant="mobile"
                            onLogout={handleLogout}
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
                    {isModalFilOpen && (
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
                <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:shadow-none">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                                    Сотрудники
                                </h1>

                                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-2 text-xs font-medium text-gray-500 dark:bg-white/10 dark:text-gray-400">
                    {employees.length}
                </span>
                            </div>

                            <p className="mt-1 hidden text-sm text-gray-500 dark:text-gray-400 md:block">
                                Управление сотрудниками, ролями и контактами
                            </p>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3">
                            {authStorage.has("master:create") && (
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="hidden md:inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-600"
                                >
                                    + Добавить сотрудника
                                </button>
                            )}

                            <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400">
                Тема: {theme}
            </span>

                            <ThemeToggle />
                        </div>
                    </div>
                </div>

                {/* Кнопка "Добавить сотрудника" */}
                {/*authStorage.has("master:create") && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        + Добавить сотрудника
                    </button>
                )*/}
                {/* Таблица сотрудников */}
                <EmployeesTable
                    loading={loading}
                    error={error}
                    employees={employees}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                />

                {authStorage.has("master:create") && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:bg-green-600 md:hidden"
                        aria-label="Добавить сотрудника"
                    >
                        <PlusIcon className="h-6 w-6" />
                    </button>
                )}

                {/* ✅ Новое окно — добавление сотрудника */}
                <CreateEmployeeModal
                    isOpen={isAddModalOpen}
                    branchId={id}
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={() => {
                        setIsAddModalOpen(false);
                        // После создания — обновим список
                        fetchEmployees().then(setEmployees);
                    }}
                />

                {/* ✅ Новое окно — редактирование сотрудника */}
                <EditEmployeeModal
                    isOpen={isEditModalOpen}
                    employee={editingEmployee}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={async (updated) => {
                        // локальное обновление списка
                        setEmployees((prev) =>
                            prev.map((emp) => (emp.id === updated.id ? updated : emp))
                        );
                        setIsEditModalOpen(false);
                    }}
                />


            </main>
        </div>
    );
};

export default withAuth(Page);


const EmployeesTable = ({
                            loading,
                            error,
                            employees,
                            handleEdit,
                            handleDelete,
                        }: {
    loading: boolean;
    error: string;
    employees: Employee[];
    handleEdit: (employee: Employee) => void;
    handleDelete: (id: number) => void;
}) => {

    const avatarColors = [
        "bg-indigo-500",
        "bg-pink-500",
        "bg-orange-500",
        "bg-green-500",
        "bg-blue-500",
        "bg-purple-500",
        "bg-emerald-500",
        "bg-rose-500",
    ];

    function getAvatarColor(name: string = "") {
        let hash = 0;

        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % avatarColors.length;
        return avatarColors[index];
    }

    return (
        <div className="grid grid-cols-1 gap-4 mt-6">
            <section className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-white dark:shadow-none md:p-6">
                <div className="mb-5 flex items-center gap-3">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Сотрудники
                    </h2>

                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 px-2 text-xs font-medium text-gray-500 dark:bg-white/10 dark:text-gray-400">
        {employees.length}
    </span>
                </div>

                {loading ? (
                    <div className="text-center text-gray-500">Загрузка...</div>
                ) : error ? (
                    <div className="text-center text-red-500">Ошибка: {error}</div>
                ) : employees.length === 0 ? (
                    <div className="text-center text-gray-500">Нет данных</div>
                ) : (
                    <div className="space-y-3 md:space-y-4">
                        {employees.map((employee) => (
                            <div
                                key={employee.id}
                                className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm transition-colors dark:border-white/10 dark:bg-white/5 dark:shadow-none md:px-5 md:py-5"
                            >
                                <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[56px_minmax(180px,1fr)_150px_220px_220px_auto] xl:items-center xl:gap-6">

                                    {/* Аватар */}
                                    <div className="flex items-center gap-3 xl:contents">
                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white ${getAvatarColor(employee.name)}`}
                                        >
                                            {employee.name?.[0] || "?"}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="truncate text-[22px] font-semibold leading-tight text-gray-900 dark:text-white md:text-xl xl:text-lg">
                                                {employee.name}
                                            </div>

                                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                {employee.specialty || "Роль не указана"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Дата найма */}
                                    <div className="hidden text-sm text-gray-500 dark:text-gray-400 xl:block">
                                        {employee.hire_date || "—"}
                                    </div>

                                    <div className="hidden truncate text-sm text-gray-500 dark:text-gray-400 xl:block">
                                        {employee.email || "—"}
                                    </div>

                                    <div className="hidden text-sm text-gray-500 dark:text-gray-400 xl:block">
                                        {employee.phone || "—"}
                                    </div>

                                    {/* Кнопки (пока без финальной стилизации) */}
                                    <div className="flex items-center gap-2 self-start xl:self-center xl:justify-end">
                                        {authStorage.has("master:update") && (
                                            <button
                                                onClick={() => handleEdit(employee)}
                                                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                                            >
                                                <span>Редактировать</span>
                                            </button>
                                        )}

                                        {authStorage.has("master:delete") && (
                                            <button
                                                onClick={() => handleDelete(employee.id)}
                                                className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60 sm:px-5"
                                            >
            <span className="sm:hidden">
                <Trash2 size={15} />
            </span>
                                                <span className="hidden sm:inline">Удалить</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
















