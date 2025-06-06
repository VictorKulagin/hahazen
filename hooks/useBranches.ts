// hooks/useBranches.ts
import {useMutation, useQuery} from "@tanstack/react-query";
import {
    Branch,
    fetchBranches,
    Service,
    fetchServices,
    AvailabilitySlot,
    fetchAvailability,
    Employee, fetchAvailableEmployees, AppointmentData, createAppointment
} from "@/services/branchApi";

// Хук для получения списка филиалов
export const useBranches = () => {
    return useQuery<Branch[], Error>({
        queryKey: ['branches'],
        queryFn: fetchBranches,
        staleTime: 60_000
    });
};

// Хук для получения услуг филиала
export const useServices = (branchId: number | undefined) => {
    return useQuery<Service[], Error>({
        queryKey: ['services', branchId],
        queryFn: async () => {
            if (!branchId) throw new Error('Branch ID is required');
debugger;
            console.log('Fetching services for branch ID:', branchId);

            try {
                const data = await fetchServices(branchId);
                console.log('API Response:', data);
                return data;
            } catch (error) {
                console.error('Error fetching services:', {
                    error,
                    branchId
                });
                throw error;
            }
        },
        staleTime: 60_000,
        enabled: !!branchId
    });
};

export const useAvailability = (
    branchId: number | undefined,
    serviceIds: number[]
) => {
    return useQuery({
        queryKey: ['availability', branchId, serviceIds],
        queryFn: async () => {
            if (!branchId || serviceIds.length === 0) {
                throw new Error('Неверные параметры запроса');
            }

            try {
                const data = await fetchAvailability(branchId, serviceIds);
                console.log('API Response Data:', data); // Логирование данных
                return data;
            } catch (error) {
                console.error('Ошибка получения данных:', error);
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000,
        enabled: !!branchId && serviceIds.length > 0
    });
};

export const useAvailableEmployees = (
    branchId: number | undefined,
    date: string | undefined,
    time: string | undefined,
    serviceIds: number[]
) => {
    const sortedServiceIds = [...serviceIds].sort((a, b) => a - b);
    const serviceIdsKey = sortedServiceIds.join(',');

    return useQuery<Employee[], Error>({
        queryKey: ['employees', branchId, date, time, serviceIdsKey],
        queryFn: async () => {
            if (!branchId || !date || !time || serviceIds.length === 0) {
                throw new Error('Invalid request parameters');
            }

            try {
                const data = await fetchAvailableEmployees(
                    branchId,
                    date,
                    time,
                    sortedServiceIds
                );
                console.log('Available employees response:', data);
                return data;
            } catch (error) {
                console.error('Error fetching employees:', {
                    error,
                    branchId,
                    date,
                    time,
                    serviceIds
                });
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000,
        enabled: !!branchId && !!date && !!time && serviceIds.length > 0
    });
};

// Добавляем хук для создания записи
export const useCreateAppointment = () => {
    return useMutation<void, Error, AppointmentData>({
        mutationFn: createAppointment,
        onError: (error) => {
            console.error('Appointment creation error:', error);
        }
    });
};
