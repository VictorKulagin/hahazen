// hooks/useClient.ts
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import { Client, fetchClients, ClientsApiResponse,   fetchClientById,  updateClient, createClient} from '@/services/clientApi';
// Добавляем хук для клиентов с пагинацией и фильтрацией

export interface PaginatedClients {
    clients: Client[];
    pagination: {
        currentPage: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        nextPage?: number | null; // ← Изменено с `number | undefined` на `number | null`
        prevPage?: number | null; // ← Изменено с `number | undefined` на `number | null`
    };
}
export const useClients = (
    filters: { [key: string]: string },
    pagination: { page: number; perPage: number } = { page: 1, perPage: 10 }
) => {
    const params = {
        ...filters,
        page: pagination.page,
        per_page: pagination.perPage,
    };

    return useQuery<PaginatedClients, Error>({
        queryKey: ['clients', filters, pagination.page, pagination.perPage],
        queryFn: async () => {
            const response: ClientsApiResponse = await fetchClients(params);

            const getPageFromUrl = (url?: string): number | null => {
                if (!url) return null;
                const match = url.match(/page=(\d+)/);
                return match ? parseInt(match[1], 10) : null;
            };

            return {
                clients: response.data,
                pagination: {
                    currentPage: pagination.page,
                    totalPages: getPageFromUrl(response._links?.last?.href) || 1,
                    hasNextPage: !!response._links?.next,
                    hasPrevPage: !!response._links?.prev,
                    nextPage: getPageFromUrl(response._links?.next?.href),
                    prevPage: getPageFromUrl(response._links?.prev?.href),
                },
            };
        },
        staleTime: 60000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
        placeholderData: (previousData) => previousData,
    });
};



// Один клиент по id
export const useClient = (id?: number) => {
    return useQuery<Client, Error>({
        queryKey: ["client", id],
        queryFn: () => fetchClientById(id!),
        enabled: !!id,
    });
};


export const useCreateClient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Client) => createClient(data), // <-- твой apiClient.post
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] }); // чтобы обновить список
        },
    });
};

// Обновление клиента
export const useUpdateClient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Client }) =>
            updateClient(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            queryClient.invalidateQueries({ queryKey: ["client", id] });
        },
    });
};
