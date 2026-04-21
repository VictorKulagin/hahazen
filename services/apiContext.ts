import apiClient from "./api";

export type ApiContext = {
    company_id: number;
    branch_id?: number | null;
    company_name?: string | null;
    branch_name?: string | null;
    role?: string | null;
    set_at?: number | null;
    permissions?: string[];
    label?: string;
};

type ContextsResponse = {
    contexts?: ApiContext[];
};

type CurrentContextResponse = {
    context?: ApiContext | null;
};

type SetContextResponse = {
    ok?: boolean;
    context?: ApiContext | null;
};

const unwrapContext = (payload: ApiContext | CurrentContextResponse | SetContextResponse | null): ApiContext | null => {
    if (!payload) return null;
    if ("context" in payload) return payload.context ?? null;
    return payload as ApiContext;
};

export const fetchApiContexts = async (): Promise<ApiContext[]> => {
    const response = await apiClient.get<ContextsResponse>("/me/contexts");
    return response.data.contexts ?? [];
};

export const fetchCurrentApiContext = async (): Promise<ApiContext | null> => {
    const response = await apiClient.get<ApiContext | CurrentContextResponse | null>("/me/context");
    return unwrapContext(response.data);
};

export const setApiContext = async (context: Pick<ApiContext, "company_id" | "branch_id">): Promise<ApiContext | null> => {
    const response = await apiClient.post<SetContextResponse | ApiContext>("/me/context", {
        company_id: context.company_id,
        branch_id: context.branch_id ?? null,
    });

    return unwrapContext(response.data);
};

export const ensureApiContext = async (): Promise<ApiContext | null> => {
    const current = await fetchCurrentApiContext().catch(() => null);
    if (current) return current;

    const contexts = await fetchApiContexts().catch(() => []);
    if (contexts.length !== 1) return null;

    return setApiContext({
        company_id: contexts[0].company_id,
        branch_id: contexts[0].branch_id ?? null,
    }).catch(() => null);
};
