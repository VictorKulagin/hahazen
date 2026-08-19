import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createResourceSchedule,
    fetchResourceSchedules,
    ResourceSchedule,
    ResourceSchedulePayload,
    updateResourceSchedule,
} from "@/services/resourceScheduleApi";

const resourceSchedulesKey = (resourceId?: number) =>
    ["resourceSchedules", resourceId] as const;

export const useResourceSchedules = (resourceId?: number) =>
    useQuery<ResourceSchedule[], Error>({
        queryKey: resourceSchedulesKey(resourceId),
        queryFn: () => {
            if (!resourceId) return Promise.resolve([]);
            return fetchResourceSchedules(resourceId);
        },
        enabled: Boolean(resourceId),
    });

export const useSaveResourceSchedule = () => {
    const queryClient = useQueryClient();

    return useMutation<
        void,
        Error,
        { id?: number; resourceId: number; data: ResourceSchedulePayload }
    >({
        mutationFn: ({ id, data }) =>
            id
                ? updateResourceSchedule(id, data)
                : createResourceSchedule(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: resourceSchedulesKey(variables.resourceId),
            });
        },
    });
};

