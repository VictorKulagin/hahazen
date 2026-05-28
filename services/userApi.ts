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
    access_token?: string;
}

export interface AcceptInvitePayload {
    token: string;
    password: string;
}

export interface AcceptInviteResponse {
    access_token?: string;
    token_type?: "Bearer";
    user?: {
        id: number;
        username: string;
        email: string;
        name: string;
    };
    employee?: {
        id: number;
        company_id?: number;
        branch_id: number;
        role?: string;
    } | null;
    roles?: Record<string, any>;
    permissions?: string[];
    message?: string;
}

export interface InviteInfoResponse {
    has_account: boolean;
}

// Функция для регистрации пользователя
export const registerUser = async (data: UserPayload): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>("/auth/register", data); // Отправляем POST-запрос
    return response.data; // Возвращаем данные из ответа
};

export const acceptInvite = async (
    data: AcceptInvitePayload
): Promise<AcceptInviteResponse> => {
    const response = await apiClient.post<AcceptInviteResponse>(
        "/auth/accept-invite",
        data
    );

    return response.data;
};

export const fetchInviteInfo = async (
    token: string
): Promise<InviteInfoResponse> => {
    const response = await apiClient.get<InviteInfoResponse>(
        "/auth/invite-info",
        {
            params: { token },
        }
    );

    return response.data;
};
