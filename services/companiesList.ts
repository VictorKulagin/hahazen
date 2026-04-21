// services/userApi.ts
import apiClient from "./api";
import { normalizeListPayload } from "./normalize";


// Интерфейс для ответа от сервера (список филиалов)
interface companiesL {
    id: number;
    name: string;
    address: string;
    phone: string;
    companyId: number;
}

export const companiesList = async (): Promise<companiesL[]> => {
    const response = await apiClient.get<unknown>(`/companies`);
    return normalizeListPayload<companiesL>(response.data).rows;
};
