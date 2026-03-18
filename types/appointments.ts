/*export interface AppointmentService {
    service_id: number;
    qty: number;
    name?: string;
}


export interface AppointmentServiceRequest {
    service_id: number;
    qty: number;
}


export interface AppointmentRequest {
    client_id?: number;      // ID клиента
    employee_id: number;     // ID мастера
    branch_id: number;       // ID филиала
    comment?: string;        // Опциональный комментарий
    date: string;            // YYYY-MM-DD
    time_start: string;      // HH:mm
    time_end: string;        // HH:mm
    services: AppointmentServiceRequest[];
}



export interface AppointmentResponse {
    id: number;
    appointment_datetime: string;
    total_duration: number;
    branch_id: number;
    employee_id: number;
    client: {
        id: number;
        name: string;
        last_name: string;
        phone: string;
    };
    services: AppointmentService[];
}*/

export interface AppointmentService {
    service_id: number;
    qty: number;
    name?: string;
}

export interface AppointmentServiceRequest {
    service_id: number;
    qty: number;
}

export type PaymentStatus = "unpaid" | "paid" | "partial";
export type PaymentMethod = "cash" | "card" | "transfer" | null;
export type VisitStatus = "expected" | "arrived" | "no_show";

export interface AppointmentRequest {
    client_id?: number;
    employee_id: number;
    branch_id: number;
    comment?: string;
    date: string;
    time_start: string;
    time_end: string;

    cost: number;
    payment_status: PaymentStatus;
    payment_method: PaymentMethod;
    visit_status: VisitStatus;

    services: AppointmentServiceRequest[];
}

export interface AppointmentResponse {
    id: number;
    appointment_datetime: string;
    total_duration: number;
    branch_id: number;
    employee_id: number;

    cost?: number;
    payment_status?: PaymentStatus;
    payment_method?: PaymentMethod;
    visit_status?: VisitStatus;
    comment?: string;

    client: {
        id: number;
        name: string;
        last_name: string;
        phone: string;
    };

    services: AppointmentService[];
}
