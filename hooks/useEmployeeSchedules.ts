// hooks/useEmployeeSchedules.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchEmployeeSchedules,
    createEmployeeSchedule,
    updateEmployeeSchedule,
    deleteEmployeeSchedule,
    fetchEmployeeScheduleForDate,
    EmployeeSchedule,
} from "@/services/еmployeeScheduleApi";

export const useEmployeeSchedules = (
    branchId?: number,
    employeeId?: number,
    startDate?: string,
    endDate?: string
) => {
    return useQuery<EmployeeSchedule[], Error>({
        queryKey: ['employeeSchedules', branchId, employeeId, startDate, endDate],
        queryFn: () => {
            if (!branchId || !employeeId) return [];
            return fetchEmployeeSchedules(branchId, employeeId, startDate, endDate);
        },
        enabled: !!branchId && !!employeeId,
        staleTime: 600000
    });
};

export const useCreateEmployeeSchedule = () => {
    const queryClient = useQueryClient();

    return useMutation<EmployeeSchedule, Error, Omit<EmployeeSchedule, 'id'>>({
        mutationFn: createEmployeeSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employeeSchedules'] });
        }
    });
};

export const useUpdateEmployeeSchedule = () => {
    const queryClient = useQueryClient();

    return useMutation<EmployeeSchedule, Error, EmployeeSchedule>({
        mutationFn: (data) => updateEmployeeSchedule(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employeeSchedules'] });
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


// Пример компонента для отображения графиков
/*const EmployeeSchedulesList = ({ employeeId }: { employeeId: number }) => {
    const { data: schedules, isLoading, error } = useEmployeeSchedules(1, employeeId);

    if (isLoading) return <Loader />;
    if (error) return <ErrorAlert message={error.message} />;

    return (
        <div>
            {schedules?.map(schedule => (
                <ScheduleItem
                    key={schedule.id}
    schedule={schedule}
    onUpdate={useUpdateEmployeeSchedule()}
    onDelete={useDeleteEmployeeSchedule()}
    />
))}
    </div>
);
};*/
