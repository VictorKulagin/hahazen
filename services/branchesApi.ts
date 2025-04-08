// services/userApi.ts
import apiClient from "./api";

// Интерфейс для данных, отправляемых на сервер
interface UserPayload {
    company_id: number;
    name: string;
    address: string;
    phone: string;
    email: string;
}

// Интерфейс для ответа от сервера
interface UserResponse {
    company_id: number;
    name: string;
    address: string;
    phone: string;
    email: string;
}

// Функция для регистрации пользователя
export const Addbranches = async (data: UserPayload): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>("/branches", data); // Отправляем POST-запрос
    return response.data; // Возвращаем данные из ответа
};
