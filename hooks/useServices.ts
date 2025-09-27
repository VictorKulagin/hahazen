// hooks/useServices.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchServices,
    Services,
    syncEmployeeServices,
    fetchEmployeeServices,
    EmployeeService,
} from "@/services/servicesApi";

export interface NormalizedEmployeeService extends EmployeeService {
    name: string; // имя услуги (для отображения)
    base_price: number; // базовая цена услуги (можно использовать как подсказку)
}

export const useServices = () => {
    return useQuery<Services[], Error>({
        queryKey: ["services"],
        queryFn: () => fetchServices(),
        staleTime: 5 * 60 * 1000,
    });
};

// ✅ новый хук с нормализацией
export const useEmployeeServices = (employeeId: number | undefined) => {
    return useQuery<NormalizedEmployeeService[], Error>({
        queryKey: ["employeeServices", employeeId],
        queryFn: async () => {
            if (!employeeId) return [];
            const response = await fetchEmployeeServices(employeeId);

            return response.map((item) => ({
                service_id: item.service_id,
                individual_price: item.individual_price,
                duration_minutes: item.duration_minutes,
                name: item.service?.name ?? "—",
                base_price: item.service?.base_price ?? 0,
            }));
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
        }) => {
            await syncEmployeeServices(employeeId, services);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employeeServices"] });
        },
    });
};
