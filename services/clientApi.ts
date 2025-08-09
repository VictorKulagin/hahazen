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
interface ClientsApiResponse {
    _links?: Record<string, unknown>;
    data: Client[];
}

// Добавляем функцию получения клиентов
// Функция запроса клиентов
export const fetchClients = async (params?: {
    search?: string;
    page?: number;
    per_page?: number;
}): Promise<Client[]> => {
    try {
        const response = await apiClient.get<ClientsApiResponse>("/clients", {
            params,
        });
        //return response.data;
        return response.data.data ?? [];
    } catch (error) {
        console.error("Error fetching clients:", error);
        throw error;
    }
};
