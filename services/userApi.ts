// services/userApi.ts
import apiClient from "./api";

// Интерфейс для данных, отправляемых на сервер
interface UserPayload {
    username: string;
    password: string;
    email: string;
    name: string;
    last_name: string;
}

// Интерфейс для ответа от сервера
interface UserResponse {
    id: number;
    username: string;
    email: string;
    name: string;
    last_name: string;
    createdAt: string;
    updatedAt: string;
}

// Функция для регистрации пользователя
export const registerUser = async (data: UserPayload): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>("/auth/register", data); // Отправляем POST-запрос
    return response.data; // Возвращаем данные из ответа
};
