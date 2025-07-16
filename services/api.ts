// services/api.ts
import axios, { AxiosInstance } from "axios";
import { EventSourcePolyfill } from 'event-source-polyfill';

// Создаем экземпляр axios для работы с API
const apiClient: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // Базовый URL для API
    headers: {
        "Content-Type": "application/json", // Тип данных
    },
});

// Добавляем токен авторизации автоматически
apiClient.interceptors.request.use((config) => {
    //const token = localStorage.getItem("access_token"); // Получаем токен из localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`; // Добавляем токен в запрос
    }
    return config;
});

// SSE клиент с авторизацией
export const createSSEConnection = (path: string): EventSourcePolyfill => {
    const token = typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    // Добавляем параметры переподключения
    const retryStrategy = (attempt: number): number =>
        Math.min(1000 * Math.pow(2, attempt), 30000);

    return new EventSourcePolyfill(`${apiClient.defaults.baseURL}${path}`, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        withCredentials: false,
        heartbeatTimeout: 120000, // 2 минуты
        //@ts-ignore
        connectionTimeout: 20000,
        retryInterval: retryStrategy,
        withEventSource: {
            //@ts-ignore
            errorHandler: (error) => {
                console.log('[SSE] Protocol Error:', error);
            }
        }
    });
};
export default apiClient;
