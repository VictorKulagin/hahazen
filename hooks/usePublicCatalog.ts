import { useQuery } from "@tanstack/react-query";
import {
    fetchPublicSalons,
    PublicSalonListFilters,
    PublicSalonListItem,
} from "@/services/publicCatalogApi";

export const publicSalonsQueryKey = (filters: PublicSalonListFilters = {}) => [
    "public-salons",
    filters.countryCode ?? "",
    filters.city ?? "",
    filters.limit ?? 12,
];

export const usePublicSalons = (filters: PublicSalonListFilters = {}) =>
    useQuery<PublicSalonListItem[], Error>({
        queryKey: publicSalonsQueryKey(filters),
        queryFn: () => fetchPublicSalons(filters),
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
