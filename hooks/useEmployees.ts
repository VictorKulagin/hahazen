// hooks/useEmployees.ts
"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Employee, fetchEmployees } from "@/services/employeeApi";
import { useEffect, useRef, useState } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import { createSSEConnection } from "@/services/api";

export const useEmployees = (branchId?: number) => {
    const queryClient = useQueryClient();
    const eventSourceRef = useRef<EventSourcePolyfill | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const query = useQuery<Employee[], Error>({
        queryKey: ["employees", branchId],

        queryFn: () => fetchEmployees(branchId!),
        staleTime: 1000 * 60 * 5,
        enabled: !!branchId,
        retry: 2,
        retryDelay: 1000,
        // Используем актуальные названия опций
        onSuccess: (data) => console.log('Query data set:', data),
        onError: (err) => console.error('Query error:', err)
    });

    debugger;

    useEffect(() => {
        if (query.data) {
            console.log('Query data:', query.data);
        }
    }, [query.data]);

    useEffect(() => {
        if (!branchId) return;

        const newEventSource = createSSEConnection(
            `/sse/employees/branch/${branchId}`
        );

        const handleSSEMessage = (event: MessageEvent) => {
            try {
                const eventData = JSON.parse(event.data);

                // Определение типа события
                const eventType = eventData.type || 'full-update';
                const employeesData = eventData.data;

                queryClient.setQueryData<Employee[]>(
                    ["employees", branchId],
                    (old) => {
                        if (eventType === 'full-update') {
                            return mergeEmployees([], employeesData);
                        }
                        return mergeEmployees(old || [], employeesData);
                    }
                );
            } catch (error) {
                console.error("Error parsing SSE data:", error);
            }
        };

        const handleSSEError = (error: Event) => {
            console.error("SSE Connection Error:", error);
            setIsConnected(false);
            scheduleReconnect();
        };

        const handleSSEOpen = () => {
            setIsConnected(true);
            console.log('SSE connection established');
        };

        newEventSource.addEventListener("message", handleSSEMessage);
        newEventSource.addEventListener("error", handleSSEError);
        newEventSource.addEventListener("open", handleSSEOpen);

        eventSourceRef.current = newEventSource;

        return () => {
            newEventSource.removeEventListener("message", handleSSEMessage);
            newEventSource.removeEventListener("error", handleSSEError);
            newEventSource.removeEventListener("open", handleSSEOpen);
            newEventSource.close();
            eventSourceRef.current = null;
            setIsConnected(false);
        };
    }, [branchId, queryClient]);

    const scheduleReconnect = () => {
        if (!branchId) return;
        setTimeout(() => {
            queryClient.invalidateQueries(["employees", branchId]);
        }, 5000);
    };

    const mergeEmployees = (oldData: Employee[], newData: Employee[]) => {
        const merged = [...oldData];
        newData.forEach(employee => {
            const index = merged.findIndex(e => e.id === employee.id);
            if (index > -1) merged[index] = employee;
            else merged.push(employee);
        });
        return merged;
    };

    return {
        ...query,
        data: query.data || [],
        isConnected,
    };
};






// hooks/useEmployees.ts
/*"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Employee, fetchEmployees } from "@/services/employeeApi";
import { useEffect, useRef } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import { createSSEConnection } from "@/services/api";

export const useEmployees = (branchId?: number) => {
    const queryClient = useQueryClient();
    const eventSourceRef = useRef<EventSourcePolyfill | null>(null);

    const query = useQuery<Employee[], Error>({
        queryKey: ["employees", branchId],
        queryFn: () => fetchEmployees(branchId!),
        staleTime: 1000 * 60 * 5, // 5 минут
        enabled: !!branchId,
        retry: 2,
        retryDelay: 1000,
    });

    useEffect(() => {
        if (!branchId) return;

        // Создаем новое соединение SSE
        const newEventSource = createSSEConnection(
            `/sse/employees/branch/${branchId}`
        );

        const handleSSEMessage = (event: MessageEvent) => {
            try {
                const updatedData = JSON.parse(event.data) as Employee[];

                // Оптимистичное обновление данных с сохранением порядка
                queryClient.setQueryData<Employee[]>(
                    ["employees", branchId],
                    (old) => mergeEmployees(old || [], updatedData)
                );
            } catch (error) {
                console.error("Error parsing SSE data:", error);
            }
        };

        const handleSSEError = (error: Event) => {
            console.error("SSE Connection Error:", error);
            queryClient.cancelQueries(["employees", branchId]);
            scheduleReconnect();
        };

        newEventSource.addEventListener("message", handleSSEMessage);
        newEventSource.addEventListener("error", handleSSEError);

        // Сохраняем ссылку на соединение
        eventSourceRef.current = newEventSource;

        return () => {
            // Закрываем соединение при размонтировании или изменении branchId
            newEventSource.removeEventListener("message", handleSSEMessage);
            newEventSource.removeEventListener("error", handleSSEError);
            newEventSource.close();
            eventSourceRef.current = null;
        };
    }, [branchId, queryClient]);

    const scheduleReconnect = () => {
        if (!branchId) return;

        setTimeout(() => {
            queryClient.invalidateQueries(["employees", branchId]);
        }, 5000);
    };

    // Функция для безопасного обновления данных
    const mergeEmployees = (oldData: Employee[], newData: Employee[]) => {
        const merged = [...oldData];

        newData.forEach(employee => {
            const index = merged.findIndex(e => e.id === employee.id);
            if (index > -1) {
                merged[index] = employee; // Обновление существующего
            } else {
                merged.push(employee); // Добавление нового
            }
        });

        return merged;
    };

    return {
        ...query,
        data: query.data || [],
        isConnected: eventSourceRef.current?.readyState === EventSourcePolyfill.OPEN,
    };
};*/







