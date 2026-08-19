import apiClient from "./api";
import { normalizeListPayload } from "./normalize";
import type { Services } from "./servicesApi";

export type ResourceType = "box" | "room" | "equipment" | "other";
export type ResourceOnlineBooking = 0 | 1;

export interface ScheduleResource {
    id: number;
    branch_id: number;
    name: string;
    type: ResourceType;
    sort_order: number;
    online_booking: ResourceOnlineBooking;
    created_at?: number;
    updated_at?: number;
}

export interface CreateResourcePayload {
    branch_id: number;
    name: string;
    type?: ResourceType;
    sort_order?: number;
    online_booking?: ResourceOnlineBooking;
}

export interface ResourceServiceInput {
    service_id: number;
    individual_price: number;
    duration_minutes: number;
}

export interface ResourceServiceResponse extends ResourceServiceInput {
    id?: number;
    resource_id: number;
    service: Services;
}

export type UpdateResourcePayload = Partial<
    Omit<CreateResourcePayload, "branch_id">
>;

export const fetchResources = async (
    branchId?: number
): Promise<ScheduleResource[]> => {
    const response = await apiClient.get<unknown>("/resources", {
        params: branchId ? { branch_id: branchId } : undefined,
    });

    return normalizeListPayload<ScheduleResource>(response.data).rows;
};

export const fetchResource = async (
    id: number
): Promise<ScheduleResource> => {
    const response = await apiClient.get<ScheduleResource>(`/resources/${id}`);
    return response.data;
};

export const createResource = async (
    data: CreateResourcePayload
): Promise<ScheduleResource> => {
    const response = await apiClient.post<ScheduleResource>("/resources", data);
    return response.data;
};

export const updateResource = async (
    id: number,
    data: UpdateResourcePayload
): Promise<ScheduleResource> => {
    const response = await apiClient.patch<ScheduleResource>(
        `/resources/${id}`,
        data
    );
    return response.data;
};

export const deleteResource = async (id: number): Promise<void> => {
    await apiClient.delete(`/resources/${id}`);
};

export const fetchResourceServices = async (
    resourceId: number
): Promise<ResourceServiceResponse[]> => {
    const response = await apiClient.get<unknown>(
        `/resources/${resourceId}/services`
    );
    return normalizeListPayload<ResourceServiceResponse>(response.data).rows;
};

export const syncResourceServices = async (
    resourceId: number,
    services: ResourceServiceInput[]
): Promise<ResourceServiceResponse[]> => {
    const response = await apiClient.post<unknown>(
        `/resources/${resourceId}/services`,
        { services }
    );
    const payload = response.data as {
        services?: ResourceServiceResponse[];
    } | null;

    if (payload && Array.isArray(payload.services)) {
        return payload.services;
    }

    return normalizeListPayload<ResourceServiceResponse>(response.data).rows;
};
