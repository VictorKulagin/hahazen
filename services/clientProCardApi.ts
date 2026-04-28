import apiClient from "./api";

export type ClientProCardType =
    | "body"
    | "text"
    | "face"
    | "hands"
    | "feet"
    | "dental"
    | "custom";

export type ClientProCardMark = {
    id: number;
    appointment_id?: number | null;
    service_id?: number | null;
    map_key?: string | null;
    mark_type?: string | null;
    x?: number | null;
    y?: number | null;
    title?: string | null;
    diagnosis?: string | null;
    description?: string | null;
    created_at?: number;
    updated_at?: number;
};

export type ClientProCard = {
    id: number | null;
    client_id: number;
    type: ClientProCardType;
    title?: string | null;
    text?: string | null;
    marks: ClientProCardMark[];
};

export type UpdateClientProCardPayload = Partial<
    Pick<ClientProCard, "type" | "title" | "text">
>;

export type UpsertClientProCardMarkPayload = Partial<
    Omit<ClientProCardMark, "id" | "created_at" | "updated_at">
>;

export const fetchClientProCard = async (
    clientId: number,
): Promise<ClientProCard> => {
    const response = await apiClient.get<ClientProCard>(
        `/clients/${clientId}/pro-card`,
    );

    return {
        ...response.data,
        marks: response.data.marks ?? [],
    };
};

export const updateClientProCard = async (
    clientId: number,
    payload: UpdateClientProCardPayload,
): Promise<ClientProCard> => {
    const response = await apiClient.put<ClientProCard>(
        `/clients/${clientId}/pro-card`,
        payload,
    );

    return {
        ...response.data,
        marks: response.data.marks ?? [],
    };
};

export const createClientProCardMark = async (
    clientId: number,
    payload: UpsertClientProCardMarkPayload,
): Promise<ClientProCardMark> => {
    const response = await apiClient.post<ClientProCardMark>(
        `/clients/${clientId}/pro-card/marks`,
        payload,
    );

    return response.data;
};

export const updateClientProCardMark = async (
    clientId: number,
    markId: number,
    payload: UpsertClientProCardMarkPayload,
): Promise<ClientProCardMark> => {
    const response = await apiClient.put<ClientProCardMark>(
        `/clients/${clientId}/pro-card/marks/${markId}`,
        payload,
    );

    return response.data;
};

export const deleteClientProCardMark = async (
    clientId: number,
    markId: number,
): Promise<void> => {
    await apiClient.delete(`/clients/${clientId}/pro-card/marks/${markId}`);
};
