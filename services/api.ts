// services/api.ts
import axios, { AxiosInstance } from "axios";
import { EventSourcePolyfill } from "event-source-polyfill";
import { authStorage } from "@/services/authStorage";

const apiClient: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
    const token = authStorage.getToken();
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (res) => res,
    (err) => {
        if (typeof window !== "undefined" && err?.response?.status === 401) {
            authStorage.clear();
            // optional:
            // window.location.href = "/signin";
        }
        return Promise.reject(err);
    }
);

export const createSSEConnection = (path: string): EventSourcePolyfill => {
    const token = authStorage.getToken();
    const retryStrategy = (attempt: number): number => Math.min(1000 * Math.pow(2, attempt), 30000);

    return new EventSourcePolyfill(`${apiClient.defaults.baseURL}${path}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        withCredentials: false,
        heartbeatTimeout: 120000,
        // @ts-ignore
        connectionTimeout: 20000,
        retryInterval: retryStrategy,
        withEventSource: {
            // @ts-ignore
            errorHandler: (error) => console.log("[SSE] Protocol Error:", error),
        },
    });
};

export default apiClient;
