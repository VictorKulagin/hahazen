import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createResource,
    CreateResourcePayload,
    deleteResource,
    fetchResourceServices,
    ResourceServiceInput,
    ResourceServiceResponse,
    fetchResources,
    ScheduleResource,
    updateResource,
    UpdateResourcePayload,
    syncResourceServices,
} from "@/services/resourcesApi";

const resourcesKey = (branchId?: number) => ["resources", branchId] as const;

export const useResources = (branchId?: number, enabled = true) =>
    useQuery<ScheduleResource[], Error>({
        queryKey: resourcesKey(branchId),
        queryFn: () => fetchResources(branchId),
        enabled: enabled && Boolean(branchId),
        staleTime: 5 * 60 * 1000,
    });

export const useCreateResource = () => {
    const queryClient = useQueryClient();

    return useMutation<ScheduleResource, Error, CreateResourcePayload>({
        mutationFn: createResource,
        onSuccess: (resource) => {
            queryClient.invalidateQueries({
                queryKey: resourcesKey(resource.branch_id),
            });
        },
    });
};

export const useUpdateResource = () => {
    const queryClient = useQueryClient();

    return useMutation<
        ScheduleResource,
        Error,
        { id: number; branchId: number; data: UpdateResourcePayload }
    >({
        mutationFn: ({ id, data }) => updateResource(id, data),
        onSuccess: (resource, variables) => {
            queryClient.invalidateQueries({
                queryKey: resourcesKey(resource.branch_id || variables.branchId),
            });
        },
    });
};

export const useDeleteResource = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, { id: number; branchId: number }>({
        mutationFn: ({ id }) => deleteResource(id),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: resourcesKey(variables.branchId),
            });
        },
    });
};

const resourceServicesKey = (resourceId?: number) =>
    ["resourceServices", resourceId] as const;

export const useResourceServices = (resourceId?: number) =>
    useQuery<ResourceServiceResponse[], Error>({
        queryKey: resourceServicesKey(resourceId),
        queryFn: () => {
            if (!resourceId) return Promise.resolve([]);
            return fetchResourceServices(resourceId);
        },
        enabled: Boolean(resourceId),
    });

export const useSyncResourceServices = () => {
    const queryClient = useQueryClient();

    return useMutation<
        ResourceServiceResponse[],
        Error,
        { resourceId: number; services: ResourceServiceInput[] }
    >({
        mutationFn: ({ resourceId, services }) =>
            syncResourceServices(resourceId, services),
        onSuccess: (services, variables) => {
            queryClient.setQueryData(
                resourceServicesKey(variables.resourceId),
                services
            );
            queryClient.invalidateQueries({
                queryKey: resourceServicesKey(variables.resourceId),
            });
        },
    });
};
