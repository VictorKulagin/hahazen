import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    fetchClientAppointments,
    updateAppointmentComment,
} from "@/services/appointmentsApi";
import { AppointmentResponse } from "@/types/appointments";

export const useClientAppointments = (clientId?: number) => {
    return useQuery<AppointmentResponse[], Error>({
        queryKey: ["client-appointments", clientId],
        queryFn: () => fetchClientAppointments(clientId!),
        enabled: !!clientId,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const useUpdateClientAppointmentComment = (clientId?: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            appointment,
            comment,
        }: {
            appointment: AppointmentResponse;
            comment: string | null;
        }) => updateAppointmentComment(appointment, comment),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["client-appointments", clientId],
            });
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            queryClient.invalidateQueries({ queryKey: ["appointmentsByBranchAndDate"] });
        },
    });
};
