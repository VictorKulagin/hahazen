// hooks/useServices.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createServiceGroup,
    createServices,
    deleteServices,
    EmployeeService,
    EmployeeServiceResponse,
    fetchEmployeeServices,
    fetchServiceGroups,
    fetchServices,
    ServiceGroup,
    Services,
    syncEmployeeServices,
    updateServices,
} from "@/services/servicesApi";

export interface NormalizedEmployeeService extends EmployeeService {
    name: string;
    base_price: number;
    price_to?: number | null;
    service_group_id?: number | null;
    group_name?: string | null;
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
        price_to: item.service?.price_to ?? null,
        service_group_id: item.service?.service_group_id ?? null,
        group_name: item.service?.group_name ?? null,
    }));

export const useServices = (branchId?: number, enabled = true) => {
    return useQuery<Services[], Error>({
        queryKey: ["services", branchId ?? "all"],
        queryFn: () => fetchServices(branchId),
        staleTime: 5 * 60 * 1000,
        enabled,
    });
};

export const useServiceGroups = (branchId?: number) => {
    return useQuery<ServiceGroup[], Error>({
        queryKey: ["serviceGroups", branchId],
        queryFn: () => {
            if (!branchId) throw new Error("Branch ID is required");
            return fetchServiceGroups(branchId);
        },
        staleTime: 5 * 60 * 1000,
        enabled: !!branchId,
    });
};

export const useCreateServiceGroup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createServiceGroup,
        onSuccess: (group, variables) => {
            queryClient.setQueryData<ServiceGroup[]>(
                ["serviceGroups", variables.branch_id],
                (current = []) =>
                    current.some((item) => item.id === group.id)
                        ? current
                        : [...current, group]
            );
            queryClient.invalidateQueries({
                queryKey: ["serviceGroups", variables.branch_id],
            });
        },
    });
};

export const useAppointmentServices = (
    employeeId: number | null | undefined,
    branchId: number | null | undefined
) => {
    const employeeQuery = useEmployeeServices(employeeId ?? undefined);
    const branchQuery = useServices(branchId ?? undefined, !employeeId && !!branchId);
    const branchServices: NormalizedEmployeeService[] = (branchQuery.data ?? []).map(
        (service) => ({
            service_id: service.id,
            individual_price: service.base_price,
            duration_minutes: service.duration_minutes,
            name: service.name,
            base_price: service.base_price,
            price_to: service.price_to ?? null,
            service_group_id: service.service_group_id ?? null,
            group_name: service.group_name ?? null,
        })
    );

    return employeeId
        ? {
            data: employeeQuery.data ?? [],
            isLoading: employeeQuery.isLoading,
            error: employeeQuery.error,
        }
        : {
            data: branchServices,
            isLoading: branchQuery.isLoading,
            error: branchQuery.error,
        };
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
