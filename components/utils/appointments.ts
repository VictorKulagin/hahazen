import { GroupedAppointments } from '@/hooks/useAppointments';
import { ScheduleEvent } from '@/components/ScheduleModule';
import { Employee } from '@/services/employeeApi';

export function flattenGroupedAppointments(
    grouped: GroupedAppointments,
    employees: Employee[]
): ScheduleEvent[] {
    const events: ScheduleEvent[] = [];

    for (const times of Object.values(grouped)) {
        for (const [time, appointments] of Object.entries(times)) {
            for (const a of appointments) {
                const masterIndex = employees.findIndex(e => e.id === a.employee_id);
                // @ts-ignore
                events.push({
                    id: String(a.id),
                    start: time,
                    end: "",  // Можно добавить логику расчёта
                    // @ts-ignore
                    text: a.services.map(s => s.name).join(", ") + ` (${a.client.name})`,
                    master: masterIndex >= 0 ? masterIndex : 0,
                });
            }
        }
    }

    return events;
}
