// hooks/useEmployees.ts
"use client";
import {useQuery, useQueryClient, useMutation, UseMutationResult} from "@tanstack/react-query";
import {
    Employee,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    EmployeeCreatePayload,
    EmployeePermissionsUpdate,
    fetchEmployeePermissions,
    updateEmployeePermissions
} from "@/services/employeeApi";
import { useEffect, useMemo, useRef, useState } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import { createSSEConnection } from "@/services/api";
import { authStorage } from "@/services/authStorage";

export const useEmployees = (branchId?: number) => {
    const queryClient = useQueryClient();
    const eventSourceRef = useRef<EventSourcePolyfill | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const currentEmployee = authStorage.getEmployee();
    const currentRole = currentEmployee?.role ?? authStorage.getContext()?.role;
    const permissionsKey = authStorage.getPermissions().slice().sort().join("|");
    const authScope = `${currentEmployee?.id ?? "anonymous"}:${currentRole ?? "no-role"}:${permissionsKey}`;
    const employeesQueryKey = useMemo(
        () => ["employees", branchId, authScope] as const,
        [branchId, authScope]
    );

    const query = useQuery<Employee[], Error>({
        queryKey: employeesQueryKey,
        queryFn: () => fetchEmployees(branchId!),
        staleTime: 1000 * 60 * 5,
        refetchOnMount: "always",
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
        const hasFullScheduleView =
            authStorage.has("appointment:view") || authStorage.has("master:view");
        const hasOwnScheduleView = authStorage.has("appointment:view:own");
        if (currentRole === "master" && hasOwnScheduleView && !hasFullScheduleView) return;

        const newEventSource = createSSEConnection(
            `/sse/employees?branch_id=${branchId}`
        );

        const handleSSEMessage = (event: MessageEvent) => {
            try {
                const eventData = JSON.parse(event.data);

                // Определение типа события
                const eventType = eventData.type || 'full-update';
                const employeesData = eventData.data;

                queryClient.setQueryData<Employee[]>(
                    employeesQueryKey,
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
    }, [branchId, currentRole, employeesQueryKey, queryClient]);

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
                queryKey: employeesQueryKey,
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
        onSuccess: (createdEmployee, variables) => {
            const employeeForCache: Employee = {
                ...createdEmployee,
                branch_id: createdEmployee.branch_id ?? variables.branch_id,
            };

            queryClient.setQueriesData<Employee[]>(
                { queryKey: ["employees", variables.branch_id] },
                (oldEmployees) => {
                    if (!oldEmployees) return [employeeForCache];

                    const exists = oldEmployees.some(
                        (employee) => employee.id === employeeForCache.id
                    );

                    if (exists) {
                        return oldEmployees.map((employee) =>
                            employee.id === employeeForCache.id
                                ? employeeForCache
                                : employee
                        );
                    }

                    return [...oldEmployees, employeeForCache];
                }
            );
            queryClient.invalidateQueries({
                queryKey: ["employees", variables.branch_id],
            });
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

export const useEmployeePermissions = (employeeId?: number) => {
    return useQuery({
        queryKey: ["employee-permissions", employeeId],
        queryFn: () => fetchEmployeePermissions(employeeId!),
        enabled: !!employeeId,
        staleTime: 1000 * 60 * 5,
    });
};

export const useUpdateEmployeePermissions = (employeeId?: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: EmployeePermissionsUpdate) =>
            updateEmployeePermissions(employeeId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["employee-permissions", employeeId],
            });
            queryClient.invalidateQueries({ queryKey: ["employees"] });
        },
    });
};
