import { useQuery } from "@tanstack/react-query";
import { fetchClientAppointments } from "@/services/appointmentsApi";
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
