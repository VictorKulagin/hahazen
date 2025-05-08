// services/branchApi.ts
import apiClient from "./api";

export interface Branch {
    id: number;
    name: string;
    address: string;
    phone: string;
    working_hours: string;
    // Дополнительные поля при необходимости
}

export interface Service {
    id: number;
    name: string;
    duration_minutes: number;      // продолжительность услуги в минутах
    base_price: number;         // стоимость услуги
}

export interface AvailabilityResponse {
    [date: string]: string[]; // Формат: { "2025-05-08": ["09:00", "09:30", ...] }
}

export interface AvailabilitySlot {
    date: string;
    time: string;
}

export const fetchBranches = async (): Promise<Branch[]> => {
    try {
        const response = await apiClient.get<Branch[]>("/booking/branches");
        return response.data;
    } catch (error) {
        console.error("Error fetching branches:", error);
        throw error;
    }
};

export const fetchServices = async (branchId: number): Promise<Service[]> => {
    try {
        const response = await apiClient.get<Service[]>(
            `/booking/branches/${branchId}/services`
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching services for branch ${branchId}:`, error);
        throw error;
    }
};
debugger;
export const fetchAvailability = async (
    branchId: number,
    serviceIds: number[]
): Promise<AvailabilitySlot[]> => {
    try {
        const response = await apiClient.get<AvailabilityResponse>(
            `/booking/branches/${branchId}/availability`,
            {
                params: {
                    services: serviceIds.join(',')
                }
            }
        );

        // Преобразуем объект в массив слотов
        return Object.entries(response.data).flatMap(([date, times]) =>
            times.map(time => ({ date, time }))
        );
    } catch (error) {
        console.error('Error fetching availability:', error);
        throw error;
    }
};
