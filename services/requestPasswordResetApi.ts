// services/requestPasswordResetApi.ts
import apiClient from "./api";

export interface PasswordResetPayload {
    email: string;
}

export interface PasswordResetResponse {
    message: string;
}

export const requestPasswordResetApi = async (
    data: PasswordResetPayload
): Promise<PasswordResetResponse> => {
    const response = await apiClient.post<PasswordResetResponse>(
        "/auth/request-password-reset",
        data
    );

    return response.data;
};
