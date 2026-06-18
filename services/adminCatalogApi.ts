import axios from "axios";
import { authStorage } from "@/services/authStorage";

export type CatalogStatus = "draft" | "published" | "hidden" | "suspended" | string;
export type CatalogBookingMode = "hahazen" | "external" | "none";

export type AdminCatalogProfile = {
    id: number;
    branchId: number | null;
    slug: string;
    name: string;
    shortDescription: string | null;
    description: string | null;
    countryCode: string;
    city: string;
    address: string | null;
    phone: string | null;
    websiteUrl: string | null;
    instagramUrl: string | null;
    servicesSummary: string | null;
    galleryUrls: string[];
    status: CatalogStatus;
    bookingMode: CatalogBookingMode | string;
    externalBookingUrl: string | null;
    isPartner: boolean;
};

export type CreateAdminCatalogProfilePayload = {
    branch_id?: number;
    slug?: string;
    name: string;
    short_description: string;
    description?: string;
    country_code: "KG" | "KZ" | "RU";
    city: string;
    address?: string;
    phone?: string;
    website_url?: string;
    instagram_url?: string;
    services_summary?: string;
    booking_mode: CatalogBookingMode;
    external_booking_url?: string;
    consent_received_at?: number;
    consent_note?: string;
};

export type UpdateAdminCatalogProfilePayload = Partial<CreateAdminCatalogProfilePayload>;

type CatalogListEnvelope = {
    data?: unknown[];
    items?: unknown[];
};

const adminCatalogClient = axios.create({
    baseURL: "/api/admin/catalog",
});

