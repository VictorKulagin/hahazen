// services/servicesApi.ts
import apiClient from "./api";
import { normalizeListPayload } from "./normalize";
import { getApiErrorMessage } from "./apiError";

export interface Services {
    id: number;
    branch_id: number;
    name: string;
    service_group_id?: number | null;
    group_name?: string | null;
    sort_order?: number;
    duration_minutes: number;
    base_price: number;
    price_to?: number | null;
    online_booking: number;
    online_booking_name: string | null;
    online_booking_description: string | null;
}

export interface ServiceGroup {
    id: number;
    branch_id: number;
    name: string;
    sort_order: number;
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

export const fetchServiceGroups = async (branchId: number): Promise<ServiceGroup[]> => {
    try {
        const response = await apiClient.get<unknown>("/service-groups", {
            params: { branch_id: branchId },
        });
        return normalizeListPayload<ServiceGroup>(response.data).rows;
    } catch (error) {
        console.error("Error fetching service groups:", error);
        throw new Error(getApiErrorMessage(error, "Не удалось загрузить категории услуг"));
    }
};

export const createServiceGroup = async (data: {
    branch_id: number;
    name: string;
}): Promise<ServiceGroup> => {
    try {
        const response = await apiClient.post<ServiceGroup>("/service-groups", data);
        return response.data;
    } catch (error) {
        console.error("Error creating service group:", error);
        throw new Error(getApiErrorMessage(error, "Не удалось создать категорию услуг"));
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
    } catch (error: unknown) {
        console.error("Error syncing employee services:", error);
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
