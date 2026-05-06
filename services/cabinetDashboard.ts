// services/userApi.ts
import apiClient from "./api";

// Интерфейс для ответа от сервера
interface CabinetResponse {
    access_token?: string;
    username?: string;
    name: string;
    email: string;
    last_name: string | null;
    phone: string | null;
    type?: string | null;
    id: number;
}

type MeResponse = {
    user?: CabinetResponse;
    employee?: {
        role?: string | null;
    } | null;
} & Partial<CabinetResponse>;

// Функция для получения информации о пользователе
export const cabinetDashboard = async (): Promise<CabinetResponse> => {
    const response = await apiClient.get<MeResponse>("/me");
    const payload = response.data;
    const user = payload.user ?? payload;

    return {
        access_token: payload.access_token,
        id: user.id ?? 0,
        username: user.username,
        name: user.name ?? "",
        email: user.email ?? "",
        last_name: user.last_name ?? null,
        phone: user.phone ?? null,
        type: payload.employee?.role ?? payload.type ?? null,
    };
};
