// services/employeeApi.ts
import apiClient from "./api";


// Интерфейс для графика сотрудника
export interface EmployeeSchedule {
    id: number;
    employee_id: number;
    schedule_type: 'weekly' | 'cycle';
    start_date: string;
    end_date: string;
    night_shift: number;
    cycle_length?: number;
    periods: Array<[string | number, string, string]>; // День недели и время работы
}

// Получение списка графиков всех сотрудников
export const fetchEmployeeSchedules = async (): Promise<EmployeeSchedule[]> => {
    try {
        const response = await apiClient.get<EmployeeSchedule[]>("/employee-schedule");
        return response.data;
    } catch (error) {
        console.error('Error in fetchEmployeeSchedules:', error);
        throw error;
    }
};

// Получение графиков сотрудника за период
export const fetchEmployeeScheduleByPeriod = async (employeeId: number, startDate: string, endDate: string): Promise<EmployeeSchedule[]> => {
    try {
        const response = await apiClient.get<EmployeeSchedule[]>("/employee-schedule", {
            params: { employee_id: employeeId, start_date: startDate, end_date: endDate }
        });
        return response.data;
    } catch (error) {
        console.error('Error in fetchEmployeeScheduleByPeriod:', error);
        throw error;
    }
};

// Получение графиков по филиалу за период
export const fetchEmployeeScheduleByBranchAndPeriod = async (branchId: number, startDate: string, endDate: string): Promise<EmployeeSchedule[]> => {
    try {
        const response = await apiClient.get<EmployeeSchedule[]>("/employee-schedule", {
            params: { branch_id: branchId, start_date: startDate, end_date: endDate }
        });
        return response.data;
    } catch (error) {
        console.error('Error in fetchEmployeeScheduleByBranchAndPeriod:', error);
        throw error;
    }
};

// Получение графика по ID
export const fetchEmployeeScheduleById = async (scheduleId: number): Promise<EmployeeSchedule> => {
    try {
        const response = await apiClient.get<EmployeeSchedule>(`/employee-schedules/${scheduleId}`);
        return response.data;
    } catch (error) {
        console.error('Error in fetchEmployeeScheduleById:', error);
        throw error;
    }
};

// Создание графика сотрудника
export const createEmployeeSchedule = async (schedule: Omit<EmployeeSchedule, 'id'>): Promise<EmployeeSchedule> => {
    try {
        const response = await apiClient.post<EmployeeSchedule>("/employee-schedule/create", schedule);
        return response.data;
    } catch (error) {
        console.error('Error in createEmployeeSchedule:', error);
        throw error;
    }
};

// Обновление графика сотрудника
export const updateEmployeeSchedule = async (scheduleId: number, updatedSchedule: Partial<EmployeeSchedule>): Promise<EmployeeSchedule> => {
    try {
        const response = await apiClient.put<EmployeeSchedule>(`/employee-schedules/${scheduleId}`, updatedSchedule);
        return response.data;
    } catch (error) {
        console.error('Error in updateEmployeeSchedule:', error);
        throw error;
    }
};

// Удаление графика сотрудника
export const deleteEmployeeSchedule = async (scheduleId: number): Promise<void> => {
    try {
        await apiClient.delete(`/employee-schedules/${scheduleId}`);
    } catch (error) {
        console.error('Error in deleteEmployeeSchedule:', error);
        throw error;
    }
};

// Получение графика сотрудника на определённую дату
export const fetchEmployeeScheduleForDate = async (employeeId: number, date: string): Promise<EmployeeSchedule | null> => {
    try {
        const response = await apiClient.get<EmployeeSchedule>("/employee-schedule/schedule-for-date", {
            params: { employee_id: employeeId, date: date }
        });
        return response.data;
    } catch (error) {
        console.error('Error in fetchEmployeeScheduleForDate:', error);
        return null;
    }
};
/*Описание новых функций:
    fetchEmployeeSchedules — Получение списка всех графиков сотрудников.

    fetchEmployeeScheduleByPeriod — Получение графиков сотрудника за определённый период.

    fetchEmployeeScheduleByBranchAndPeriod — Получение графиков по филиалу за период.

    fetchEmployeeScheduleById — Получение графика по его ID.

    createEmployeeSchedule — Создание графика для сотрудника.

    updateEmployeeSchedule — Обновление графика сотрудника.

    deleteEmployeeSchedule — Удаление графика сотрудника.

    fetchEmployeeScheduleForDate — Получение графика сотрудника на определённую дату.
 */
