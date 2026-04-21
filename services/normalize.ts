export type ListMeta = Record<string, unknown> | null;

export type NormalizedListPayload<T> = {
    rows: T[];
    meta: ListMeta;
};

type ListEnvelope<T> = {
    data?: T[];
    items?: T[];
    _meta?: ListMeta;
    meta?: ListMeta;
};

export const normalizeListPayload = <T>(payload: unknown): NormalizedListPayload<T> => {
    if (Array.isArray(payload)) {
        return { rows: payload as T[], meta: null };
    }

    if (payload && typeof payload === "object") {
        const envelope = payload as ListEnvelope<T>;
        const rows = Array.isArray(envelope.data)
            ? envelope.data
            : Array.isArray(envelope.items)
                ? envelope.items
                : [];
        const meta = envelope._meta ?? envelope.meta ?? null;

        return {
            rows,
            meta: meta && typeof meta === "object" ? meta : null,
        };
    }

    return { rows: [], meta: null };
};
