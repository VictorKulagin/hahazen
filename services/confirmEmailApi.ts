import apiClient from "./api";

export interface ConfirmEmailResponse {
    message?: string;
}

const shouldRetryAsPost = (error: unknown) => {
    const status = (error as { response?: { status?: number } })?.response?.status;
    return status === 404 || status === 405;
};

export const confirmEmailApi = async (
    token: string
): Promise<ConfirmEmailResponse> => {
    try {
        const response = await apiClient.get<ConfirmEmailResponse>(
            "/auth/confirm-email",
            { params: { token } }
        );

        return response.data;
    } catch (error) {
        if (!shouldRetryAsPost(error)) throw error;

        const response = await apiClient.post<ConfirmEmailResponse>(
            "/auth/confirm-email",
            { token }
        );

        return response.data;
    }
};
