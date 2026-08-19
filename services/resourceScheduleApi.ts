import apiClient from "./api";
import { normalizeListPayload } from "./normalize";

export type ResourceSchedulePeriodTuple = [
    weekday: number,
    startTime: string,
    endTime: string,
];

export type ResourceSchedulePeriodObject = {
    weekday?: number;
    day_of_week?: number;
    day_key?: number;
    start_time: string;
    end_time: string;
};

export type ResourceSchedulePeriod =
    | ResourceSchedulePeriodTuple
    | ResourceSchedulePeriodObject;

export interface ResourceSchedule {
    id: number;
    resource_id: number;
    schedule_type: "weekly";
    start_date: string;
    end_date: string;
    cycle_length?: number | null;
    night_shift?: number;
    periods: ResourceSchedulePeriod[];
}

export interface ResourceSchedulePayload {
    resource_id: number;
    schedule_type: "weekly";
    start_date: string;
    end_date: string;
    periods: ResourceSchedulePeriodTuple[];
}

export const fetchResourceSchedules = async (
    resourceId: number
): Promise<ResourceSchedule[]> => {
    const response = await apiClient.get<unknown>("/resource-schedules", {
        params: { resource_id: resourceId },
    });

    return normalizeListPayload<ResourceSchedule>(response.data).rows;
};

export const createResourceSchedule = async (
    data: ResourceSchedulePayload
): Promise<void> => {
    await apiClient.post("/resource-schedules", data);
};

export const updateResourceSchedule = async (
    id: number,
    data: ResourceSchedulePayload
): Promise<void> => {
    await apiClient.put(`/resource-schedules/${id}`, data);
};

