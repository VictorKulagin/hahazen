// services/resetPasswordApi.ts
import apiClient from "./api";

export interface ResetPasswordPayload {
    password: string;
}

export interface ResetPasswordResponse {
    message: string;
}

export const resetPasswordApi = async (
    token: string,
    data: ResetPasswordPayload
): Promise<ResetPasswordResponse> => {
    const response = await apiClient.post<ResetPasswordResponse>(
        `/auth/reset-password?token=${token}`,
        data
    );

    return response.data;
};
