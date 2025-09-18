//components/utils/normalizeAppointments
import { ScheduleEvent } from "@/components/ScheduleModule";

export function normalizeAppointments(apiAppointments: any[], employees: any[]): ScheduleEvent[] {
    if (!employees || employees.length === 0) return [];

    return apiAppointments.map((appt) => {
        const masterIndex = employees.findIndex((e) => e.id === appt.employee_id);

        return {
            id: appt.id.toString(),
            start: appt.datetime_start?.split(" ")[1] ?? "00:00",
            end: appt.datetime_end?.split(" ")[1] ?? "",
            text: `${appt.services.map((s: any) => s.name).join(", ")} (${appt.client.name})`,
            master: masterIndex !== -1 ? masterIndex : 0,
            client: appt.client,        // 👈 сохраняем клиента
            services: appt.services,    // 👈 сохраняем услуги
        };
    });
}
