// services/appointmentsApi.ts
import apiClient from "./api";
import {AppointmentResponse} from "@/hooks/useAppointments";


export interface BookedDaysResponse {
    year: number;
    month: number;
    branch_id: number | null;
    days: number[];
}
export interface AppointmentRequest {
    id?: number; // Добавляем опциональное поле id
    client: {
        name: string;
        last_name: string;
        phone: string;
    };
    client_name: string;
    client_last_name: string;
    client_phone: string;
    branch_id: number;
    employee_id: number;
    date: string;
    time_start: string;
    time_end: string;
    appointment_datetime: string;
    total_duration: number;
    services: Array<{
        service_id: number;
        qty: number;
        individual_price?: number; // Добавьте при необходимости
        duration_minutes?: number;
        name?: string;
        id?: number;
    }>;
    comment?: string;
}

// Интерфейс для параметров запроса к appointments по филиалу и дате
export interface AppointmentsByBranchAndDateParams {
    branchId: number;
    startDate: string;
    endDate: string;
}

debugger;
/*export const fetchAppointments = (
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
};*/

export const fetchAppointments = (
    branchId: number,
    employeeId: number,
    startDate?: string,
    endDate?: string
): Promise<AppointmentResponse[]> => {
    const params = {
        branch_id: branchId,
        employee_id: employeeId,
        date_start: startDate,
        date_end: endDate,
    };

    return apiClient
        .get("/appointments", { params })
        .then((response) => response.data as AppointmentResponse[]);
};

export const createAppointment = async (data: AppointmentRequest) => {
    const response = await apiClient.post<AppointmentRequest>("/appointments", data);
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

export const fetchBookedDays = async (
    year: number,
    month: number,
    branch_id?: number | null
): Promise<BookedDaysResponse> => {
    try {
        const params: Record<string, any> = { year, month };
        if (branch_id !== undefined) {
            params.branch_id = branch_id;
        }
        const response = await apiClient.get<BookedDaysResponse>(
            "/appointments/booked-days",
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching booked days:", error);
        throw error;
    }
};




// Функция для получения данных по новому интерфейсу
export const fetchAppointmentsByBranchAndDate = (
    params: AppointmentsByBranchAndDateParams
): Promise<AppointmentResponse[]> => {
    const { branchId, startDate, endDate } = params;

    return apiClient.get("/appointments", {
        params: {
            branch_id: branchId,
            date_start: startDate,
            date_end: endDate,
        },
    }).then(response => response.data as AppointmentResponse[]);
};
