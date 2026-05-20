// services/servicesApi.ts
import apiClient from "./api";
import { normalizeListPayload } from "./normalize";
import { getApiErrorMessage } from "./apiError";

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

export interface EmployeeService {
    service_id: number;
    individual_price: number;
    duration_minutes: number;
}

export interface EmployeeServiceResponse {
    id: number;
    service_id: number;
    employee_id: number;
    individual_price: number;
    duration_minutes: number;
    service: Services;
}

export const fetchServices = async (branchId?: number): Promise<Services[]> => {
    try {
        const response = await apiClient.get<unknown>("/services", {
            params: branchId ? { branch_id: branchId } : undefined,
        });
        return normalizeListPayload<Services>(response.data).rows;
    } catch (error) {
        console.error("Error fetching services:", error);
        throw new Error(getApiErrorMessage(error, "Не удалось загрузить услуги"));
    }
};

export const createServices = async (
    newServices: Omit<Services, "id">
): Promise<Services> => {
    const response = await apiClient.post<Services>("/services", newServices);
    return response.data;
};

export const deleteServices = async (id: number): Promise<void> => {
    await apiClient.delete(`/services/${id}`);
};

export const updateServices = async (
    id: number,
    updatedData: Partial<Services>
): Promise<Services> => {
    const response = await apiClient.put<Services>(`/services/${id}`, updatedData);
    return response.data;
};

export const syncEmployeeServices = async (
    employeeId: number,
    services: EmployeeService[]
): Promise<EmployeeServiceResponse[]> => {
    try {
        const response = await apiClient.post<unknown>(
            `/employees/${employeeId}/services`,
            { services }
        );
        const payload = response.data as { services?: EmployeeServiceResponse[] } | null;
        if (payload && Array.isArray(payload.services)) {
            return payload.services;
        }

        return normalizeListPayload<EmployeeServiceResponse>(response.data).rows;
    } catch (error: any) {
        console.error(
            "Error syncing employee services:",
            error?.response?.data || error
        );
        throw new Error(
            getApiErrorMessage(
                error,
                `API endpoint not found: POST /employees/${employeeId}/services`
            )
        );
    }
};

export const fetchEmployeeServices = async (
    employeeId: number
): Promise<EmployeeServiceResponse[]> => {
    try {
        const response = await apiClient.get<unknown>(
            `/employees/${employeeId}/services`
        );
        return normalizeListPayload<EmployeeServiceResponse>(response.data).rows;
    } catch (error) {
        console.error("Error fetching employee services:", error);
        throw new Error(getApiErrorMessage(error, "Не удалось получить услуги мастера"));
    }
};
