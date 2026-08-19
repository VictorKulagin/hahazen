// hooks/useBranches.ts
import {useMutation, useQuery} from "@tanstack/react-query";
import {
    Branch,
    fetchBranches,
    Service,
    fetchServices,
    fetchAvailability,
    Employee, fetchAvailableEmployees, AppointmentData, createAppointment,
    fetchPublicBranchBooking,
    PublicBookingAxis,
    PublicBranchBooking,
    PublicResource,
    fetchPublicResources,
    fetchPublicResourceServices,
    fetchPublicResourceAvailability,
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
export const useServices = (branchId: number | undefined, enabled = true) => {
    return useQuery<Service[], Error>({
        queryKey: ['services', branchId],
        queryFn: async () => {
            if (!branchId) throw new Error('Branch ID is required');
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
        enabled: enabled && !!branchId
    });
};

export const usePublicResources = (
    branchId: number | undefined,
    enabled = true
) =>
    useQuery<PublicResource[], Error>({
        queryKey: ["public-resources", branchId],
        queryFn: () => {
            if (!branchId) throw new Error("Branch ID is required");
            return fetchPublicResources(branchId);
        },
        enabled: enabled && Boolean(branchId),
        staleTime: 60_000,
    });

export const usePublicResourceServices = (
    resourceId: number | undefined,
    enabled = true
) =>
    useQuery<Service[], Error>({
        queryKey: ["public-resource-services", resourceId],
        queryFn: () => {
            if (!resourceId) throw new Error("Resource ID is required");
            return fetchPublicResourceServices(resourceId);
        },
        enabled: enabled && Boolean(resourceId),
        staleTime: 60_000,
    });

export const usePublicResourceAvailability = (
    resourceId: number | undefined,
    serviceIds: number[],
    enabled = true
) => {
    const serviceIdsKey = [...serviceIds].sort((a, b) => a - b).join(",");

    return useQuery({
        queryKey: ["public-resource-availability", resourceId, serviceIdsKey],
        queryFn: () => {
            if (!resourceId || serviceIds.length === 0) {
                throw new Error("Invalid resource availability parameters");
            }
            return fetchPublicResourceAvailability(resourceId, serviceIds);
        },
        enabled: enabled && Boolean(resourceId) && serviceIds.length > 0,
        staleTime: 5 * 60 * 1000,
    });
};

export const useAvailability = (
    branchId: number | undefined,
    serviceIds: number[],
    axis: PublicBookingAxis = "employee",
    enabled = true
) => {
    return useQuery({
        queryKey: ['availability', axis, branchId, serviceIds],
        queryFn: async () => {
            if (!branchId || serviceIds.length === 0) {
                throw new Error('Неверные параметры запроса');
            }

            try {
                const data = await fetchAvailability(branchId, serviceIds, axis);
                console.log('API Response Data:', data); // Логирование данных
                return data;
            } catch (error) {
                console.error('Ошибка получения данных:', error);
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000,
        enabled: enabled && !!branchId && serviceIds.length > 0
    });
};

export const useAvailableEmployees = (
    branchId: number | undefined,
    date: string | undefined,
    time: string | undefined,
    serviceIds: number[],
    enabled = true
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
        retry: false,
        refetchOnWindowFocus: false,
        enabled: enabled && !!branchId && !!date && !!time && serviceIds.length > 0
    });
};

export const usePublicBranchBooking = (code: string | undefined) =>
    useQuery<PublicBranchBooking, Error>({
        queryKey: ["public-branch-booking", code],
        queryFn: () => {
            if (!code) throw new Error("Booking code is required");
            return fetchPublicBranchBooking(code);
        },
        enabled: Boolean(code),
        staleTime: 60_000,
        retry: false,
        refetchOnWindowFocus: false,
    });

// Добавляем хук для создания записи
export const useCreateAppointment = () => {
    return useMutation<void, Error, AppointmentData>({
        mutationFn: createAppointment,
        onError: (error) => {
            console.error('Appointment creation error:', error);
        }
    });
};
