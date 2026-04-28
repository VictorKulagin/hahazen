import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createClientProCardMark,
    deleteClientProCardMark,
    fetchClientProCard,
    updateClientProCard,
    updateClientProCardMark,
    UpdateClientProCardPayload,
    UpsertClientProCardMarkPayload,
} from "@/services/clientProCardApi";

const clientProCardKey = (clientId?: number) => ["client-pro-card", clientId];

export const useClientProCard = (clientId?: number) => {
    return useQuery({
        queryKey: clientProCardKey(clientId),
        queryFn: () => fetchClientProCard(clientId!),
        enabled: !!clientId,
    });
};

export const useUpdateClientProCard = (clientId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateClientProCardPayload) =>
            updateClientProCard(clientId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientProCardKey(clientId) });
        },
    });
};

export const useCreateClientProCardMark = (clientId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpsertClientProCardMarkPayload) =>
            createClientProCardMark(clientId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientProCardKey(clientId) });
        },
    });
};

export const useUpdateClientProCardMark = (clientId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            markId,
            payload,
        }: {
            markId: number;
            payload: UpsertClientProCardMarkPayload;
        }) => updateClientProCardMark(clientId, markId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientProCardKey(clientId) });
        },
    });
};

export const useDeleteClientProCardMark = (clientId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (markId: number) => deleteClientProCardMark(clientId, markId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientProCardKey(clientId) });
        },
    });
};
