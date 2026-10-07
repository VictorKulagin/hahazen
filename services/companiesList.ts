import apiClient from "./api";
import { normalizeListPayload } from "./normalize";

export type BookingAssignmentMode =
    | "client_picks_employee"
    | "admin_assigns";
export type ScheduleAxis = "employee" | "resource";
export type PublicBookingAxis = "employee" | "resource";
export type PublicResourceAssignment = "client_picks" | "auto_assigns";

export const DEFAULT_BOOKING_ASSIGNMENT_MODE: BookingAssignmentMode =
    "client_picks_employee";
export const DEFAULT_SCHEDULE_AXIS: ScheduleAxis = "employee";
export const DEFAULT_PUBLIC_BOOKING_AXIS: PublicBookingAxis = "employee";
export const DEFAULT_PUBLIC_RESOURCE_ASSIGNMENT: PublicResourceAssignment =
    "client_picks";

export interface Company {
    id: number;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    companyId?: number;
    country_code?: string | null;
    currency_code?: string | null;
    default_locale?: string | null;
    bonuses_enabled?: boolean;
    crm_enabled?: 0 | 1;
    bonus_spend_max_percent?: number | null;
    bonus_points_label?: string | null;
    booking_assignment_mode?: BookingAssignmentMode;
    schedule_axis?: ScheduleAxis;
    public_booking_axis?: PublicBookingAxis;
    public_resource_assignment?: PublicResourceAssignment;
    created_at?: number;
    updated_at?: number;
}

export type CompanyUpdatePayload = Partial<
    Pick<
        Company,
        | "name"
        | "address"
        | "phone"
        | "email"
        | "country_code"
        | "currency_code"
        | "bonuses_enabled"
        | "crm_enabled"
        | "bonus_spend_max_percent"
        | "bonus_points_label"
        | "booking_assignment_mode"
        | "schedule_axis"
        | "public_booking_axis"
        | "public_resource_assignment"
    >
>;

const withCompatibleCompanyDefaults = (company: Company): Company => ({
    ...company,
    booking_assignment_mode:
        company.booking_assignment_mode ?? DEFAULT_BOOKING_ASSIGNMENT_MODE,
    schedule_axis: company.schedule_axis ?? DEFAULT_SCHEDULE_AXIS,
    public_booking_axis:
        company.public_booking_axis ?? DEFAULT_PUBLIC_BOOKING_AXIS,
    public_resource_assignment:
        company.public_resource_assignment ??
        DEFAULT_PUBLIC_RESOURCE_ASSIGNMENT,
});

export const companiesList = async (): Promise<Company[]> => {
    const response = await apiClient.get<unknown>("/companies");
    return normalizeListPayload<Company>(response.data).rows.map(
        withCompatibleCompanyDefaults
    );
};

export const fetchCompany = async (id: number): Promise<Company> => {
    const response = await apiClient.get<Company>(`/companies/${id}`);
    return withCompatibleCompanyDefaults(response.data);
};

export const updateCompany = async (
    id: number,
    data: CompanyUpdatePayload
): Promise<Company> => {
    const response = await apiClient.patch<Company>(`/companies/${id}`, data);
    return withCompatibleCompanyDefaults(response.data);
};
