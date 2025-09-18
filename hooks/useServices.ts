// hooks/useServices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchServices,
    Services,
    syncEmployeeServices,
    fetchEmployeeServices,
    EmployeeServiceResponse,
    EmployeeService
} from "@/services/servicesApi";
//import { fetchServices, Services } from '@/services/employeeApi';


export const useServices = () => {
    return useQuery<Services[], Error>({
        queryKey: ['services'],
        queryFn: () => fetchServices(),
        staleTime: 5 * 60 * 1000
    });
    // useQuery автоматически возвращает isLoading
};

// Хук для услуг мастера
export const useEmployeeServices = (employeeId: number | undefined) => {
    return useQuery<EmployeeServiceResponse[], Error>({
        queryKey: ['employeeServices', employeeId],
        queryFn: () => {
            if (!employeeId) {
                return Promise.resolve([]);
            }
            return fetchEmployeeServices(employeeId);
        },
        enabled: !!employeeId
    });
};


export const useSyncEmployeeServices = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
                               employeeId,
                               services
                           }: {
            employeeId: number
            services: EmployeeService[]
        }) => {
            await syncEmployeeServices(employeeId, services);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employeeServices'] });
        }
    });
};
