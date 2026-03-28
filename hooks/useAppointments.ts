// hooks/useAppointments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    fetchAppointmentsByBranchAndDate,
    // @ts-ignore
    Appointment, fetchPeriodStats
} from "@/services/appointmentsApi";

import { fetchBookedDays, BookedDaysResponse } from "@/services/appointmentsApi";
import { formatDateLocal } from "@/components/utils/date";
import { AppointmentRequest } from "@/types/appointments";
import {AppointmentResponse} from "@/types/appointments";

export type DurationOption =
    | '1-day'
    | '2-days'
    | '3-days'
    | '4-days'
    | '5-days'
    | '6-days'
    | 'week';


export interface GroupedAppointments {
    [date: string]: {
        [time: string]: Appointment[];
    };
}

// Добавляем функцию formatDate
const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
// Обновляем интерфейсы

// Обновляем функцию группировки
export const groupAppointments = (appointments: AppointmentResponse[]): GroupedAppointments => {
    return appointments.reduce((acc, appointment) => {
        const date = new Date(appointment.appointment_datetime);
        const dateKey = date.toISOString().split('T')[0];
        const timeKey = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        acc[dateKey] = acc[dateKey] || {};
        acc[dateKey][timeKey] = acc[dateKey][timeKey] || [];
        acc[dateKey][timeKey].push(appointment);

        return acc;
    }, {} as GroupedAppointments);
};

debugger;

export const useAppointments = (
    branchId?: number,
    employeeId?: number,
    duration: DurationOption = "1-day",
    currentStartDate: Date = new Date()
) => {
    const getDateRange = (): { start: string; end: string } => {
        const startDate = new Date(currentStartDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        const daysToAdd = durationToDays(duration) - 1;
        endDate.setDate(startDate.getDate() + daysToAdd);
        endDate.setHours(23, 59, 59, 999);

        return {
            start: formatDateLocal(startDate),
            end: formatDateLocal(endDate),
        };
    };

    const { start, end } = getDateRange();

    const queryKey = ["appointments", branchId, employeeId, start, end];
    //console.log("useAppointments queryKey:", queryKey); // ← теперь видно в консоли

    return useQuery<AppointmentResponse[], Error, GroupedAppointments>({
        queryKey, // используем нашу переменную

        queryFn: () => {
            if (!branchId || !employeeId) return Promise.resolve([]);
            return fetchAppointments(branchId, employeeId, start, end);
        },
        enabled: !!branchId && !!employeeId,
        select: groupAppointments, // принимает AppointmentResponse[]
        //staleTime: 600000,
        staleTime: 600000, // 10 минут кэш
        refetchInterval: 60000, // автообновление каждые 60 секунд
    });
};


// Выносим функцию преобразования длительности в дни
export const durationToDays = (duration: DurationOption): number => {
    return {
        '1-day': 1,
        '2-days': 2,
        '3-days': 3,
        '4-days': 4,
        '5-days': 5,
        '6-days': 6,
        'week': 7
    }[duration];
};

export const useCreateAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: AppointmentRequest) => createAppointment(payload),
        onSuccess: (data, variables) => {
            if (!variables) return;

            // Инвалидация для ключа расписания филиала по дате
            const dateKey = [
                "appointmentsByBranchAndDate",
                variables.branch_id,
                variables.date,
                variables.date,
            ];

            // Инвалидация для ключа расписания по мастеру
            const masterKey = [
                "appointments",
                variables.branch_id,
                variables.employee_id,
                variables.date,
                variables.date,
            ];

            // Инвалидация кэшей
            queryClient.invalidateQueries({ queryKey: dateKey });
            queryClient.invalidateQueries({ queryKey: masterKey });
            queryClient.invalidateQueries({ queryKey: ["appointments"] }); // общий инвалидационный ключ - если требуется

            queryClient.invalidateQueries({ queryKey: ["periodStats"] });

            console.log("Appointment created:", data, "with variables:", variables);
        },
    });
};

export const useUpdateAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation<Appointment, Error, Appointment>({
        mutationFn: (data) => updateAppointment(data.id, data),
        onSuccess: (_, variables) => {
            console.log("✅ Запись обновлена:", variables);

            // Инвалидация всех ключей, связанных с расписанием
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            queryClient.invalidateQueries({ queryKey: ["appointmentsByBranchAndDate"] });

            queryClient.invalidateQueries({ queryKey: ["periodStats"] });
        },
    });
};

export const useDeleteAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, number, { previous: Appointment[] | undefined }>({
        mutationFn: (id: number) => deleteAppointment(id),

        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["appointments"] });

            const previous = queryClient.getQueryData<Appointment[]>(["appointments"]);

            // ✅ тут указываем generic
            queryClient.setQueryData<Appointment[]>(
                ["appointments"],
                (old) => (old ? old.filter((a) => a.id !== id) : [])
            );

            return { previous };
        },

        onError: (error, id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["appointments"], context.previous);
            }
            alert(`Ошибка удаления записи #${id}: ${error.message}`);
        },

        onSuccess: () => {
            console.log("🗑 Запись удалена");
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            queryClient.invalidateQueries({ queryKey: ["appointmentsByBranchAndDate"] });

            queryClient.invalidateQueries({ queryKey: ["periodStats"] });
        },
    });
};

export const useBookedDays = (year: number, month: number, branch_id?: number | null) => {
    return useQuery<BookedDaysResponse, Error>({
        queryKey: ["bookedDays", year, month, branch_id],
        queryFn: () => fetchBookedDays(year, month, branch_id),
        staleTime: 5 * 60 * 1000,  // 5 минут кэш
        refetchOnWindowFocus: false,
    });
};

export const useAppointmentsByBranchAndDate = (
    branchId?: number,
    currentStartDate: Date = new Date()
) => {
    const startDate = formatDateLocal(currentStartDate);
    const endDate = startDate; // один день

    const queryKey = ["appointmentsByBranchAndDate", branchId, startDate, endDate];
    console.log("useAppointmentsByBranchAndDate queryKey:", queryKey);

    return useQuery({
        queryKey,
        queryFn: () => {
            if (!branchId) return Promise.resolve([]);
            return fetchAppointmentsByBranchAndDate({ branchId, startDate, endDate });
        },
        enabled: !!branchId,
        staleTime: 600000,
    });
};


export const usePeriodStats = (
    dateStart: string,
    dateEnd: string,
    branchId?: number | null
) => {
    return useQuery({
        queryKey: ["periodStats", dateStart, dateEnd, branchId],
        queryFn: () => fetchPeriodStats(dateStart, dateEnd, branchId),
        enabled: !!dateStart && !!dateEnd,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};
