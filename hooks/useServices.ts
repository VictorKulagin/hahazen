// hooks/useServices.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createServices,
    deleteServices,
    EmployeeService,
    EmployeeServiceResponse,
    fetchEmployeeServices,
    fetchServices,
    Services,
    syncEmployeeServices,
    updateServices,
} from "@/services/servicesApi";

export interface NormalizedEmployeeService extends EmployeeService {
    name: string;
    base_price: number;
}

const normalizeEmployeeServices = (
    items: EmployeeServiceResponse[]
): NormalizedEmployeeService[] =>
    items.map((item) => ({
        service_id: item.service_id,
        individual_price: item.individual_price,
        duration_minutes: item.duration_minutes,
        name: item.service?.name ?? "-",
        base_price: item.service?.base_price ?? 0,
    }));

export const useServices = (branchId?: number) => {
    return useQuery<Services[], Error>({
        queryKey: ["services", branchId ?? "all"],
        queryFn: () => fetchServices(branchId),
        staleTime: 5 * 60 * 1000,
    });
};

export const useEmployeeServices = (employeeId: number | undefined) => {
    return useQuery<NormalizedEmployeeService[], Error>({
        queryKey: ["employeeServices", employeeId],
        queryFn: async () => {
            if (!employeeId) return [];
            const response = await fetchEmployeeServices(employeeId);

            return normalizeEmployeeServices(response);
        },
        enabled: !!employeeId,
    });
};

export const useSyncEmployeeServices = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            employeeId,
            services,
        }: {
            employeeId: number;
            services: EmployeeService[];
        }) => syncEmployeeServices(employeeId, services),
        onSuccess: (services, variables) => {
            queryClient.setQueryData(
                ["employeeServices", variables.employeeId],
                normalizeEmployeeServices(services)
            );
            queryClient.invalidateQueries({
                queryKey: ["employeeServices", variables.employeeId],
            });
        },
    });
};

export const useCreateService = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Omit<Services, "id">) => createServices(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services"] });
        },
        onError: (error) => {
            console.error("Error creating service:", error);
        },
    });
};

export const useDeleteService = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteServices(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services"] });
        },
    });
};

export const useUpdateService = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Services> }) =>
            updateServices(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services"] });
        },
    });
};
