// hooks/useEmployees.ts
"use client";
import {useQuery, useQueryClient, useMutation, UseMutationResult} from "@tanstack/react-query";
import {
    Employee,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    EmployeeCreatePayload
} from "@/services/employeeApi";
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
        /*onSuccess: (data) => console.log('Query data set:', data),
        onError: (err) => console.error('Query error:', err)*/
    });

    //debugger;

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
            console.error("SSE Connection Error:", {
                type: error.type,
                target: error.target,
                currentTarget: error.currentTarget,
                eventPhase: error.eventPhase,
            });
            setIsConnected(false);
            scheduleReconnect();
        };

        const handleSSEOpen = () => {
            setIsConnected(true);
            console.log('SSE connection established');
        };
        // @ts-ignore
        newEventSource.addEventListener("message", handleSSEMessage);
        // @ts-ignore
        newEventSource.addEventListener("error", handleSSEError);
        newEventSource.addEventListener("open", handleSSEOpen);

        eventSourceRef.current = newEventSource;

        return () => {
            // @ts-ignore
            newEventSource.removeEventListener("message", handleSSEMessage);
            // @ts-ignore
            newEventSource.removeEventListener("error", handleSSEError);
            newEventSource.removeEventListener("open", handleSSEOpen);
            newEventSource.close();
            eventSourceRef.current = null;
            setIsConnected(false);
        };
    }, [branchId, queryClient]);

    /*const scheduleReconnect = () => {
        if (!branchId) return;
        setTimeout(() => {
            queryClient.invalidateQueries(["employees", branchId]);
        }, 5000);
    };*/
    const scheduleReconnect = () => {
        if (!branchId) return;

        setTimeout(() => {
            queryClient.invalidateQueries({
                queryKey: ["employees", branchId],
            });
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



export const useUpdateEmployee = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (employee: Partial<Employee> & { id: number }) =>
            updateEmployee(employee.id, employee),

        onSuccess: () => {
            // ⬇️ Обновляем список сотрудников
            queryClient.invalidateQueries({ queryKey: ["employees"] });
        },

        onError: (error) => {
            console.error("Ошибка при обновлении сотрудника:", error);
        },
    });
};



export const useCreateEmployee = () => {
    const queryClient = useQueryClient();

    return useMutation<Employee, Error, EmployeeCreatePayload>({
        mutationFn: (payload: EmployeeCreatePayload) => createEmployee(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
        },
    });
};


export const useDeleteEmployee = (): UseMutationResult<void, unknown, number, unknown> => {
    const queryClient = useQueryClient();

    return useMutation<void, unknown, number>({
        mutationFn: async (id: number) => {
            console.log("🟠 Попали в mutationFn, id:", id);
            return deleteEmployee(id);
        },
        onSuccess: () => {
            console.log("✅ Сотрудник удалён, обновляем employees");
            queryClient.invalidateQueries({ queryKey: ["employees"] });
        },
        onError: (error: any) => {
            console.error("❌ Ошибка удаления:", error.response?.data || error.message);
        },
    });
};
