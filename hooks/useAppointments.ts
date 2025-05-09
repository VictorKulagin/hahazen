// hooks/useAppointments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    Appointment
} from "@/services/appointmentsApi";



export type DurationOption =
    | '1-day'
    | '2-days'
    | '3-days'
    | '4-days'
    | '5-days'
    | '6-days'
    | 'week';


interface GroupedAppointments {
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
export interface AppointmentResponse {
    id: number;
    appointment_datetime: string;
    total_duration: number;
    branch_id: number;
    client: {
        id: number;
        name: string;
        last_name: string;
        phone: string;
    };
    services: Array<{
        id: number;
        name: string;
        quantity: number;
    }>;
}

export interface AppointmentRequest {
    client_name: string;
    client_last_name: string;
    client_phone: string;
    branch_id: number;
    employee_id: number;
    date: string;
    time_start: string;
    time_end: string;
    services: Array<{
        service_id: number;
        qty: number;
    }>;
}


// Обновляем функцию группировки
const groupAppointments = (appointments: AppointmentResponse[]): GroupedAppointments => {
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

// Обновляем хук useAppointments
export const useAppointments = (
    branchId?: number,
    employeeId?: number,
    duration: DurationOption = 'week'
) => {
    const getDateRange = () => {
        const today = new Date();
        const endDate = new Date(today);

        const daysToAdd = {
            '1-day': 0,
            '2-days': 1,
            '3-days': 2,
            '4-days': 3,
            '5-days': 4,
            '6-days': 5,
            'week': 6
        }[duration];

        endDate.setDate(today.getDate() + daysToAdd);

        return {
            start: formatDate(today),
            end: formatDate(endDate)
        };
    };

    const { start, end } = getDateRange();

    return useQuery<AppointmentResponse[], Error, GroupedAppointments>({
        queryKey: ['appointments', branchId, employeeId, start, end],
        queryFn: () => {
            if (!branchId || !employeeId) return [];
            return fetchAppointments(branchId, employeeId, start, end);
        },
        enabled: !!branchId && !!employeeId,
        select: groupAppointments,
        staleTime: 600000
    });
};



export const useCreateAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation<Appointment, Error, Omit<Appointment, 'id'>>({
        mutationFn: createAppointment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
        }
    });
};

export const useUpdateAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation<Appointment, Error, Appointment>({
        mutationFn: (data) => updateAppointment(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['appointments']
            });
        }
    });
};


export const useDeleteAppointment = () => {
    const queryClient = useQueryClient();
//debugger;
    return useMutation<void, Error, number, { previous: Appointment[] | undefined }>({
        mutationFn: (id: number) => deleteAppointment(id),

        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['appointments'] });

            const previous = queryClient.getQueryData<Appointment[]>(['appointments']);

            queryClient.setQueryData(
                ['appointments'],
                (old: Appointment[] | undefined) => old?.filter(a => a.id !== id) || []
            );

            return { previous }; // Теперь TypeScript знает тип возвращаемого значения
        },

        onError: (error, id, context) => {
            // context теперь имеет тип { previous: Appointment[] | undefined }
            if (context?.previous) {
                queryClient.setQueryData(['appointments'], context.previous);
            }
            alert(`Ошибка удаления записи #${id}: ${error.message}`);
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
        }
    });
};