const authorizationHeaders = (): Record<string, string> => {
    const token = authStorage.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

adminCatalogClient.interceptors.request.use((config) => {
    const token = authStorage.getToken();
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const asRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" ? value as Record<string, unknown> : {};

const read = (data: Record<string, unknown>, snake: string, camel: string = snake): unknown =>
    data[snake] ?? data[camel];

const nullableString = (value: unknown): string | null =>
    typeof value === "string" && value.length > 0 ? value : null;

const extractUrl = (value: unknown): string | null => {
    if (typeof value === "string" && value.length > 0) return value;
    const data = asRecord(value);
    return nullableString(data.url) ?? nullableString(data.src);
};

const normalizeGallery = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map(extractUrl).filter((url): url is string => Boolean(url));
    }

    if (typeof value === "string" && value.length > 0) {
        try {
            const parsed = JSON.parse(value) as unknown;
            return normalizeGallery(parsed);
        } catch {
            return [value];
        }
    }

    return [];
};

const findGallery = (data: Record<string, unknown>): string[] => {
    const direct = normalizeGallery(read(data, "gallery_urls", "galleryUrls"));
    if (direct.length > 0) return direct;

    const alternativeKeys = [
        "images",
        "image_urls",
        "imageUrls",
        "photos",
        "photo_urls",
        "photoUrls",
    ];

    for (const key of alternativeKeys) {
        const gallery = normalizeGallery(data[key]);
        if (gallery.length > 0) return gallery;
    }

    const inferred = Object.entries(data)
        .filter(([key]) => /gallery|image|photo/i.test(key))
        .flatMap(([, value]) => normalizeGallery(value));
    if (inferred.length > 0) return Array.from(new Set(inferred));

    const cover = nullableString(read(data, "cover_image_url", "coverImageUrl"));
    return cover ? [cover] : [];
};

const normalizeProfile = (value: unknown): AdminCatalogProfile => {
    const data = asRecord(value);

    return {
        id: Number(data.id),
        branchId: read(data, "branch_id", "branchId") == null
            ? null
            : Number(read(data, "branch_id", "branchId")),
        slug: String(data.slug ?? ""),
        name: String(data.name ?? ""),
        shortDescription: nullableString(read(data, "short_description", "shortDescription")),
        description: nullableString(data.description),
        countryCode: String(read(data, "country_code", "countryCode") ?? ""),
        city: String(data.city ?? ""),
        address: nullableString(data.address),
        phone: nullableString(data.phone),
        websiteUrl: nullableString(read(data, "website_url", "websiteUrl")),
        instagramUrl: nullableString(read(data, "instagram_url", "instagramUrl")),
        servicesSummary: nullableString(read(data, "services_summary", "servicesSummary")),
        galleryUrls: findGallery(data),
        status: String(data.status ?? "draft"),
        bookingMode: String(read(data, "booking_mode", "bookingMode") ?? "none"),
        externalBookingUrl: nullableString(read(data, "external_booking_url", "externalBookingUrl")),
        isPartner: Boolean(read(data, "is_partner", "isPartner")),
    };
};

const unwrapProfile = (payload: unknown): AdminCatalogProfile => {
    const data = asRecord(payload);
    return normalizeProfile(data.data ?? payload);
};

const shouldRetryDeleteWithMethodOverride = (error: unknown): boolean => {
    if (!axios.isAxiosError(error)) return false;
    return error.response?.status === 401 || error.response?.status === 405;
};

export const fetchAdminCatalogProfile = async (id: number): Promise<AdminCatalogProfile> => {
    const response = await adminCatalogClient.get<unknown>(`/salons/${id}`);
    return unwrapProfile(response.data);
};

export const fetchAdminCatalogProfiles = async (status?: string): Promise<AdminCatalogProfile[]> => {
    const response = await adminCatalogClient.get<unknown>("/salons", {
        params: {
            ...(status ? { status } : {}),
            page: 1,
            "per-page": 50,
        },
    });

    const rows = Array.isArray(response.data)
        ? response.data
        : (() => {
            const envelope = response.data as CatalogListEnvelope;
            return Array.isArray(envelope?.data)
                ? envelope.data
                : Array.isArray(envelope?.items)
                    ? envelope.items
                    : [];
        })();

    const profiles = rows.map(normalizeProfile);

    return Promise.all(profiles.map(async (profile) => {
        if (!Number.isFinite(profile.id)) return profile;
        try {
            return await fetchAdminCatalogProfile(profile.id);
        } catch {
            return profile;
        }
    }));
};

export const createAdminCatalogProfile = async (
    payload: CreateAdminCatalogProfilePayload,
): Promise<AdminCatalogProfile> => {
    const response = await adminCatalogClient.post<unknown>("/salons", payload);
    return unwrapProfile(response.data);
};

export const updateAdminCatalogProfile = async (
    id: number,
    payload: UpdateAdminCatalogProfilePayload,
): Promise<AdminCatalogProfile> => {
    const response = await adminCatalogClient.patch<unknown>(`/salons/${id}`, payload);
    return unwrapProfile(response.data);
};

export const uploadAdminCatalogImage = async (id: number, file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await adminCatalogClient.post<unknown>(`/salons/${id}/images`, formData);
    const data = asRecord(response.data);
    return nullableString(data.url);
};

export const deleteAdminCatalogImage = async (id: number, url: string): Promise<void> => {
    const payload = { url };

    try {
        await adminCatalogClient.delete(`/salons/${id}/images`, {
            data: payload,
            headers: authorizationHeaders(),
        });
    } catch (error) {
        if (!shouldRetryDeleteWithMethodOverride(error)) throw error;

        try {
            await adminCatalogClient.post(`/salons/${id}/images`, payload, {
                headers: {
                    ...authorizationHeaders(),
                    "X-Http-Method-Override": "DELETE",
                },
            });
        } catch {
            throw error;
        }
    }
};

export const publishAdminCatalogProfile = async (id: number): Promise<void> => {
    await adminCatalogClient.post(`/salons/${id}/publish`);
};

export const hideAdminCatalogProfile = async (id: number): Promise<void> => {
    await adminCatalogClient.post(`/salons/${id}/hide`);
};

export const suspendAdminCatalogProfile = async (id: number): Promise<void> => {
    await adminCatalogClient.post(`/salons/${id}/suspend`);
};
