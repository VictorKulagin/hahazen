// services/appointmentsApi.ts
import apiClient from "./api";



export interface AppointmentRequest {
    client_name: string;
    client_last_name: string;
    client_phone: string;
    branch_id: number;
    employee_id: number;
    date: string;
    time_start: string;
    time_end: string;
    services: Array<{
        service_id: number;
        qty: number;
    }>;
    comment?: string;
}

export const fetchAppointments = (
    branchId: number,
    employeeId: number,
    startDate?: string,
    endDate?: string
): Promise<AppointmentRequest[]> => {
    const params = {
        branch_id: branchId,
        employee_id: employeeId,
        date_start: startDate,
        date_end: endDate
    };

    return apiClient.get("/appointments", { params })
        .then(response => {
            console.log("Received response:", response.data);
            return response.data as AppointmentRequest[];
        });
};

export const createAppointment = async (data: AppointmentRequest) => {
    const response = await apiClient.post<AppointmentRequest>("/appointments", data);
    debugger;
    console.log(response.data + "createAppointment");
    return response.data;
};

export const updateAppointment = async (id: number, data: Partial<AppointmentRequest>): Promise<AppointmentRequest> => {
    const response = await apiClient.put<AppointmentRequest>(`/appointments/${id}`, data);
    return response.data;
};
debugger;
export const deleteAppointment = async (id: number): Promise<void> => {
    //debugger;
    await apiClient.delete(`/appointments/${id}`);
};
