// services/userApi.ts
import apiClient from "./api";


// Интерфейс для ответа от сервера (список филиалов) Филиал в шапке
interface branchesL {
    id: number;
    name: string;
    address: string;
    phone: string;
    companyId: number;
}

export const branchesList = async (companyId: number): Promise<branchesL> => {
    const response = await apiClient.get<branchesL>(`/branches?companyId=${companyId}`);
    return response.data;
};
