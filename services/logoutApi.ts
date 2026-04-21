import apiClient from "./api";
import { authStorage } from "./authStorage";

export const logoutApi = async (): Promise<void> => {
    try {
        await apiClient.post("/auth/logout");
    } finally {
        authStorage.clear();
    }
};

