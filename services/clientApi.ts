import apiClient from "./api";
import { ListMeta, normalizeListPayload } from "./normalize";

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

export interface ClientsApiResponse {
    _links?: {
        next?: { href: string };
        prev?: { href: string };
        first?: { href: string };
        last?: { href: string };
    };
    _meta?: ListMeta;
    meta?: ListMeta;
    data: Client[];
}

export const fetchClients = async (params?: {
    search?: string;
    page?: number;
    per_page?: number;
}): Promise<ClientsApiResponse> => {
    try {
        const response = await apiClient.get<ClientsApiResponse | Client[]>("/clients", {
            params,
        });
        const normalized = normalizeListPayload<Client>(response.data);

        return {
            ...(Array.isArray(response.data) ? {} : response.data),
            data: normalized.rows,
            _meta: normalized.meta,
        };
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

export const createClient = async (data: Client): Promise<Client> => {
    const response = await apiClient.post<Client>("/clients", data);
    return response.data;
};

export const updateClient = async (
    id: number,
    data: Client
): Promise<Client> => {
    const response = await apiClient.put<Client>(`/clients/${id}`, data);
    return response.data;
};

export const deleteClient = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`/clients/${id}`);
    } catch (error) {
        console.error("Error deleting client:", error);
        throw error;
    }
};
