import apiClient from "./api";

export interface BranchPayload {
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
}

export interface BranchResponse {
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
}

type BranchCreateResponse = BranchResponse | { data?: BranchResponse };

export const Addbranches = async (data: BranchPayload): Promise<BranchResponse> => {
    const response = await apiClient.post<BranchCreateResponse>("/branches", data);
    const payload = response.data;

    if ("data" in payload && payload.data) {
        return payload.data;
    }

    return payload as BranchResponse;
};
