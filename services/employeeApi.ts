// services/employeeApi.ts
import apiClient from "./api";

// Интерфейс для сотрудника
export type EmployeeRole = "gd" | "admin" | "master";
// Интерфейс для сотрудника
export interface Employee {
    id: number;
    name: string;
    specialty: string;
    hire_date: string;
    branch_id: number;
    online_booking: number;
    description: string | null;
    email: string | null;
    gender: string | null;
    last_name: string | null;
    patronymic: string | null;
    phone: string | null;
    photo: string | null;
    role: string;
}


export interface EmployeeCreatePayload {
    branch_id: number;
    name: string;
    specialty: string;
    hire_date: string;
    online_booking: 0 | 1;
    role: string;          // <<< ДОЛЖЕН БЫТЬ NUMBER
    last_name?: string | null;
    phone?: string | null;
    email?: string | null;
}
// Получение списка сотрудников
export const fetchEmployees = async (branchId?: number): Promise<Employee[]> => {
    /*const response = await apiClient.get<Employee[]>("/employees", {
        params: { branch_id: branchId } // Добавляем параметр запроса
    });
    return response.data;*/
    try {
        console.log('Fetching employees for branch:', branchId);
        const response = await apiClient.get<Employee[]>("/employees", {
            params: { branch_id: branchId }
        });
        console.log('API Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error in fetchEmployees:', error);
        throw error;
    }
};

// Создание нового сотрудника
/*export const createEmployee = async (newEmployee: Omit<Employee, 'id'>): Promise<Employee> => {
    const response = await apiClient.post<Employee>("/employees", newEmployee);
    return response.data;
};*/


export const createEmployee = async (payload: EmployeeCreatePayload): Promise<Employee> => {
    console.log("📤 Отправляем сотрудника в API:", payload);

    try {
        const response = await apiClient.post<Employee>("/employees", payload);
        return response.data;
    } catch (error: any) {
        console.error("❌ Ошибка при создании сотрудника:", error.response?.data || error.message);
        throw error;
    }
};



// Удаление сотрудника
/*export const deleteEmployee = async (id: number): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
};*/
debugger;
export const deleteEmployee = async (id: number): Promise<void> => {
    debugger;
    console.log("🗑 Отправляем запрос на удаление сотрудника:", id);
    const response = await apiClient.delete(`/employees/${id}`);
    console.log("✅ Ответ API на удаление:", response.status, response.data);
};

// Обновление сотрудника
export const updateEmployee = async (id: number, updatedData: Partial<Employee>): Promise<Employee> => {
    const response = await apiClient.put<Employee>(`/employees/${id}`, updatedData);
    return response.data;
};

