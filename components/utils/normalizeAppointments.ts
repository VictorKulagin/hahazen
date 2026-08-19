import type { ScheduleEvent } from "@/components/ScheduleModule";
import type { ScheduleAxis } from "@/services/companiesList";
import type { ScheduleResource } from "@/services/resourcesApi";

type AppointmentForSchedule = {
    id: number;
    employee_id?: number | null;
    resource_id?: number | null;
    datetime_start?: string;
    datetime_end?: string;
    services?: Array<{ name?: string }>;
    client?: { name?: string };
    payment_status?: ScheduleEvent["payment_status"];
    payment_method?: ScheduleEvent["payment_method"];
    visit_status?: ScheduleEvent["visit_status"];
    cost?: number;
    comment?: string | null;
};

type ScheduleEmployee = { id: number };

type NormalizeAppointmentsOptions = {
    axis?: ScheduleAxis;
    resources?: ScheduleResource[];
    includeUnassignedEmployeeColumn?: boolean;
};

export function normalizeAppointments(
    apiAppointments: AppointmentForSchedule[],
    employees: ScheduleEmployee[],
    options: NormalizeAppointmentsOptions = {}
): ScheduleEvent[] {
    const axis = options.axis ?? "employee";
    const resources = options.resources ?? [];
    const includeUnassignedEmployeeColumn =
        options.includeUnassignedEmployeeColumn ?? false;

    if (
        axis === "employee" &&
        employees.length === 0 &&
        !includeUnassignedEmployeeColumn
    ) return [];

    return apiAppointments.map((appointment) => {
        const employeeIndex = employees.findIndex(
            (employee) => employee.id === appointment.employee_id
        );
        const employeeColumnIndex = appointment.employee_id == null
            ? 0
            : includeUnassignedEmployeeColumn
                ? employeeIndex >= 0 ? employeeIndex + 1 : 0
                : Math.max(0, employeeIndex);
        const matchedResourceIndex = resources.findIndex(
            (resource) => resource.id === appointment.resource_id
        );
        const resourceColumnIndex = appointment.resource_id == null
            ? 0
            : matchedResourceIndex >= 0
                ? matchedResourceIndex + 1
                : 0;
        const serviceNames = (appointment.services ?? [])
            .map((service) => service.name)
            .filter(Boolean)
            .join(", ");

        return {
            id: appointment.id.toString(),
            start: appointment.datetime_start?.split(" ")[1] ?? "00:00",
            end: appointment.datetime_end?.split(" ")[1] ?? "",
            text: `${serviceNames || "Услуга"} (${appointment.client?.name ?? "Клиент"})`,
            master: axis === "resource"
                ? resourceColumnIndex
                : employeeColumnIndex,
            payment_status: appointment.payment_status,
            payment_method: appointment.payment_method,
            visit_status: appointment.visit_status,
            cost: appointment.cost,
            comment: appointment.comment ?? null,
        };
    });
}
