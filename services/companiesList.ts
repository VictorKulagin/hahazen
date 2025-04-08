// services/userApi.ts
import apiClient from "./api";


// Интерфейс для ответа от сервера (список филиалов)
interface companiesL {
    id: number;
    name: string;
    address: string;
    phone: string;
    companyId: number;
}

export const companiesList = async (): Promise<companiesL> => {
    const response = await apiClient.get<companiesL>(`/companies`);
    return response.data;
};
