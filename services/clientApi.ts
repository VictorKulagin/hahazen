// services/clientApi.ts
import apiClient from "./api";
// Тип одной записи клиента
export interface Client {
    id: number;
    name: string;
    phone: string;
    email?: string;
    registration_date?: string;
}

// Тип ответа API
// Тип ответа API - ДОБАВЬТЕ export ЗДЕСЬ:
export interface ClientsApiResponse { // ← Добавлено export
    _links?: {
        next?: { href: string };
        prev?: { href: string };
        first?: { href: string };
        last?: { href: string };
    };
    data: Client[];
}

// Добавляем функцию получения клиентов
// Функция запроса клиентов
export const fetchClients = async (params?: {
    search?: string;
    page?: number;
    per_page?: number;
}): Promise<ClientsApiResponse> => { // ← Изменено с Client[] на ClientsApiResponse
    try {
        const response = await apiClient.get<ClientsApiResponse>("/clients", {
            params,
        });
        return response.data; // ← Возвращаем полный объект (не только response.data.data)
    } catch (error) {
        console.error("Error fetching clients:", error);
        throw error;
    }
};
