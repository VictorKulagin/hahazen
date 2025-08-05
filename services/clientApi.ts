// services/clientApi.ts
import apiClient from "./api";
export interface Client {
    id: number;
    name: string;
    phone: string;
    email?: string;
    registration_date: string;
    // Дополнительные поля по необходимости
}

// Добавляем функцию получения клиентов
export const fetchClients = async (params?: {
    search?: string;
    page?: number;
    per_page?: number;
}): Promise<Client[]> => {
    try {
        const response = await apiClient.get<Client[]>("/clients", {
            params,
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching clients:", error);
        throw error;
    }
};
