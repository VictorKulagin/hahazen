//app\schedule\[id]\page
"use client";
import React, { useState } from "react";
import { useEffect } from 'react';
import { withAuth } from "@/hoc/withAuth";
import Image from "next/image";
import {
    Bars3Icon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    CalendarIcon
} from "@heroicons/react/24/outline";
import {useRouter} from "next/navigation";
import {cabinetDashboard} from "@/services/cabinetDashboard";
import {companiesList} from "@/services/companiesList";
import {branchesList} from "@/services/branchesList";
import { Addbranches } from "@/services/branchesApi";
import { setApiContext } from "@/services/apiContext";
import { useParams } from 'next/navigation';
import {Employee, fetchEmployees} from "@/services/employeeApi";
import {
    groupAppointments,
    useBookedDays,
    useCreateAppointment
} from "@/hooks/useAppointments";

import CustomCalendarDesktop from "@/components/CustomCalendarDesktop";
import ScheduleModule, {toMins, toTime} from "@/components/ScheduleModule";
import {useCreateEmployee, useEmployees} from "@/hooks/useEmployees";
import { flattenGroupedAppointments } from '@/components/utils/appointments';
import { useAppointmentsByBranchAndDate } from '@/hooks/useAppointments';
import { AppointmentRequest, AppointmentResponse } from "@/types/appointments";
import { formatDateLocal, formatTimeLocal } from "@/components/utils/date";
import CreateEventModal from "@/components/schedulePage/CreateEventModal";
import { normalizeAppointments } from "@/components/utils/normalizeAppointments";
import UpdateEventModal from "@/components/schedulePage/UpdateEventModal";
import { useEmployeeSchedules } from "@/hooks/useEmployeeSchedules";
import { EditEmployeeModal } from "@/components/schedulePage/EditEmployeeModal";
import { useUpdateEmployee } from "@/hooks/useEmployees";
import { isWorkingSlot } from "@/components/utils/isWorkingSlot";
import {CreateMenuModal} from "@/components/schedulePage/CreateMenuModal";
import { ServiceManager} from "@/components/schedulePage/ServiceManager";
import {CreateEmployeeModal} from "@/components/schedulePage/CreateEmployeeModal";
import CustomCalendarMobile from "@/components/CustomCalendarMobile";
import SidebarMenu from "@/components/SidebarMenu";
import { CreateClientModal } from "@/components/schedulePage/CreateСlientModal";
import Loader from "@/components/Loader";
import PeriodStatsModule from "@/components/schedulePage/PeriodStatsModule";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/lib/theme/theme.context";

import {useSidebarCollapsed} from "@/hoc/useSidebarCollapsed";
import { logoutApi } from "@/services/logoutApi";
import { authStorage } from "@/services/authStorage";

type BranchItem = {
    id: number;
    company_id?: number;
    companyId?: number;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
};
export interface ScheduleEvent {
    id: string;
    start: string;
    end: string;
    text: string;
    master: number;
    client?: any;      // ✅ добавим, чтобы можно было прокидывать клиента
    services?: any[];   // ✅ добавим, чтобы прокидывать услуги
}

const getInitialUserData = () => {
    const user = authStorage.getUser();
    return user ? { ...user } : null;
};

const getInitialCompaniesData = () => {
    const context = authStorage.getContext();
    if (!context?.company_id) return null;

    return [
        {
            id: context.company_id,
            name: context.company_name || "Компания",
        },
    ];
};

const getInitialBranchesData = () => {
    const context = authStorage.getContext();
    if (!context?.branch_id) return null;

    return [
        {
            id: context.branch_id,
            company_id: context.company_id,
            companyId: context.company_id,
            name: context.branch_name || "Филиал",
        },
    ];
};

