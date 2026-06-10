// services/branchApi.ts
import axios from "axios";
import { normalizeListPayload } from "./normalize";

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


export interface Employee {
    id: number;
    name: string;
    specialization: string;
    // Дополнительные поля при необходимости
}

export interface AppointmentData {
    branch_id: number;
    employee_id: number;
    services: string;
    appointment_datetime: string;
    name: string;
    phone: string;
    comment?: string;
}

const publicApiBaseURL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/api\/v1\/?$/, "");
const publicBookingClient = axios.create({
    baseURL: `${publicApiBaseURL}/public-api/booking`,
    headers: { "Content-Type": "application/json" },
});

export const fetchBranches = async (): Promise<Branch[]> => {
    try {
        const response = await publicBookingClient.get<unknown>("/branches");
        return normalizeListPayload<Branch>(response.data).rows;
    } catch (error) {
        console.error("Error fetching branches:", error);
        throw error;
    }
};

export const fetchServices = async (branchId: number): Promise<Service[]> => {
    try {
        const response = await publicBookingClient.get<unknown>(
            `/branches/${branchId}/services`
        );
        return normalizeListPayload<Service>(response.data).rows;
    } catch (error) {
        console.error(`Error fetching services for branch ${branchId}:`, error);
        throw error;
    }
};
//debugger;
export const fetchAvailability = async (
    branchId: number,
    serviceIds: number[]
): Promise<AvailabilitySlot[]> => {
    try {
        const response = await publicBookingClient.get<AvailabilityResponse>(
            `/branches/${branchId}/availability`,
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

// Существующие функции (fetchBranches, fetchServices, fetchAvailability)...

export const fetchAvailableEmployees = async (
    branchId: number,
    date: string,
    time: string,
    serviceIds: number[]
): Promise<Employee[]> => {
    try {
        const response = await publicBookingClient.get<unknown>(
            `/branches/${branchId}/availability/${date}/employees`,
            {
                params: {
                    services: serviceIds.join(','),
                    time: time
                },
                timeout: 10_000,
            }
        );
        return normalizeListPayload<Employee>(response.data).rows;
    } catch (error) {
        console.error('Error fetching available employees:', error);
        throw error;
    }
};

export const createAppointment = async (data: AppointmentData): Promise<void> => {
    try {
        const response = await publicBookingClient.post("/appointments", data);
        return response.data;
    } catch (error) {
        console.error('Error creating appointment:', error);
        throw error;
    }
};
