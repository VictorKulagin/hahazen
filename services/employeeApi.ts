// services/employeeApi.ts
import apiClient from "./api";
import { authStorage } from "@/services/authStorage";
import { normalizeListPayload } from "./normalize";

// Интерфейс для сотрудника
export type EmployeeRole = "gd" | "admin" | "master";
// Интерфейс для сотрудника
export interface Employee {
    id: number;
    name: string;
    specialty: string;
    lvl: string | null;
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
    invite_token?: string | null;
    invite_sent_at?: number | null;
}


export interface EmployeeCreatePayload {
    branch_id: number;
    name: string;
    specialty: string;
    lvl?: string | null;
    hire_date: string;
    online_booking: 0 | 1;
    role: string;          // <<< ДОЛЖЕН БЫТЬ NUMBER
    last_name?: string | null;
    phone?: string | null;
    email?: string | null;
}

export interface EmployeeInviteResponse {
    ok: boolean;
    invite_sent_at: number;
    invite_token: string;
    existing_user: boolean;
}

export type EmployeePermissionMode = "inherit" | "allow" | "deny";

export type EmployeePermissionCell = {
    mode: EmployeePermissionMode;
    inheritedGranted: boolean;
    permissions: string[];
};

export type EmployeePermissionColumn = {
    key: string;
    label: string;
};

export type EmployeePermissionRow = {
    rowKey: string;
    moduleLabel: string;
    hint?: string;
    rowGroup?: string;
    cells: Record<string, EmployeePermissionCell | null>;
};

export type EmployeePermissionMatrix = {
    columns: EmployeePermissionColumn[];
    rows: EmployeePermissionRow[];
};

export type EmployeePermissionsResponse = {
    employeeRole: EmployeeRole | string;
    canEdit: boolean;
    matrix: EmployeePermissionMatrix;
};

export type EmployeePermissionsUpdate =
    | { reset: true }
    | {
    updates: Array<{
        permissions: string[];
        mode: EmployeePermissionMode;
    }>;
};
// Получение списка сотрудников
export const fetchEmployees = async (branchId?: number): Promise<Employee[]> => {
    /*const response = await apiClient.get<Employee[]>("/employees", {
        params: { branch_id: branchId } // Добавляем параметр запроса
    });
    return response.data;*/
    const currentEmployee = authStorage.getEmployee();
    const currentUser = authStorage.getUser();
    const currentRole = currentEmployee?.role ?? authStorage.getContext()?.role;
    const hasFullScheduleView =
        authStorage.has("appointment:view") || authStorage.has("master:view");
    const hasOwnScheduleView = authStorage.has("appointment:view:own");

    const ownEmployeeFallback = (): Employee[] => {
        if (
            currentEmployee?.id &&
            (!branchId || currentEmployee.branch_id === branchId)
        ) {
            return [
                {
                    id: currentEmployee.id,
                    name: currentUser?.name || "Сотрудник",
                    specialty: currentEmployee.role || "master",
                    lvl: null,
                    hire_date: "",
                    branch_id: currentEmployee.branch_id,
                    online_booking: 0,
                    description: null,
                    email: currentUser?.email ?? null,
                    gender: null,
                    last_name: null,
                    patronymic: null,
                    phone: null,
                    photo: null,
                    role: currentEmployee.role || "master",
                },
            ];
        }

        return [];
    };

    if (
        currentEmployee?.id &&
        currentRole === "master" &&
        hasOwnScheduleView &&
        !hasFullScheduleView
    ) {
        return ownEmployeeFallback();
    }

    try {
        console.log('Fetching employees for branch:', branchId);
        const response = await apiClient.get<unknown>("/employees", {
            params: { branch_id: branchId }
        });
        console.log('API Response:', response.data);
        return normalizeListPayload<Employee>(response.data).rows;
    } catch (error: any) {
        console.error('Error in fetchEmployees:', error);
        if (error?.response?.status === 403) {
            const fallback = ownEmployeeFallback();
            if (fallback.length > 0) return fallback;
        }
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

export const inviteEmployee = async (
    id: number
): Promise<EmployeeInviteResponse> => {
    const response = await apiClient.post<EmployeeInviteResponse>(
        `/employees/${id}/invite`
    );

    return response.data;
};

export const fetchEmployeePermissions = async (
    id: number
): Promise<EmployeePermissionsResponse> => {
    const response = await apiClient.get<EmployeePermissionsResponse>(
        `/employees/${id}/permissions`
    );

    return response.data;
};

export const updateEmployeePermissions = async (
    id: number,
    payload: EmployeePermissionsUpdate
): Promise<EmployeePermissionsResponse> => {
    const response = await apiClient.put<EmployeePermissionsResponse>(
        `/employees/${id}/permissions`,
        payload
    );

    return response.data;
};

