// lib/sseManager.ts
/*import { NextApiResponse } from "next";
import EventEmitter from "events";

// Хранилище активных подключений
const clients = new Map<number, NextApiResponse[]>();

// EventEmitter для обработки событий
const emitter = new EventEmitter();

export function watchEmployees(branchId: number, callback: (data: any) => void) {
    // Добавляем обработчик событий для конкретного филиала
    const eventHandler = (data: any) => {
        callback(data);
    };

    emitter.on(`update-${branchId}`, eventHandler);

    // Функция очистки
    return () => {
        emitter.off(`update-${branchId}`, eventHandler);
    };
}

// Функция для отправки обновлений всем подключенным клиентам
export function notifyClients(branchId: number, data: any) {
    emitter.emit(`update-${branchId}`, data);
}

// Базовая реализация подписки на изменения БД (замените на вашу реальную логику)
export function setupDatabaseListeners() {
    // Здесь должна быть ваша логика подписки на изменения БД
    // Например, для PostgreSQL можно использовать LISTEN/NOTIFY
    // Это пример для демонстрации:
    setInterval(() => {
        // Эмулируем обновление данных каждые 5 секунд
        const mockData = [{ id: 1, name: "Test Employee" }];
        notifyClients(1, mockData); // Замените branchId на актуальный
    }, 5000);
}

// Инициализация слушателей БД (вызовите эту функцию при старте приложения)
setupDatabaseListeners();*/



// lib/sseManager.ts
import { QueryClient } from "@tanstack/react-query";

interface SSEManager {
    subscribe: (branchId: number, queryClient: QueryClient) => () => void;
}

export const createSSEManager = (baseUrl: string): SSEManager => {
    const activeConnections = new Map<number, EventSource>();

    return {
        subscribe: (branchId, queryClient) => {
            // Закрываем существующее соединение для этого branchId
            if (activeConnections.has(branchId)) {
                activeConnections.get(branchId)?.close();
            }

            // Создаем новое SSE соединение
            const es = new EventSource(
                `${baseUrl}/api/sse/employees?branch_id=${branchId}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                    },
                }
            );

            // Обработчик сообщений
            const handleUpdate = (event: MessageEvent) => {
                try {
                    const data = JSON.parse(event.data);
                    queryClient.setQueryData(['employees', branchId], data);
                } catch (error) {
                    console.error('SSE Data parsing error:', error);
                }
            };

            // Обработчик ошибок
            const handleError = (event: Event) => {
                console.error('SSE Error:', event);
                // Реализуйте реконнект с экспоненциальной задержкой
            };

            // Подписываемся на события
            es.addEventListener('update', handleUpdate);
            es.addEventListener('error', handleError);

            // Сохраняем соединение
            activeConnections.set(branchId, es);

            // Функция отписки
            return () => {
                es.removeEventListener('update', handleUpdate);
                es.removeEventListener('error', handleError);
                es.close();
                activeConnections.delete(branchId);
            };
        },
    };
};

// Экспортируем инстанс с настройками
export const sseManager = createSSEManager(process.env.NEXT_PUBLIC_API_BASE_URL!);
