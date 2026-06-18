export type CatalogBooking = {
    mode: "hahazen" | "external" | "none" | string;
    url: string | null;
};

export type PublicSalonListItem = {
    id: number;
    slug: string;
    name: string;
    shortDescription: string | null;
    countryCode: string;
    city: string;
    address: string | null;
    servicesSummary: string | null;
    coverImageUrl: string | null;
    isPartner: boolean;
    booking: CatalogBooking;
};

export type PublicSalonDetail = PublicSalonListItem & {
    description: string | null;
    phone: string | null;
    websiteUrl: string | null;
    instagramUrl: string | null;
    galleryUrls: string[];
    seoTitle: string | null;
    seoDescription: string | null;
    updatedAt: string | null;
};

type PublicSalonListResponse = {
    data?: PublicSalonListItem[];
};

type PublicSalonDetailResponse = PublicSalonDetail | {
    data?: PublicSalonDetail;
};

export type PublicSalonListFilters = {
    countryCode?: string;
    city?: string;
    limit?: number;
};

const apiRoot = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.hahazen.com/api/v1").replace(/\/api\/v1\/?$/, "");
const publicCatalogRoot = (): string => typeof window === "undefined" ? apiRoot : "";

export const resolveCatalogAssetUrl = (url: string | null): string | null => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return `${apiRoot}/${url.replace(/^\/+/, "")}`;
};

export const buildPublicCatalogListUrl = (filters: PublicSalonListFilters = {}): string => {
    const params = new URLSearchParams();

    if (filters.countryCode) params.set("country_code", filters.countryCode);
    if (filters.city) params.set("city", filters.city);
    params.set("limit", String(filters.limit ?? 12));

    return `${publicCatalogRoot()}/public-api/catalog/salons?${params.toString()}`;
};

export const buildPublicCatalogDetailUrl = (slug: string): string =>
    `${publicCatalogRoot()}/public-api/catalog/salons/${encodeURIComponent(slug)}`;

export const unwrapPublicSalonDetail = (payload: PublicSalonDetailResponse): PublicSalonDetail => {
    if ("data" in payload && payload.data) return payload.data;
    return payload as PublicSalonDetail;
};

export const fetchPublicSalons = async (
    filters: PublicSalonListFilters = {},
): Promise<PublicSalonListItem[]> => {
    const response = await fetch(buildPublicCatalogListUrl(filters), {
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new Error("Не удалось загрузить каталог салонов.");
    }

    const payload = await response.json() as PublicSalonListResponse;
    return Array.isArray(payload.data) ? payload.data : [];
};

export const fetchPublicSalonDetail = async (slug: string): Promise<PublicSalonDetail> => {
    const response = await fetch(buildPublicCatalogDetailUrl(slug), {
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new Error("Не удалось загрузить карточку салона.");
    }

    const payload = await response.json() as PublicSalonDetailResponse;
    return unwrapPublicSalonDetail(payload);
};
