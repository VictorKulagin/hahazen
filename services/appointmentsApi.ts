// services/appointmentsApi.ts
/*import apiClient from "./api";

import { AppointmentRequest, AppointmentResponse } from "@/types/appointments";
export interface BookedDaysResponse {
    year: number;
    month: number;
    branch_id: number | null;
    days: number[];
}


// Интерфейс для параметров запроса к appointments по филиалу и дате
export interface AppointmentsByBranchAndDateParams {
    branchId: number;
    startDate: string;
    endDate: string;
}


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


export const createAppointment = async (data: AppointmentRequest): Promise<AppointmentResponse> => {
    const response = await apiClient.post<AppointmentResponse>("/appointments", data);
    console.log("createAppointment response:", response.data);
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
};*/

// services/appointmentsApi.ts
import apiClient from "./api";
import { AppointmentRequest, AppointmentResponse } from "@/types/appointments";
export interface PeriodStatsResponse {
    date_start: string;
    date_end: string;
    branch_id: number | null;
    days: {
        date: string;
        appointments_count: number;
        paid_amount: number;
    }[];
    period_totals: {
        appointments_count: number;
        paid_amount: number;
    };
}
export interface BookedDaysResponse {
    year: number;
    month: number;
    branch_id: number | null;
    days: number[];
}

export interface AppointmentsByBranchAndDateParams {
    branchId: number;
    startDate: string;
    endDate: string;
}

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

export const createAppointment = async (
    data: AppointmentRequest
): Promise<AppointmentResponse> => {
    const response = await apiClient.post<AppointmentResponse>("/appointments", data);
    console.log("createAppointment response:", response.data);
    return response.data;
};

export const updateAppointment = async (
    id: number,
    data: Partial<AppointmentRequest>
): Promise<AppointmentResponse> => {
    const response = await apiClient.put<AppointmentResponse>(`/appointments/${id}`, data);
    return response.data;
};

export const deleteAppointment = async (id: number): Promise<void> => {
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

export const fetchAppointmentsByBranchAndDate = (
    params: AppointmentsByBranchAndDateParams
): Promise<AppointmentResponse[]> => {
    const { branchId, startDate, endDate } = params;

    return apiClient
        .get("/appointments", {
            params: {
                branch_id: branchId,
                date_start: startDate,
                date_end: endDate,
            },
        })
        .then((response) => response.data as AppointmentResponse[]);
};

export const fetchPeriodStats = (
    dateStart: string,
    dateEnd: string,
    branchId?: number | null
): Promise<PeriodStatsResponse> => {
    return apiClient.get("/appointments/period-stats", {
        params: {
            date_start: dateStart,
            date_end: dateEnd,
            branch_id: branchId,
        },
    }).then(res => res.data);
};
