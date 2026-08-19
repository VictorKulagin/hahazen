// services/branchApi.ts
import axios from "axios";
import { normalizeListPayload } from "./normalize";

export interface Branch {
    id: number;
    name: string;
    address: string;
    phone: string;
    working_hours: string;
    public_booking_axis?: PublicBookingAxis;
    public_resource_assignment?: PublicResourceAssignment;
    // Дополнительные поля при необходимости
}

export interface Service {
    id: number;
    name: string;
    duration_minutes: number;      // продолжительность услуги в минутах
    base_price: number;         // стоимость услуги
    price_to?: number | null;   // верхняя граница цены; null — одна цена
}

export interface PublicResource {
    id: number;
    name: string;
    type: "box" | "room" | "equipment" | "other";
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
    employee_id?: number;
    resource_id?: number;
    services: string;
    appointment_datetime: string;
    name: string;
    phone: string;
    comment?: string;
}

export type PublicBookingAxis = "employee" | "resource";
export type PublicResourceAssignment = "client_picks" | "auto_assigns";

export interface PublicBranchBooking {
    branch_id: number;
    booking_slug: string;
    name: string;
    address: string | null;
    phone: string | null;
    public_booking_axis: PublicBookingAxis;
    public_resource_assignment: PublicResourceAssignment;
}

const publicApiBaseURL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/api\/v1\/?$/, "");
const publicBookingClient = axios.create({
    baseURL: `${publicApiBaseURL}/api/v1/public/booking`,
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

export const fetchPublicResources = async (
    branchId: number
): Promise<PublicResource[]> => {
    const response = await publicBookingClient.get<unknown>(
        `/branches/${branchId}/resources`
    );
    return normalizeListPayload<PublicResource>(response.data).rows;
};

type PublicResourceServiceResponse = {
    id: number;
    name: string;
    duration_minutes: number;
    price?: number;
    base_price?: number;
};

export const fetchPublicResourceServices = async (
    resourceId: number
): Promise<Service[]> => {
    const response = await publicBookingClient.get<unknown>(
        `/resources/${resourceId}/services`
    );

    return normalizeListPayload<PublicResourceServiceResponse>(response.data).rows.map(
        (service) => ({
            id: service.id,
            name: service.name,
            duration_minutes: service.duration_minutes,
            base_price: Number(service.price ?? service.base_price ?? 0),
            price_to: null,
        })
    );
};
//debugger;
export const fetchAvailability = async (
    branchId: number,
    serviceIds: number[],
    axis: PublicBookingAxis = "employee"
): Promise<AvailabilitySlot[]> => {
    try {
        const response = await publicBookingClient.get<AvailabilityResponse>(
            `/branches/${branchId}/${axis === "resource" ? "resource-availability" : "availability"}`,
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

export const fetchPublicResourceAvailability = async (
    resourceId: number,
    serviceIds: number[]
): Promise<AvailabilitySlot[]> => {
    const response = await publicBookingClient.get<AvailabilityResponse | []>(
        `/resources/${resourceId}/availability`,
        { params: { services: serviceIds.join(",") } }
    );

    if (Array.isArray(response.data)) return [];

    return Object.entries(response.data).flatMap(([date, times]) =>
        times.map((time) => ({ date, time }))
    );
};

export const fetchPublicBranchBooking = async (
    code: string
): Promise<PublicBranchBooking> => {
    const response = await publicBookingClient.get<PublicBranchBooking>(
        `/b/${encodeURIComponent(code)}`
    );
    return response.data;
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
