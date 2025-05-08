// hooks/useBranches.ts
import { useQuery } from "@tanstack/react-query";
import { Branch, fetchBranches, Service, fetchServices, AvailabilitySlot, fetchAvailability } from "@/services/branchApi";

// Хук для получения списка филиалов
export const useBranches = () => {
    return useQuery<Branch[], Error>({
        queryKey: ['branches'],
        queryFn: fetchBranches,
        staleTime: 60_000
    });
};

// Хук для получения услуг филиала
debugger;
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
debugger;
/*export const useAvailability = (
    branchId: number | undefined,
    serviceIds: number[]
) => {
    return useQuery<AvailabilitySlot[], Error>({
        queryKey: ['availability', branchId, serviceIds],
        queryFn: async () => {
            if (!branchId) throw new Error('Branch ID is required');
            if (serviceIds.length === 0) throw new Error('No services selected');

            return fetchAvailability(branchId, serviceIds);
        },
        staleTime: 5 * 60 * 1000, // 5 минут
        enabled: !!branchId && serviceIds.length > 0
    });
};*/


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
