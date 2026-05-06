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
import { normalizeListPayload } from "./normalize";

type AppointmentPayload = AppointmentResponse | { data?: AppointmentResponse };
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
        .get<unknown>("/appointments", { params })
        .then((response) => normalizeListPayload<AppointmentResponse>(response.data).rows);
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

const splitDateTime = (value?: string) => {
    if (!value) return { date: "", time: "" };

    const normalized = value.trim().replace("T", " ");
    const [date = "", time = ""] = normalized.split(" ");

    return {
        date: date.slice(0, 10),
        time: time.slice(0, 5),
    };
};

const getAppointmentEndTime = (appointment: AppointmentResponse) => {
    const explicitEnd = splitDateTime(appointment.datetime_end).time;

    if (explicitEnd) return explicitEnd;

    const start = new Date(appointment.appointment_datetime.replace(" ", "T"));

    if (Number.isNaN(start.getTime())) {
        return splitDateTime(appointment.datetime_start).time || "00:00";
    }

    start.setMinutes(start.getMinutes() + appointment.total_duration);

    return `${String(start.getHours()).padStart(2, "0")}:${String(
        start.getMinutes(),
    ).padStart(2, "0")}`;
};

const buildAppointmentCommentPayload = (
    appointment: AppointmentResponse,
    comment: string | null,
): AppointmentRequest => {
    const startFromDatetime = splitDateTime(appointment.datetime_start);
    const startFromAppointment = splitDateTime(appointment.appointment_datetime);
    const date = startFromDatetime.date || startFromAppointment.date;
    const timeStart = startFromDatetime.time || startFromAppointment.time;

    if (!date || !timeStart) {
        throw new Error("Не удалось определить дату и время выбранного визита.");
    }

    return {
        client_id: appointment.client?.id,
        employee_id: appointment.employee_id,
        branch_id: appointment.branch_id,
        date,
        time_start: timeStart,
        time_end: getAppointmentEndTime(appointment),
        services: (appointment.services ?? [])
            .map((service) => ({
                service_id: service.service_id ?? service.id ?? 0,
                qty: service.qty ?? 1,
            }))
            .filter((service) => service.service_id > 0),
        cost: appointment.cost ?? 0,
        paid_amount: appointment.paid_amount ?? 0,
        payment_status: appointment.payment_status ?? "unpaid",
        payment_method: appointment.payment_method ?? null,
        visit_status: appointment.visit_status ?? "expected",
        comment,
    };
};

export const updateAppointmentComment = async (
    appointment: AppointmentResponse,
    comment: string | null,
): Promise<AppointmentResponse> => {
    const response = await apiClient.put<AppointmentPayload>(
        `/appointments/${appointment.id}`,
        buildAppointmentCommentPayload(appointment, comment),
    );

    const payload = response.data;
    const updatedAppointment =
        "data" in payload && payload.data ? payload.data : payload as AppointmentResponse;

    return {
        ...appointment,
        ...updatedAppointment,
        comment,
    };
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
        .get<unknown>("/appointments", {
            params: {
                branch_id: branchId,
                date_start: startDate,
                date_end: endDate,
            },
        })
        .then((response) => normalizeListPayload<AppointmentResponse>(response.data).rows);
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




/*export const fetchClientAppointments = async (clientId: number): Promise<AppointmentResponse[]> => {
    const response = await apiClient.get<AppointmentResponse[] | { data: AppointmentResponse[] }>(
        "/appointments",
        {
            params: { client_id: clientId },
        },
    );

    if (Array.isArray(response.data)) {
        return response.data;
    }

    return response.data.data ?? [];
};*/

const getAppointmentTimestamp = (appointment: AppointmentResponse) => {
    const value = appointment.datetime_start ?? appointment.appointment_datetime;
    const timestamp = new Date(value.replace(" ", "T")).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const fetchClientAppointments = async (
    clientId: number
): Promise<AppointmentResponse[]> => {
    const response = await apiClient.get<unknown>("/appointments", {
        params: { client_id: clientId, sort: "-id" },
    });

    return normalizeListPayload<AppointmentResponse>(response.data).rows
        .map((appointment) => ({
            ...appointment,
            comment: appointment.comment ?? null,
        }))
        .slice()
        .sort((a, b) => {
            const dateDiff = getAppointmentTimestamp(b) - getAppointmentTimestamp(a);

            return dateDiff || b.id - a.id;
        });
};
