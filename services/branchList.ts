// services/userApi.ts
import apiClient from "./api";
import { normalizeListPayload } from "./normalize";


// Интерфейс для ответа от сервера (список филиалов) Выводит ответ при регистрации
interface Branch {
    id: number;
    name: string;
    address: string;
    phone: string;
    companyId: number;
}

export const branchList = async (companyId: number): Promise<Branch[]> => {
    //debugger;
    const response = await apiClient.post<unknown>(`/branches?companyId=${companyId}`);
    return normalizeListPayload<Branch>(response.data).rows;
};
