export interface AppointmentService {
    service_id: number;
    qty: number;
    name?: string;
}


export interface AppointmentServiceRequest {
    service_id: number;
    qty: number;
}

/*export interface AppointmentRequest {
    client_id?: number;
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
    date: string; // YYYY-MM-DD
    time_start: string; // HH:mm
    time_end: string;   // HH:mm
    appointment_datetime: string; // YYYY-MM-DD HH:mm
    total_duration: number;
    individual_price: number;


    services: AppointmentService[];
}*/

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
}