/*export const useEmployees = (branchId?: number) => {
    const queryClient = useQueryClient();
    const queryKey = ["employees", branchId];

    const queryResult = useQuery<Employee[], Error>({
        queryKey,
        queryFn: () => fetchEmployees(branchId),
        staleTime: 100000,
        retry: 1,
    });

    useEffect(() => {
        if (!branchId) return;

        const eventSource = new EventSource(`http://hahazen.api.hahahome.live/api/v1/employees/branch?branch_id=${branchId}`);

        const handleUpdate = (event: MessageEvent) => {
            const updatedEmployees: Employee[] = JSON.parse(event.data);
            queryClient.setQueryData(queryKey, updatedEmployees);
        };

        eventSource.addEventListener("update", handleUpdate);
        eventSource.onerror = (error) => {
            console.error("SSE error:", error);
            eventSource.close();
        };

        return () => {
            eventSource.removeEventListener("update", handleUpdate);
            eventSource.close();
        };
    }, [branchId, queryClient, queryKey]);

    return queryResult;
};*/


/*export const useEmployees = (branchId?: number) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!branchId) return;

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        // Дебаг
        console.log("API Base URL:", apiBaseUrl);
        console.log("Formed URL:", `${apiBaseUrl}/sse/employees/branch/${branchId}`);

        const url = new URL(
            `${apiBaseUrl}/sse/employees/branch/${branchId}`
        );

        // Добавляем токен
        const token = localStorage.getItem("access_token");
        if (token) {
            url.searchParams.append("token", token);
        }

        const eventSource = new EventSource(url.toString());


        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data) as Employee[];
            console.log(event + " EVE " + data);
            queryClient.setQueryData(["employees", branchId], data);
        };

        return () => {
            eventSource.close();
        };
    }, [branchId]);

    return useQuery<Employee[], Error>({
        queryKey: ["employees", branchId],
        queryFn: () => fetchEmployees(branchId),
        staleTime: Infinity, // Отключаем фоновое обновление
        retry: 1,
    });
};*/


/*export const useEmployees = (branchId?: number) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!branchId) return;

        let eventSource: EventSourcePolyfill | null = null;
        let retries = 0;
        const MAX_RETRIES = 3;


        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data) as Employee[];
                queryClient.setQueryData(["employees", branchId], data);
                retries = 0;
            } catch (error) {
                console.error("SSE Data parsing error:", error);
            }
        };

        const handleError = (event: Event) => {
            console.error("SSE Connection error:", {
                status: (event.target as EventSourcePolyfill)?.readyState,
                message: (event as ErrorEvent).message,
            });

            if (retries < MAX_RETRIES) {
                retries++;
                setTimeout(connect, 5000 * retries);
            }
        };

        const connect = () => {
            try {
                eventSource?.close();
                eventSource = createSSEConnection(`/sse/employees/branch/${branchId}`);

                eventSource.addEventListener('message', handleMessage);
                eventSource.addEventListener('error', handleError);
                eventSource.addEventListener('open', () => {
                    console.log("SSE Connection opened");
                    retries = 0;
                });

            } catch (error) {
                console.error("SSE Initialization error:", error);
            }
        };

        connect();

        return () => {
            if (eventSource) {
                eventSource.removeEventListener('message', handleMessage);
                eventSource.removeEventListener('error', handleError);
                eventSource.close();
                eventSource = null;
            }
        };
    }, [branchId, queryClient]);

    return useQuery<Employee[], Error>({
        queryKey: ["employees", branchId],
        queryFn: () => fetchEmployees(branchId!),
        staleTime: Infinity,
        enabled: !!branchId,
        retry: 0,
    });
};*/


