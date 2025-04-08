// services/userApi.ts
import apiClient from "./api";

// Интерфейс для ответа от сервера
interface CabinetResponse {
    access_token: string;
    name: string;
    email: string;
    last_name: string;
    phone: string;
    type: string;
    id: number;
}

// Функция для получения информации о пользователе
export const cabinetDashboard = async (): Promise<CabinetResponse> => {
    const response = await apiClient.get<CabinetResponse>("/users/whoami"); // GET-запрос без тела
    return response.data; // Возвращаем данные из ответа
};
