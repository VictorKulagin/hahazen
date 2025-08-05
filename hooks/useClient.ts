// hooks/useClient.ts
import {useMutation, useQuery} from "@tanstack/react-query";
import { Client, fetchClients } from '@/services/clientApi';

// Добавляем хук для клиентов с пагинацией и фильтрацией
export const useClients = (searchQuery?: string, pagination: {
    page: number;
    perPage: number;
} = { page: 1, perPage: 10 }) => {
    const params = {
        search: searchQuery,
        page: pagination.page,
        per_page: pagination.perPage,
    };

    return useQuery<Client[], Error>({
        queryKey: ['clients',
            searchQuery,
            pagination.page,
            pagination.perPage
        ],
        queryFn: async () => {
            const data = await fetchClients(params);
            return data;
        },
        staleTime: 60_000
    });
};
