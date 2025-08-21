// services/clientApi.ts
import apiClient from "./api";
// Тип одной записи клиента
/*export interface Client {
    id: number;
    name: string;
    phone: string;
    email?: string;
    registration_date?: string;
}*/

export interface Client {
    id?: number;
    user_id?: number;
    company_id?: number;
    name: string;
    last_name?: string;
    patronymic?: string;
    phone?: string;
    email?: string;
    gender?: "male" | "female";
    vip?: 0 | 1;
    discount?: number;
    card_number?: string;
    birth_date?: string;
    forbid_online_booking?: 0 | 1;
    comment?: string;
    photo?: string | null;
}

// Тип ответа API
// Тип ответа API - ДОБАВЬТЕ export ЗДЕСЬ:
export interface ClientsApiResponse { // ← Добавлено export
    _links?: {
        next?: { href: string };
        prev?: { href: string };
        first?: { href: string };
        last?: { href: string };
    };
    data: Client[];
}

// Добавляем функцию получения клиентов
// Функция запроса клиентов
export const fetchClients = async (params?: {
    search?: string;
    page?: number;
    per_page?: number;
}): Promise<ClientsApiResponse> => { // ← Изменено с Client[] на ClientsApiResponse
    try {
        const response = await apiClient.get<ClientsApiResponse>("/clients", {
            params,
        });
        return response.data; // ← Возвращаем полный объект (не только response.data.data)
    } catch (error) {
        console.error("Error fetching clients:", error);
        throw error;
    }
};


export const fetchClientById = (id: number): Promise<Client> => {
    return apiClient
        .get(`/clients/${id}`)
        .then((response) => response.data as Client);
};

/*export const createClient = async (data: Client): Promise<Client> => {
    const response = await apiClient.post<Client>("/clients", data);
    return response.data;
};*/

export const updateClient = async (
    id: number,
    data: Client
): Promise<Client> => {
    const response = await apiClient.put<Client>(`/clients/${id}`, data);
    return response.data;
};

/*export const deleteClient = async (id: number): Promise<void> => {
    await apiClient.delete(`/clients/${id}`);
};*/
