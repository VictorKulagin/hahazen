// constants/queryKeys.ts
/*export const QUERY_KEYS = {
    appointments: ["appointments"] as const,
    appointmentsByBranchAndDate: (branchId?: number, startDate?: string, endDate?: string) =>
        ["appointmentsByBranchAndDate", branchId,  startDate, endDate] as const,
};*/



export const QUERY_KEYS = {
    appointments: ["appointments"] as const,
    appointmentsByBranchAndDate: (branchId?: number, startDate?: string, endDate?: string) =>
        ["appointmentsByBranchAndDate", branchId ?? 0, startDate ?? "", endDate ?? ""] as const,
    timetableAppointments: (branchId?: number, startDate?: string, endDate?: string) =>
        ["timetableAppointments", branchId ?? 0, startDate ?? "", endDate ?? ""] as const,
};
