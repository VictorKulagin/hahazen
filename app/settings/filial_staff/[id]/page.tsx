//staff/[id]/page.tsx
"use client";
import React, {useEffect, useState, useRef} from "react";
import {
    TrashIcon,
    PencilIcon, Bars3Icon // Для редактирования  // Для редактирования
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

import { UI_validatePhone, validateName } from '@/components/Validations';

import { CreateEmployeeModal } from "@/components/schedulePage/CreateEmployeeModal";
import { EditEmployeeModal } from "@/components/schedulePage/EditEmployeeModal";

import {useEmployeeServices, useSyncEmployeeServices} from "@/hooks/useServices";
import SidebarMenu from "@/components/SidebarMenu";
import Image from "next/image";
import Loader from "@/components/Loader";
import { authStorage } from "@/services/authStorage";

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
    // Элементы меню


    return (
        <div className="relative min-h-screen md:grid md:grid-cols-[30%_70%] lg:grid-cols-[20%_80%] bg-backgroundBlue">
            {/* Подложка для клика вне меню */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}


            {/* Меню */}
            <aside
                className={`bg-darkBlue text-white p-4 fixed z-20 h-full flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${
                    isMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >

                {/* Верх: логотип */}
                <div
                    className="border-b border-gray-400 p-2 flex items-center cursor-pointer"
                    onClick={toggleFilModal}
                >
                    <Image
                        src="/logo.png"
                        alt="Логотип"
                        width={32}
                        height={32}
                        className="mr-2"
                    />
                    <span className="text-sm font-medium truncate">
      {companiesData?.[0]?.name || "Компания не найдена"}
    </span>
                </div>
                {/* Меню */}
                <div className="flex-grow mt-4 overflow-y-auto">
                    <SidebarMenu
                        id={id}
                        companyName={companiesData?.[0]?.name}
                        userData={userData}
                        variant="desktop"
                        onLogout={handleLogout}
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
                        className="absolute left-0 top-0 h-full w-4/5 sm:w-2/3 bg-darkBlue transform translate-x-0 transition-transform duration-300"
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
                className="bg-backgroundBlue p-4 h-full md:h-auto"
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
                <div className="flex items-center bg-[#081b27] text-white p-3 rounded-md mb-4">
                    <span className="ml-auto font-semibold text-sm">
                        Сотрудники
                    </span>
                </div>

                {/* Кнопка "Добавить сотрудника" */}
                {authStorage.has("master:create") && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        + Добавить сотрудника
                    </button>
                )}
                {/* Таблица сотрудников */}
                <EmployeesTable
                    loading={loading}
                    error={error}
                    employees={employees}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                />



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
    return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6">
            <section className="bg-white text-black p-4 rounded shadow">
                <h2 className="text-lg font-semibold mb-2">Сотрудники</h2>

                <div className="overflow-auto">
                    {loading ? (
                        <div className="text-center text-gray-500">Загрузка...</div>
                    ) : error ? (
                        <div className="text-center text-red-500">Ошибка: {error}</div>
                    ) : employees.length === 0 ? (
                        <div className="text-center text-gray-500">Нет данных</div>
                    ) : (
                        <div className="md:overflow-x-visible overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
                                <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2 text-left">Имя</th>
                                    <th className="border p-2 text-left">Специализация</th>
                                    <th className="border p-2 text-left hidden sm:table-cell">Email</th>
                                    <th className="border p-2 text-left hidden xs:table-cell">Телефон</th>
                                    <th className="border p-2 text-left">Дата найма</th>
                                    {authStorage.has("master:update") && (
                                        <th className="border p-2 w-0.5"></th>
                                    )}
                                    {authStorage.has("master:delete") && (
                                        <th className="border p-2 w-0.5"></th>
                                    )}
                                </tr>
                                </thead>
                                <tbody>
                                {employees.map((employee) => (
                                    <tr key={employee.id} className="hover:bg-gray-50">
                                        <td className="border p-2">{employee.name}</td>
                                        <td className="border p-2">{employee.specialty}</td>
                                        <td className="border p-2 hidden sm:table-cell break-all">
                                            {employee.email}
                                        </td>
                                        <td className="border p-2 hidden xs:table-cell">{employee.phone}</td>
                                        <td className="border p-2">{employee.hire_date}</td>
                                        {authStorage.has("master:update") && (
                                            <td className="border p-2">
                                                <button
                                                    onClick={() => handleEdit(employee)}
                                                    className="block mx-auto"
                                                >
                                                    <PencilIcon className="h-5 w-5 text-blue-500 hover:text-blue-700"/>
                                                </button>
                                            </td>
                                        )}
                                        {authStorage.has("master:delete") && (
                                            <td className="border p-2">
                                                <button
                                                    onClick={() => handleDelete(employee.id)}
                                                    className="block mx-auto"
                                                >
                                                    <TrashIcon className="h-5 w-5 text-red-500 hover:text-red-700"/>
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
















