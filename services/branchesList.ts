// services/userApi.ts
import apiClient from "./api";
import { authStorage } from "@/services/authStorage";
import { normalizeListPayload } from "./normalize";


// Интерфейс для ответа от сервера (список филиалов) Филиал в шапке
interface branchesL {
    id: number;
    company_id?: number;
    name: string;
    legal_name?: string | null;
    city?: string | null;
    timezone?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    description?: string | null;
    working_hours_json?: string | null;
    created_at?: number;
    updated_at?: number;
    companyId?: number;
}

export const branchesList = async (companyId: number): Promise<branchesL[]> => {
    try {
        const response = await apiClient.get<unknown>("/branches");
        return normalizeListPayload<branchesL>(response.data).rows;
    } catch (error: any) {
        if (error?.response?.status !== 403) {
            throw error;
        }

        const context = authStorage.getContext();
        if (!context?.branch_id || context.company_id !== companyId) {
            throw error;
        }

        return [
            {
                id: context.branch_id,
                name: context.branch_name || "Филиал",
                address: null,
                phone: null,
                companyId: context.company_id,
                company_id: context.company_id,
            },
        ];
    }
};
