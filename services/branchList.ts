// services/userApi.ts
import apiClient from "./api";


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
    const response = await apiClient.post<Branch[]>(`/branches?companyId=${companyId}`);
    return response.data;
};
