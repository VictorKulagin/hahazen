import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ClientBonusTransaction,
    CreateClientBonusTransactionPayload,
    createClientBonusTransaction,
    fetchClientBonusTransactions,
} from "@/services/clientApi";

const BONUS_TRANSACTIONS_PAGE_SIZE = 20;

export const useClientBonusTransactions = (clientId?: number) => {
    return useQuery<ClientBonusTransaction[], Error>({
        queryKey: ["client", clientId, "bonus-transactions"],
        queryFn: async () => {
            const response = await fetchClientBonusTransactions(clientId!, {
                page: 1,
                perPage: BONUS_TRANSACTIONS_PAGE_SIZE,
            });

            return response.data;
        },
        enabled: !!clientId,
    });
};

export const useCreateClientBonusTransaction = (clientId?: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateClientBonusTransactionPayload) =>
            createClientBonusTransaction(clientId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["client", clientId, "bonus-transactions"],
            });
            queryClient.invalidateQueries({ queryKey: ["client", clientId] });
            queryClient.invalidateQueries({ queryKey: ["clients"] });
        },
    });
};
