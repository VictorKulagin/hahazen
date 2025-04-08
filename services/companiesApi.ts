// services/userApi.ts
import apiClient from "./api";

// Интерфейс для данных, отправляемых на сервер
interface UserPayload {
    name: string;
    address: string;
    phone: string;
    email: string;
}

// Интерфейс для ответа от сервера
interface UserResponse {
    name: string;
    address: string;
    phone: string;
    email: string;
    created_by: number;
    updated_by: number;
    id: number;
}

// Функция для регистрации пользователя
export const AddCompanies = async (data: UserPayload): Promise<UserResponse> => {
    debugger;
    const response = await apiClient.post<UserResponse>("/companies", data); // Отправляем POST-запрос
    return response.data; // Возвращаем данные из ответа
};
