const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);
const looksLikeGenericAxiosError = (value: string) =>
    /^Request failed with status code \d+$/i.test(value);

const stringifyMessage = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (value == null) return "";
    return String(value);
};

const collectMessages = (value: unknown): string[] => {
    if (!value) return [];

    if (typeof value === "string") {
        return looksLikeHtml(value) ? [] : [value];
    }

    if (Array.isArray(value)) {
        return value.flatMap((item) => collectMessages(item));
    }

    if (typeof value === "object") {
        const data = value as Record<string, unknown>;
        const directMessages = [
            stringifyMessage(data.message),
            stringifyMessage(data.error),
            stringifyMessage(data.detail),
        ].filter(Boolean);

        if (directMessages.length > 0) return directMessages;

        if (data.errors) return collectMessages(data.errors);

        return Object.values(data).flatMap((item) => collectMessages(item));
    }

    return [];
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
    const axiosError = error as {
        message?: string;
        response?: { data?: unknown };
    };

    const responseMessages = collectMessages(axiosError?.response?.data);
    if (responseMessages.length > 0) {
        return Array.from(new Set(responseMessages)).join("\n");
    }

    if (
        typeof axiosError?.message === "string" &&
        !looksLikeGenericAxiosError(axiosError.message)
    ) {
        return axiosError.message;
    }

    return fallback;
};
