// hooks/useEmployeeSchedules.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchEmployeeSchedules,
    createEmployeeSchedule,
    updateEmployeeSchedule,
    deleteEmployeeSchedule,
    fetchEmployeeScheduleForDate,
    EmployeeSchedule,
} from "@/services/employeeScheduleApi";

export const useEmployeeSchedules = (
    branchId?: number,
    employeeId?: number,
    startDate?: string,
    endDate?: string
) => {
    return useQuery<EmployeeSchedule[], Error>({
        queryKey: ['employeeSchedules', branchId, employeeId, startDate, endDate],
        queryFn: async () => {
            if (!branchId || !startDate || !endDate) return []; // employeeId больше не обязателен

            console.log('Fetching schedules with:', {
                branchId,
                employeeId,
                startDate,
                endDate
            });

            return await fetchEmployeeSchedules(branchId, employeeId, startDate, endDate);
        },
        enabled: !!branchId && !!startDate && !!endDate // убрали проверку employeeId
    });
};

export const useCreateEmployeeSchedule = () => {
    const queryClient = useQueryClient();

    return useMutation<
        EmployeeSchedule,
        Error,
        Omit<EmployeeSchedule, 'id'> & { schedule_type: 'weekly' | 'cycle' }
    >({
        mutationFn: createEmployeeSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employeeSchedules'] });
        }
    });
};

export const useUpdateEmployeeSchedule = () => {
    const queryClient = useQueryClient();
//debugger;
    return useMutation<EmployeeSchedule, Error, EmployeeSchedule>({
        mutationFn: (data) => updateEmployeeSchedule(data.id, data),

        onSuccess: (data) => {
            // Инвалидация для конкретного сотрудника
            queryClient.invalidateQueries({
                queryKey: ['employeeSchedules', data.employee_id]
            });
        }
    });
};


export const useDeleteEmployeeSchedule = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, number, { previous: EmployeeSchedule[] | undefined }>({
        mutationFn: deleteEmployeeSchedule,

        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['employeeSchedules'] });
            const previous = queryClient.getQueryData<EmployeeSchedule[]>(['employeeSchedules']);

            queryClient.setQueryData(
                ['employeeSchedules'],
                (old: EmployeeSchedule[] | undefined) => old?.filter(s => s.id !== id) || []
            );

            return { previous };
        },

        onError: (error, id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['employeeSchedules'], context.previous);
            }
            alert(`Ошибка удаления графика #${id}: ${error.message}`);
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['employeeSchedules'] });
        }
    });
};

export const useEmployeeScheduleForDate = (employeeId: number, date: string) => {
    return useQuery<EmployeeSchedule | null, Error>({
        queryKey: ['employeeSchedule', employeeId, date],
        queryFn: () => fetchEmployeeScheduleForDate(employeeId, date),
        enabled: !!employeeId && !!date
    });
};
