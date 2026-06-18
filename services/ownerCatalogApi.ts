import axios from "axios";
import apiClient from "@/services/api";

export type OwnerCatalogStatus = "draft" | "published" | "hidden" | "suspended" | string;
export type OwnerCatalogBookingMode = "hahazen" | "external" | "none";

export type OwnerCatalogProfile = {
    id: number;
    branchId: number | null;
    slug: string;
    name: string;
    shortDescription: string | null;
    description: string | null;
    countryCode: "KG" | "KZ" | "RU" | string;
    city: string;
    address: string | null;
    phone: string | null;
    websiteUrl: string | null;
    instagramUrl: string | null;
    servicesSummary: string | null;
    galleryUrls: string[];
    status: OwnerCatalogStatus;
    bookingMode: OwnerCatalogBookingMode | string;
    externalBookingUrl: string | null;
    isPartner: boolean;
};

export type OwnerCatalogProfilePayload = {
    slug?: string;
    name: string;
    shortDescription?: string;
    description?: string;
    countryCode: "KG" | "KZ" | "RU";
    city: string;
    address?: string;
    phone?: string;
    websiteUrl?: string;
    instagramUrl?: string;
    servicesSummary?: string;
    bookingMode: OwnerCatalogBookingMode;
    externalBookingUrl?: string;
    seoTitle?: string;
    seoDescription?: string;
};

type OwnerCatalogProfileRequest = {
    slug?: string;
    name: string;
    short_description?: string;
    description?: string;
    country_code: "KG" | "KZ" | "RU";
    city: string;
    address?: string;
    phone?: string;
    website_url?: string;
    instagram_url?: string;
    services_summary?: string;
    booking_mode: OwnerCatalogBookingMode;
    external_booking_url?: string | null;
    seo_title?: string;
    seo_description?: string;
};

type ProfileEnvelope = {
    data?: unknown;
};

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
            return normalizeGallery(JSON.parse(value) as unknown);
        } catch {
            return [value];
        }
    }

    return [];
};

const findGallery = (data: Record<string, unknown>): string[] => {
    const direct = normalizeGallery(read(data, "gallery_urls", "galleryUrls"));
    if (direct.length > 0) return direct;

    const fallback = normalizeGallery(data.images ?? data.photos ?? data.photoUrls ?? data.imageUrls);
    if (fallback.length > 0) return fallback;

    const cover = nullableString(read(data, "cover_image_url", "coverImageUrl"));
    return cover ? [cover] : [];
};

const unwrapProfile = (payload: unknown): OwnerCatalogProfile | null => {
    const envelope = asRecord(payload) as ProfileEnvelope;
    const raw = "data" in envelope ? envelope.data : payload;
    if (raw == null) return null;

    const data = asRecord(raw);
    return {
        id: Number(data.id),
        branchId: read(data, "branch_id", "branchId") == null
            ? null
            : Number(read(data, "branch_id", "branchId")),
        slug: String(data.slug ?? ""),
        name: String(data.name ?? ""),
        shortDescription: nullableString(read(data, "short_description", "shortDescription")),
        description: nullableString(data.description),
        countryCode: String(read(data, "country_code", "countryCode") ?? "KG"),
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

const profilePath = (branchId: number) => `/branches/${branchId}/public-profile`;

const toProfileRequest = (payload: OwnerCatalogProfilePayload): OwnerCatalogProfileRequest => ({
    slug: payload.slug,
    name: payload.name,
    short_description: payload.shortDescription,
    description: payload.description,
    country_code: payload.countryCode,
    city: payload.city,
    address: payload.address,
    phone: payload.phone,
    website_url: payload.websiteUrl,
    instagram_url: payload.instagramUrl,
    services_summary: payload.servicesSummary,
    booking_mode: payload.bookingMode,
    external_booking_url: payload.externalBookingUrl ?? null,
    seo_title: payload.seoTitle,
    seo_description: payload.seoDescription,
});

export const fetchOwnerCatalogProfile = async (branchId: number): Promise<OwnerCatalogProfile | null> => {
    const response = await apiClient.get<unknown>(profilePath(branchId));
    return unwrapProfile(response.data);
};

export const saveOwnerCatalogProfile = async (
    branchId: number,
    payload: OwnerCatalogProfilePayload,
): Promise<OwnerCatalogProfile> => {
    const response = await apiClient.put<unknown>(profilePath(branchId), toProfileRequest(payload));
    const profile = unwrapProfile(response.data);
    if (!profile) throw new Error("API не вернул карточку салона.");
    return profile;
};

export const publishOwnerCatalogProfile = async (branchId: number): Promise<void> => {
    await apiClient.post(`${profilePath(branchId)}/publish`);
};

export const hideOwnerCatalogProfile = async (branchId: number): Promise<void> => {
    await apiClient.post(`${profilePath(branchId)}/hide`);
};

export const uploadOwnerCatalogImage = async (branchId: number, file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<unknown>(`${profilePath(branchId)}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    const data = asRecord(response.data);
    return nullableString(data.url);
};

export const deleteOwnerCatalogImage = async (branchId: number, url: string): Promise<void> => {
    try {
        await apiClient.delete(`${profilePath(branchId)}/images`, {
            data: { url },
        });
    } catch (error) {
        if (!axios.isAxiosError(error) || error.response?.status !== 405) throw error;
        await apiClient.post(`${profilePath(branchId)}/images`, { url }, {
            headers: { "X-Http-Method-Override": "DELETE" },
        });
    }
};
