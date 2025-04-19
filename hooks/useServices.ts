// hooks/useServices.ts
import { useQuery } from '@tanstack/react-query';
import {fetchServices, Services} from "@/services/servicesApi";
//import { fetchServices, Services } from '@/services/employeeApi';


export const useServices = () => {
    return useQuery<Services[], Error>({
        queryKey: ['services'],
        queryFn: () => fetchServices(),
        staleTime: 5 * 60 * 1000
    });
    // useQuery автоматически возвращает isLoading
};
