import apiClient from "./api";
import { normalizeListPayload } from "./normalize";

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
    bonus_spend_max_percent?: number | null;
    bonus_points_label?: string | null;
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
        | "bonus_spend_max_percent"
        | "bonus_points_label"
    >
>;

export const companiesList = async (): Promise<Company[]> => {
    const response = await apiClient.get<unknown>("/companies");
    return normalizeListPayload<Company>(response.data).rows;
};

export const updateCompany = async (
    id: number,
    data: CompanyUpdatePayload
): Promise<Company> => {
    const response = await apiClient.patch<Company>(`/companies/${id}`, data);
    return response.data;
};
