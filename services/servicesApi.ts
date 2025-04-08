// services/employeeApi.ts
import apiClient from "./api";

// Интерфейс для сотрудника
export interface Services {
    id: number;
    branch_id: number;
    name: string;
    duration_minutes: number;
    base_price: number;
    online_booking: number;
    online_booking_name: string;
    online_booking_description: string;
}

// Получение списка сотрудников
export const fetchServices = async (): Promise<Services[]> => {
    const response = await apiClient.get<Services[]>("/services");
    return response.data;
};

// Создание нового сотрудника
export const createServices = async (newServices: Omit<Services, 'id'>): Promise<Services> => {
    const response = await apiClient.post<Services>("/services", newServices);
    return response.data;
};

// Удаление сотрудника
export const deleteServices = async (id: number): Promise<void> => {
    await apiClient.delete(`/services/${id}`);
};

// Обновление сотрудника
export const updateServices = async (id: number, updatedData: Partial<Services>): Promise<Services> => {
    const response = await apiClient.put<Services>(`/services/${id}`, updatedData);
    return response.data;
};
