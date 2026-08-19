import apiClient from "@/services/api";

export type WhatsAppSettings = {
    confirmationEnabled: boolean;
    cancellationEnabled: boolean;
    reminderEnabled: boolean;
    reminderHoursBefore: number;
    updatedAt: string | null;
};

export type WhatsAppSettingsPayload = Pick<
    WhatsAppSettings,
    "confirmationEnabled" | "cancellationEnabled" | "reminderEnabled" | "reminderHoursBefore"
>;

type CompanyWhatsAppSettingsRequest = {
    whatsapp_notify_created: boolean;
    whatsapp_notify_cancelled: boolean;
    whatsapp_notify_reminder: boolean;
    whatsapp_reminder_hours: number;
};

const DEFAULT_SETTINGS: WhatsAppSettings = {
    confirmationEnabled: false,
    cancellationEnabled: false,
    reminderEnabled: false,
    reminderHoursBefore: 2,
    updatedAt: null,
};

const companyPath = (companyId: number) => `/companies/${companyId}`;

const asRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" ? value as Record<string, unknown> : {};

const read = (data: Record<string, unknown>, ...keys: string[]): unknown => {
    for (const key of keys) {
        if (data[key] !== undefined) return data[key];
    }

    return undefined;
};

const readBoolean = (data: Record<string, unknown>, keys: string[], fallback: boolean): boolean => {
    const value = read(data, ...keys);

    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
        const normalized = value.toLowerCase();
        if (["true", "1", "yes"].includes(normalized)) return true;
        if (["false", "0", "no"].includes(normalized)) return false;
    }

    return fallback;
};

const readNumber = (data: Record<string, unknown>, keys: string[], fallback: number): number => {
    const value = read(data, ...keys);
    const numericValue = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
};

const unwrapCompanyPayload = (payload: unknown): Record<string, unknown> => {
    const envelope = asRecord(payload);
    return asRecord(envelope.data ?? envelope.company ?? payload);
};

const normalizeSettings = (payload: unknown): WhatsAppSettings => {
    const data = unwrapCompanyPayload(payload);
    const updatedAt = read(data, "updated_at", "updatedAt");

    return {
        confirmationEnabled: readBoolean(
            data,
            ["whatsapp_notify_created", "confirmation_enabled", "confirmationEnabled"],
            DEFAULT_SETTINGS.confirmationEnabled,
        ),
        cancellationEnabled: readBoolean(
            data,
            ["whatsapp_notify_cancelled", "cancellation_enabled", "cancellationEnabled"],
            DEFAULT_SETTINGS.cancellationEnabled,
        ),
        reminderEnabled: readBoolean(
            data,
            ["whatsapp_notify_reminder", "reminder_enabled", "reminderEnabled"],
            DEFAULT_SETTINGS.reminderEnabled,
        ),
        reminderHoursBefore: Math.min(
            48,
            Math.max(
                1,
                readNumber(
                    data,
                    ["whatsapp_reminder_hours", "reminder_hours_before", "reminderHoursBefore"],
                    DEFAULT_SETTINGS.reminderHoursBefore,
                ),
            ),
        ),
        updatedAt: typeof updatedAt === "string" || typeof updatedAt === "number"
            ? String(updatedAt)
            : null,
    };
};

const toCompanyRequest = (settings: WhatsAppSettingsPayload): CompanyWhatsAppSettingsRequest => ({
    whatsapp_notify_created: settings.confirmationEnabled,
    whatsapp_notify_cancelled: settings.cancellationEnabled,
    whatsapp_notify_reminder: settings.reminderEnabled,
    whatsapp_reminder_hours: settings.reminderHoursBefore,
});

export const getDefaultWhatsAppSettings = (): WhatsAppSettings => ({
    ...DEFAULT_SETTINGS,
});

export const isWhatsAppSettingsEnabled = (settings: WhatsAppSettings | null | undefined): boolean =>
    Boolean(settings?.confirmationEnabled || settings?.cancellationEnabled || settings?.reminderEnabled);

export const fetchWhatsAppSettings = async (
    companyId: number,
): Promise<WhatsAppSettings> => {
    const response = await apiClient.get<unknown>(companyPath(companyId));
    return normalizeSettings(response.data);
};

export const saveWhatsAppSettings = async (
    companyId: number,
    settings: WhatsAppSettingsPayload,
): Promise<WhatsAppSettings> => {
    const response = await apiClient.patch<unknown>(companyPath(companyId), toCompanyRequest(settings));
    return normalizeSettings(response.data);
};
