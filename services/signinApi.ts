// services/userApi.ts
import apiClient from "./api";

// Интерфейс для данных, отправляемых на сервер
interface SigninPayload {
    email: string;
    password: string;
}

// Интерфейс для ответа от сервера
interface SigninResponse {
    access_token: string;
}

// Функция для регистрации пользователя
export const signinApi = async (data: SigninPayload): Promise<SigninResponse> => {
    const response = await apiClient.post<SigninResponse>("/auth/login", data); // Отправляем POST-запрос
    return response.data; // Возвращаем данные из ответа
};