const getInitialEmployeesList = (): Employee[] => {
    const currentEmployee = authStorage.getEmployee();
    const currentUser = authStorage.getUser();

    if (!currentEmployee?.id) return [];

    return [
        {
            id: currentEmployee.id,
            name: currentUser?.name || "Сотрудник",
            specialty: currentEmployee.role || "master",
            lvl: null,
            hire_date: "",
            branch_id: currentEmployee.branch_id,
            online_booking: 0,
            description: null,
            email: currentUser?.email ?? null,
            gender: null,
            last_name: null,
            patronymic: null,
            phone: null,
            photo: null,
            role: currentEmployee.role || "master",
        },
    ];
};

const hasInitialScheduleData = () =>
    Boolean(
        authStorage.getToken() &&
        authStorage.getUser() &&
        authStorage.getContext()?.branch_id,
    );

const Page: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAccordionOpenEmployees, setIsAccordionOpenEmployees] = useState(false);
    const [isAccordionOpenClients, setIsAccordionOpenClients] = useState(false);

    const [employeesList, setEmployeesList] = useState<Employee[]>(getInitialEmployeesList);

    const [userData, setUserData] = useState<any>(getInitialUserData);
    const [branchesData, setBranchesData] = useState<any>(getInitialBranchesData);


    const [companiesData, setCompaniesData] = useState<any>(getInitialCompaniesData);
    const [isModalFilOpen, setIsModalFilOpen] = useState(false);
    const [branchForm, setBranchForm] = useState({
        name: "",
        address: "",
        phone: "",
        email: "",
    });
    const [isCreatingBranch, setIsCreatingBranch] = useState(false);
    const [isSwitchingBranch, setIsSwitchingBranch] = useState<number | null>(null);
    const [branchModalError, setBranchModalError] = useState("");
    const [branchModalSuccess, setBranchModalSuccess] = useState("");
    //const [editingEvent, setEditingEvent] = useState(null);

    const [isLoading, setIsLoading] = useState(!hasInitialScheduleData());
    const [error, setError] = useState<string>("");
    const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
    const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    //const [collapsed, setCollapsed] = useState(false);
    const { collapsed, setCollapsed, isReady } = useSidebarCollapsed();

    const { theme } = useTheme();

    // const { employees } = useEmployees();

    const router = useRouter();

    const toggleFilModal = () => {
        setIsModalFilOpen((prev) => !prev);
    };
    const handleLogout = async () => {
        await logoutApi();
        localStorage.removeItem("access_token"); // Удаляем токен
        router.push("/signin"); // Перенаправляем на страницу логина
    };

    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [daysWithAppointments, setDaysWithAppointments] = useState<number[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
    const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [scheduleMasterSearch, setScheduleMasterSearch] = useState("");
    const [scheduleSelectedMaster, setScheduleSelectedMaster] = useState<number | "all">("all");

    const globalLoading =
        isLoading ||
        !companiesData ||
        !branchesData ||
        !userData ||
        employeesList.length === 0;

    const globalError = error || !companiesData || !branchesData ? error : "";

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
                const currentBranchId = authStorage.getContext()?.branch_id;
                setBranchesData(
                    currentBranchId
                        ? [
                            ...data.filter((branch) => branch.id === currentBranchId),
                            ...data.filter((branch) => branch.id !== currentBranchId),
                        ]
                        : data,
                );
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

    const refreshBranches = async () => {
        const companyId = companiesData?.[0]?.id;
        if (!companyId) {
            throw new Error("Идентификатор компании отсутствует.");
        }

        const data = await branchesList(companyId);
        setBranchesData(data);
        return data;
    };

    const handleBranchSwitch = async (branch: BranchItem) => {
        const companyId = companiesData?.[0]?.id ?? branch.company_id ?? branch.companyId;
        if (!companyId) {
            setBranchModalError("Идентификатор компании отсутствует.");
            return;
        }

        setIsSwitchingBranch(branch.id);
        setBranchModalError("");
        setBranchModalSuccess("");

        try {
            const context = await setApiContext({
                company_id: companyId,
                branch_id: branch.id,
            });

            authStorage.setContext(context ?? {
                company_id: companyId,
                branch_id: branch.id,
                company_name: companiesData?.[0]?.name ?? null,
                branch_name: branch.name,
            });

            setBranchesData((prev: BranchItem[] | null) => {
                const list = prev ?? [];
                const selected = list.find((item) => item.id === branch.id) ?? branch;
                return [selected, ...list.filter((item) => item.id !== branch.id)];
            });
            setIsModalFilOpen(false);
            router.push(`/schedule/${branch.id}`);
        } catch (err: any) {
            setBranchModalError(err?.response?.data?.message || err?.message || "Не удалось переключить филиал.");
        } finally {
            setIsSwitchingBranch(null);
        }
    };

    const handleBranchFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setBranchForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateBranch = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const companyId = companiesData?.[0]?.id;
        if (!companyId) {
            setBranchModalError("Идентификатор компании отсутствует.");
            return;
        }

        setIsCreatingBranch(true);
        setBranchModalError("");
        setBranchModalSuccess("");

        try {
            const createdBranch = await Addbranches({
                company_id: companyId,
                name: branchForm.name.trim(),
                address: branchForm.address.trim() || null,
                phone: branchForm.phone.trim() || null,
                email: branchForm.email.trim() || null,
                timezone: "Asia/Almaty",
            });

            setBranchForm({ name: "", address: "", phone: "", email: "" });
            setBranchModalSuccess("Филиал создан.");
            await refreshBranches().catch(() => null);
            await handleBranchSwitch({
                ...createdBranch,
                company_id: createdBranch.company_id ?? companyId,
            });
        } catch (err: any) {
            setBranchModalError(err?.response?.data?.message || err?.message || "Не удалось создать филиал.");
        } finally {
            setIsCreatingBranch(false);
        }
    };


    useEffect(() => {
        const token = localStorage.getItem("access_token"); // Или брать из cookie

        if (!token) {
            setError("Неизвестная ошибка");
            setIsLoading(false);
            return;
        }

        const fetchUserData = async () => {
            try {
                const data = await companiesList();
                console.log("response.data companiesList", data);
                setCompaniesData(data); // РЎРѕС…СЂР°РЅСЏРµРј РґР°РЅРЅС‹Рµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(`РћС€РёР±РєР°: ${err.message}`);
                } else {
                    setError("РќРµРёР·РІРµСЃС‚РЅР°СЏ РѕС€РёР±РєР°");
                }
            }finally {
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
                    console.error("РћС€РёР±РєР° API:", err);
                    setError(err.response?.data?.message || "Ошибка при загрузке данных.");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchUserData();
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(t);
    }, []);


    const id = branchesData?.[0]?.id ?? null;
    console.log("ID из данных PAGE:", id);
    const params = useParams();
    //const idFromUrl = params.id as string || null;
    let idFromUrl: string | null = null;
    if (params && 'id' in params) {
        idFromUrl = params.id as string;
    }


    console.log("ID из данных филиала:", id);
    console.log("ID из URL:", idFromUrl);

    const { mutateAsync: updateEmployeeMutate } = useUpdateEmployee();

    const { data: bookedDaysData, error: bookedDaysError, isLoading: isBookedDaysLoading } = useBookedDays(year, month, id);

    // Получаем мастеров из API (сотрудников для филиала)
    const { data: employees, isLoading: employeesLoading, error: employeesError } = useEmployees(id);

    // Средствами useAppointments подгружай события выбранного дня:
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());



    const startDate = formatDateLocal(selectedDate);
    const endDate = formatDateLocal(selectedDate);

    //const { data: schedules = [] } = useEmployeeSchedules(id, undefined, startDate, endDate);
    const { data: schedules = [] } = useEmployeeSchedules(
        id,           // branchId
        undefined,    // employeeId — не указываем, чтобы получить графики для всех
        startDate,
        endDate
    );

    const { mutateAsync: createEmployeeMutate } = useCreateEmployee();

    const { data: appointments, isLoading: isAppointmentsLoading, error: appointmentsError } = useAppointmentsByBranchAndDate(id, selectedDate);
    const normalizedAppointments =
        employees && employees.length > 0 && appointments
            ? normalizeAppointments(appointments, employees)
            : [];
    const groupedAppointments = groupAppointments(appointments ?? []);
    const scheduleEvents = flattenGroupedAppointments(groupedAppointments, employees ?? []);
    const { mutateAsync: createAppointmentMutate, isPending: isCreating } = useCreateAppointment();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedMasterIndex, setSelectedMasterIndex] = useState<number | null>(null);
    const [selectedStartMinutes, setSelectedStartMinutes] = useState<number | null>(null);
    const [isOutsideSchedule, setIsOutsideSchedule] = useState(false); // 👈 добавляем!

    const [editingEvent, setEditingEvent] = useState<{
        id: number;
        date: string;                             // ⬅ добавили
        timeStart: string;
        timeEnd: string;
        employeeId: number;
        services: { id: number; qty: number }[];
        client?: { id: number; name: string; last_name?: string; phone?: string };

        cost?: number;
        payment_status?: "unpaid" | "paid" | "partial";
        payment_method?: "cash" | "card" | "transfer" | null;
        visit_status?: "expected" | "arrived" | "no_show";
    } | null>(null);


    const handleOpenCreateModal = (startMinutes: number, masterIndex: number) => {
        const emp = employees[masterIndex];
        const timeStr = formatTimeLocal(startMinutes);
        const working = emp
            ? isWorkingSlot(emp.id, timeStr, selectedDate, schedules)
            : true;

        setSelectedStartMinutes(startMinutes);
        setSelectedMasterIndex(masterIndex);

        setIsCreateModalOpen(true);
        setIsOutsideSchedule(!working); // 👈 добавляем этот стейт
    };

    const handleEventClick = (ev: ScheduleEvent) => {
        console.log("🖱 handleEventClick вызван для события:", ev);

        // 1. Находим сотрудника по индексу колонки
        const emp = employees?.[ev.master];
        if (!emp) {
            console.warn("❗ Нет сотрудника по индексу колонки:", ev.master, employees);
            return;
        }
        console.log("👤 Найден сотрудник:", emp);

        // 2. Находим исходную запись в appointments (чтобы достать клиента и услуги)
        const src = (appointments ?? []).find(a => a.id === Number(ev.id));
        console.log("📦 Исходная запись из appointments:", src);


        // 3. Преобразуем услуги в формат { id, qty }
        const initialSelected = (src?.services ?? []).map(s => ({
            id: (s as any).service_id ?? (s as any).id, // вњ… РїРѕРґРґРµСЂР¶РєР° Рё service_id, Рё id РЅР° РІСЃСЏРєРёР№ СЃР»СѓС‡Р°Р№
            qty: (s as any).qty ?? 1,
        }));
        console.log("🎯 Преобразованные услуги (initialSelected):", initialSelected);

        // пробуем взять из datetime_start или appointment_datetime, если нет — из выбранной даты
        const dateFromSrc =
            (src as any)?.datetime_start?.slice(0, 10) ??
            (src as any)?.appointment_datetime?.slice(0, 10) ??
            formatDateLocal(selectedDate);

        // 4. Устанавливаем состояние для UpdateEventModal
        const eventPayload = {
            id: Number(ev.id),
            date: dateFromSrc,              // ⬅ вот она, корректная дата записи
            timeStart: ev.start,
            timeEnd: ev.end,
            employeeId: emp.id,
            services: initialSelected,
            client: src?.client
                ? {
                    id: src.client.id,
                    name: src.client.name,
                    last_name: src.client.last_name,
                    phone: src.client.phone,
                }
                : undefined,

            cost: src?.cost ?? 0,
            payment_status: src?.payment_status ?? "unpaid",
            payment_method: src?.payment_method ?? null,
            visit_status: src?.visit_status ?? "expected",
        };

        setEditingEvent(eventPayload);
    };


    const handleSaveAppointment = async (data: {
        name: string;
        lastName: string;
        phone: string;
        clientId?: number;
        services: { id: number; qty: number }[];
        timeStart: string;
        timeEnd: string;
        cost: number;
        paymentStatus: "unpaid" | "paid" | "partial";
        paymentMethod: "cash" | "card" | "transfer" | null;
        visitStatus: "expected" | "arrived" | "no_show";
    }) => {
        if (!id || selectedMasterIndex === null) return;

        const payload: AppointmentRequest = {
            client_id: data.clientId,
            employee_id: employees[selectedMasterIndex].id,
            branch_id: id,
            date: formatDateLocal(selectedDate),
            time_start: data.timeStart,
            time_end: data.timeEnd,

            cost: data.cost ?? 0,
            payment_status: data.paymentStatus ?? "unpaid",
            payment_method: data.paymentMethod ?? null,
            visit_status: data.visitStatus ?? "expected",

            services: data.services.map(s => ({
                service_id: s.id,
                qty: s.qty,
            })),
        };

        try {
            await createAppointmentMutate(payload);
            setIsCreateModalOpen(false);
            setSelectedMasterIndex(null);
            setSelectedStartMinutes(null);
        } catch (err: any) {
            console.error("Ошибка создания записи:", err);
            alert(err?.message || "Не удалось создать запись");
        }
    };


    const handleSaveEmployee = async (updatedEmployee: any) => {
        try {
            await updateEmployeeMutate(updatedEmployee);
        } catch (err) {
            console.error("Ошибка при сохранении сотрудника:", err);
            alert("Не удалось обновить данные сотрудника");
        }
    };


    const handleMasterClick = (employee: Employee) => {
        console.log("🔧 Редактируем сотрудника:", employee);
        setSelectedEmployee(employee);
    };


    const [isNotFound, setIsNotFound] = useState(false);
    useEffect(() => {
        if (!idFromUrl || !id) return;
        if (String(idFromUrl) !== String(id)) {
            console.warn(`Несоответствие ID: idFromUrl (${idFromUrl}) !== id (${id})`);
            setIsNotFound(true);
        }
    }, [idFromUrl, id]);

    useEffect(() => {
        // Изменяем заголовок страницы
        document.title = isNotFound ?  "404 - Страница не найдена" : "Название вашей страницы";
    }, [isNotFound]);

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
        { id: 1, name: "РљР»РёРµРЅС‚СЃРєР°СЏ Р±Р°Р·Р°", url: `/clients/base/${id}` },
    ];



    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(y => y - 1);
        } else {
            setMonth(m => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(y => y + 1);
        } else {
            setMonth(m => m + 1);
        }
    };

    const handleDateSelect = (date: Date) => {
        //alert(`Выбрана дата: ${date.toLocaleDateString()}`);
        setSelectedDate(date);
    };

    if (isLoading) return <p>Р—Р°РіСЂСѓР·РєР° СЃРѕС‚СЂСѓРґРЅРёРєРѕРІ...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

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

            {/* Левая колонка (меню + календарь) */}
            <aside
                className={`relative hidden md:flex overflow-visible bg-[rgb(var(--sidebar))] text-[rgb(var(--sidebar-foreground))]
  fixed z-20 h-full flex flex-col transition-all duration-300
  md:relative md:translate-x-0
  ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
  ${collapsed ? "w-[96px] p-3" : "w-[320px] p-4"}`}
            >
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="sidebar-ambient sidebar-ambient-1" />
                    <div className="sidebar-ambient sidebar-ambient-2" />
                </div>

                <div className="relative z-10 flex h-full flex-col">
                    {isCalendarOpen && (
                        <div className="absolute left-full top-16 ml-3 z-50 w-[320px]">
                            <div
                                className="bg-[rgb(var(--card))] p-4 rounded-2xl border border-[rgb(var(--border))] shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <CustomCalendarDesktop
                                    year={year}
                                    month={month}
                                    daysWithAppointments={bookedDaysData?.days ?? []}
                                    onDateSelect={(date) => {
                                        handleDateSelect(date);
                                        setIsCalendarOpen(false);
                                    }}
                                    onPrevMonth={handlePrevMonth}
                                    onNextMonth={handleNextMonth}
                                />
                            </div>
                        </div>
                    )}

                    {/* Верх: логотип */}
                    <div className="border-b border-gray-400 p-2 flex items-center justify-between">
                        <button
                            className="flex items-center min-w-0 flex-1"
                            onClick={toggleFilModal}
                        >
                            <Image
                                src="/logo.png"
                                alt="Р›РѕРіРѕС‚РёРї"
                                width={32}
                                height={32}
                                className="mr-2"
                            />
                            {!collapsed && (
                                <span className="text-sm font-medium truncate">
                        {companiesData?.[0]?.name || "РљРѕРјРїР°РЅРёСЏ РЅРµ РЅР°Р№РґРµРЅР°"}
                    </span>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setCollapsed((prev) => {
                                    const next = !prev;
                                    if (!next) setIsCalendarOpen(false);
                                    return next;
                                });
                            }}
                            className="ml-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition"
                        >
                            {collapsed ? (
                                <ChevronDoubleRightIcon className="h-5 w-5" />
                            ) : (
                                <ChevronDoubleLeftIcon className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {collapsed ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsCalendarOpen((prev) => !prev);
                            }}
                            className="flex items-center justify-center w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 transition"
                        >
                            <CalendarIcon className="w-6 h-6" />
                        </button>
                    ) : (
                        <div className="hidden md:block mt-4 rounded-lg p-2 shadow-inner bg-[rgb(var(--card))] border border-[rgb(var(--border))]">
                            <CustomCalendarDesktop
                                year={year}
                                month={month}
                                daysWithAppointments={bookedDaysData?.days ?? []}
                                onDateSelect={handleDateSelect}
                                onPrevMonth={handlePrevMonth}
                                onNextMonth={handleNextMonth}
                            />
                        </div>
                    )}

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
                </div>
            </aside>



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
                //onClick={() => isMenuOpen && setIsMenuOpen(false)}
                onClick={() => {
                    if (isMenuOpen) setIsMenuOpen(false);
                    if (isCalendarOpen) setIsCalendarOpen(false);
                }}
            >
                <div>
                    {/* Модальное окно Филиалы */}
                    {isModalFilOpen && (
                        <div className="fixed inset-0 flex items-center justify-left bg-black bg-opacity-50 z-50"
                             onClick={toggleFilModal} // Закрытие окна при клике по фону
                        >
                            <div className="z-50 max-h-[calc(100vh-120px)] overflow-y-auto bg-white p-6 rounded-lg shadow-lg text-black absolute top-[100px] w-full sm:w-11/12 md:w-[520px] dark:bg-[rgb(var(--card))] dark:text-white"
                                 onClick={(e) => e.stopPropagation()} // Остановка всплытия события
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold">Филиалы</h2>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Выберите активный филиал или добавьте новый.
                                        </p>
                                    </div>
                                    <button
                                        className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                                        onClick={toggleFilModal}
                                    >
                                        Закрыть
                                    </button>
                                </div>

                                {branchModalError && (
                                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                                        {branchModalError}
                                    </div>
                                )}

                                {branchModalSuccess && (
                                    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
                                        {branchModalSuccess}
                                    </div>
                                )}

                                <div className="mt-5 space-y-3">
                                    {branchesData && branchesData.length > 0 ? (
                                        branchesData.map((branch: BranchItem) => {
                                            const isActive = branch.id === id;

                                            return (
                                                <div
                                                    key={branch.id}
                                                    className={`rounded-xl border p-4 transition ${
                                                        isActive
                                                            ? "border-green-500 bg-green-50 dark:border-green-400/60 dark:bg-green-500/10"
                                                            : "border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                                    }`}
                                                >
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="truncate font-semibold">{branch.name}</p>
                                                                {isActive && (
                                                                    <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                                                                        Активный
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {branch.address && (
                                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                    {branch.address}
                                                                </p>
                                                            )}
                                                            {branch.phone && (
                                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                    {branch.phone}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            disabled={isActive || isSwitchingBranch === branch.id}
                                                            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 dark:disabled:bg-white/10 dark:disabled:text-gray-400"
                                                            onClick={() => handleBranchSwitch(branch)}
                                                        >
                                                            {isSwitchingBranch === branch.id ? "Переключение..." : isActive ? "Выбран" : "Выбрать"}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
                                            Филиал не найден
                                        </p>
                                    )}
                                </div>

                                <form onSubmit={handleCreateBranch} className="mt-6 border-t border-gray-200 pt-5 dark:border-white/10">
                                    <h3 className="text-base font-semibold">Добавить филиал</h3>
                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <label className="sm:col-span-2">
                                            <span className="mb-1.5 block text-sm text-gray-600 dark:text-gray-300">Название</span>
                                            <input
                                                name="name"
                                                value={branchForm.name}
                                                onChange={handleBranchFormChange}
                                                required
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                                placeholder="Название филиала"
                                            />
                                        </label>
                                        <label className="sm:col-span-2">
                                            <span className="mb-1.5 block text-sm text-gray-600 dark:text-gray-300">Адрес</span>
                                            <input
                                                name="address"
                                                value={branchForm.address}
                                                onChange={handleBranchFormChange}
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                                placeholder="Адрес филиала"
                                            />
                                        </label>
                                        <label>
                                            <span className="mb-1.5 block text-sm text-gray-600 dark:text-gray-300">Телефон</span>
                                            <input
                                                name="phone"
                                                value={branchForm.phone}
                                                onChange={handleBranchFormChange}
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                                placeholder="+7..."
                                            />
                                        </label>
                                        <label>
                                            <span className="mb-1.5 block text-sm text-gray-600 dark:text-gray-300">Email</span>
                                            <input
                                                name="email"
                                                type="email"
                                                value={branchForm.email}
                                                onChange={handleBranchFormChange}
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                                placeholder="branch@example.com"
                                            />
                                        </label>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isCreatingBranch || !branchForm.name.trim()}
                                        className="mt-4 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {isCreatingBranch ? "Создание..." : "Добавить филиал"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>


                {/* Заголовок */}
                <div
                    className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:shadow-none lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                                Расписание
                            </h1>
                        </div>

                        <p className="mt-1 hidden text-sm text-gray-500 dark:text-gray-400 md:block">
                            Управление записями, мастерами и рабочими слотами
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:max-w-3xl">
                        <input
                            type="search"
                            value={scheduleMasterSearch}
                            onChange={(event) => setScheduleMasterSearch(event.target.value)}
                            placeholder="Поиск мастера"
                            className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-[#1f2937] dark:text-white dark:placeholder:text-white/40"
                        />
                        <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400">
                            Тема: {theme}
                        </span>
                        <ThemeToggle />
                    </div>
                </div>

                {/* Календарь — показывать только на мобильных */}
                <div className="block md:hidden w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[rgb(var(--card))] shadow-sm p-3 mb-4">
                    <CustomCalendarMobile
                        year={year}
                        month={month}
                        daysWithAppointments={bookedDaysData?.days ?? []}
                        onDateSelect={handleDateSelect}
                        onPrevMonth={handlePrevMonth}
                        onNextMonth={handleNextMonth}
                    />
                </div>


                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Правая колонка: 80% */}
                    <section className="col-span-5 p-4 bg-[rgb(var(--card))] text-[rgb(var(--foreground))] border border-[rgb(var(--border))] rounded-2xl">{/* rounded shadow */}

                        <div className="mb-6">
                            <PeriodStatsModule branchId={id ? Number(id) : null} />
                        </div>

                </section>
                </div>
                <section className="col-span-5 mt-4 p-4 bg-[rgb(var(--card))] text-[rgb(var(--foreground))] border border-[rgb(var(--border))] rounded-2xl">{/* rounded shadow */}

                                <ScheduleModule
                                employees={employees}
                                appointments={normalizedAppointments}
                                schedules={schedules}
                                selectedDate={selectedDate}
                                onDateSelect={setSelectedDate}
                                onCellClick={handleOpenCreateModal}
                                onEventClick={handleEventClick}
                                onMasterClick={handleMasterClick}
                                onAddEntity={() => setIsCreateMenuOpen(true)} // 👈 открывает меню выбора
                                selectedMasterFilter={scheduleSelectedMaster}
                                onSelectedMasterFilterChange={setScheduleSelectedMaster}
                                masterSearch={scheduleMasterSearch}
                                onMasterSearchChange={setScheduleMasterSearch}
                                showMasterSearch={false}
                            />


                        <EditEmployeeModal
                            isOpen={!!selectedEmployee}
                            employee={selectedEmployee}
                            onClose={() => setSelectedEmployee(null)}
                            onSave={handleSaveEmployee}
                        />

                        <UpdateEventModal
                            isOpen={!!editingEvent}
                            onClose={() => setEditingEvent(null)}
                            eventData={editingEvent}
                        />



                        {isCreateModalOpen && selectedStartMinutes !== null && (
                            <CreateEventModal
                                isOpen={isCreateModalOpen}
                                onClose={() => setIsCreateModalOpen(false)}
                                onSave={handleSaveAppointment}
                                loading={false}
                                employeeId={selectedMasterIndex !== null ? employees[selectedMasterIndex].id : null}
                                defaultStartTime={formatTimeLocal(selectedStartMinutes)}
                                defaultEndTime={formatTimeLocal(selectedStartMinutes + 30)} // пока 30 мин шаг
                                isOutsideSchedule={isOutsideSchedule} // 👈 передаём
                            />
                        )}

                        {isCreateEmployeeOpen && (
                            <CreateEmployeeModal
                                isOpen={isCreateEmployeeOpen}
                                branchId={id}
                                onClose={() => setIsCreateEmployeeOpen(false)}
                                onSave={() => {
                                    setIsCreateEmployeeOpen(false);
                                }}
                            />
                        )}



                      {/* Создание услуги + список */}
                        {isCreateServiceOpen && (
                            <ServiceManager branchId={id} onClose={() => setIsCreateServiceOpen(false)} />
                        )}

                        <CreateMenuModal
                            isOpen={isCreateMenuOpen}
                            onClose={() => setIsCreateMenuOpen(false)}
                            onSelect={(type) => {
                                if (type === "client") {
                                    setIsCreateClientOpen(true);
                                }

                                if (type === "employee") {
                                    setIsCreateEmployeeOpen(true); // ✅ открываем создание
                                }
                                if (type === "service") {
                                    setIsCreateServiceOpen(true);
                                }
                            }}
                        />

                        <CreateClientModal
                            isOpen={isCreateClientOpen}
                            companyId={companiesData?.[0]?.id ?? null}
                            userId={userData?.id ?? null}
                            onClose={() => setIsCreateClientOpen(false)}
                            onSave={() => {
                                setIsCreateClientOpen(false);
                            }}
                        />

                    </section>

            </main>
        </div>
    );
};
export default withAuth(Page);

