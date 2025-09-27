// services/servicesApi.ts
import apiClient from "./api";

// Интерфейс для сотрудника
export interface Services {
    id: number;
    branch_id: number;
    name: string;
    duration_minutes: number;
    base_price: number;
    online_booking: number;
    online_booking_name: string;
    online_booking_description: string;
}



// Интерфейс для связи мастера и услуги
export interface EmployeeService {
    service_id: number;
    individual_price: number;
    duration_minutes: number;
}

// Ответ с назначенными услугами мастера (расширяем базовую услугу)
/*export interface EmployeeServiceResponse extends Services {
    pivot: {
        employee_id: number;
        service_id: number;
        individual_price: number;
        duration_minutes: number;
    };
}*/

// Ответ с назначенными услугами мастера
export interface EmployeeServiceResponse {
    id: number;               // id связи
    service_id: number;
    employee_id: number;
    individual_price: number;
    duration_minutes: number;
    service: Services;        // объект с полной информацией об услуге
}

export const fetchServices = async (): Promise<Services[]> => {
    try {
        const response = await apiClient.get<Services[]>("/services");
        return response.data;
    } catch (error) {
        console.error("Ошибка при загрузке услуг:", error);
        throw new Error("Не удалось загрузить услуги");
    }
};

// Создание нового сотрудника
export const createServices = async (newServices: Omit<Services, 'id'>): Promise<Services> => {
    const response = await apiClient.post<Services>("/services", newServices);
    return response.data;
};

// Удаление сотрудника
export const deleteServices = async (id: number): Promise<void> => {
    await apiClient.delete(`/services/${id}`);
};

// Обновление сотрудника
export const updateServices = async (id: number, updatedData: Partial<Services>): Promise<Services> => {
    const response = await apiClient.put<Services>(`/services/${id}`, updatedData);
    return response.data;
};


// Синхронизация услуг мастера
export const syncEmployeeServices = async (
    employeeId: number,
    services: EmployeeService[]
): Promise<EmployeeServiceResponse[]> => {
    try {
        const response = await apiClient.post<EmployeeServiceResponse[]>(
            `/employees/${employeeId}/services`,
            { services }
        );
        return response.data;
    } catch (error) {
        console.error("Ошибка синхронизации услуг:", error);
        throw new Error("Не удалось обновить услуги мастера");
    }
};

// Получение услуг мастера
export const fetchEmployeeServices = async (
    employeeId: number
): Promise<EmployeeServiceResponse[]> => {
    try {
        const response = await apiClient.get<EmployeeServiceResponse[]>(
            `/employees/${employeeId}/services`
        );
        return response.data;
    } catch (error) {
        console.error("Ошибка загрузки услуг мастера:", error);
        throw new Error("Не удалось получить услуги мастера");
    }
};
