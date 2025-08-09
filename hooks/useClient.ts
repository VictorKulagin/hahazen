// hooks/useClient.ts
import {useMutation, useQuery} from "@tanstack/react-query";
import { Client, fetchClients, ClientsApiResponse } from '@/services/clientApi';

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
    searchQuery?: string,
    pagination: { page: number; perPage: number } = { page: 1, perPage: 10 }
) => {
    const params = {
        search: searchQuery,
        page: pagination.page,
        per_page: pagination.perPage,
    };

    return useQuery<PaginatedClients, Error>({
        queryKey: ['clients', searchQuery, pagination.page, pagination.perPage],
        queryFn: async () => {
            const response: ClientsApiResponse = await fetchClients(params);

            // Парсим номера страниц из ссылок
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
                }
            };
        },
        staleTime: 60_000,
        gcTime: 5 * 60 * 1000, // 5 минут - храним в памяти
        retry: 2, // 2 попытки при ошибке
        refetchOnWindowFocus: false, // Не обновлять при фокусе окна
        placeholderData: (previousData) => previousData, // Показываем старые данные во время
    });
};
