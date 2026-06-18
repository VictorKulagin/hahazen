import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    ExternalLink,
    Globe2,
    Instagram,
    MapPin,
    Phone,
    Scissors,
} from "lucide-react";
import {
    buildPublicCatalogDetailUrl,
    resolveCatalogAssetUrl,
    unwrapPublicSalonDetail,
} from "@/services/publicCatalogApi";
import type { PublicSalonDetail } from "@/services/publicCatalogApi";
import SalonGallery from "./SalonGallery";

export const dynamic = "force-dynamic";

type PageProps = {
    params: Promise<{ slug: string }>;
};

const fetchSalon = async (slug: string): Promise<PublicSalonDetail | null> => {
    const response = await fetch(buildPublicCatalogDetailUrl(slug), {
        cache: "no-store",
        headers: { Accept: "application/json" },
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Не удалось загрузить карточку салона.");

    return unwrapPublicSalonDetail(await response.json());
};

const resolveBookingUrl = (url: string | null): string | null => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return url.startsWith("/") ? url : `/${url}`;
};

const getServiceTags = (servicesSummary: string | null): string[] =>
    (servicesSummary ?? "")
        .split(/[·,;|]+/)
        .map((service) => service.trim())
        .filter(Boolean)
        .slice(0, 6);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;

    try {
        const salon = await fetchSalon(slug);
        if (!salon) return {};

        const image = resolveCatalogAssetUrl(salon.galleryUrls?.[0] ?? salon.coverImageUrl);

        return {
            title: salon.seoTitle ?? `${salon.name} в ${salon.city} - Hahazen`,
            description: salon.seoDescription ?? salon.shortDescription ?? undefined,
            openGraph: {
                title: salon.seoTitle ?? salon.name,
                description: salon.seoDescription ?? salon.shortDescription ?? undefined,
                type: "website",
                images: image ? [{ url: image }] : undefined,
            },
        };
    } catch {
        return {};
    }
}

export default async function SalonPage({ params }: PageProps) {
    const { slug } = await params;
    const salon = await fetchSalon(slug);

    if (!salon) notFound();

    const gallery = (salon.galleryUrls?.length ? salon.galleryUrls : [salon.coverImageUrl])
        .map(resolveCatalogAssetUrl)
        .filter((url): url is string => Boolean(url));
    const bookingUrl = resolveBookingUrl(salon.booking?.url ?? null);
    const location = [salon.city, salon.address].filter(Boolean).join(" · ");
    const serviceTags = getServiceTags(salon.servicesSummary);

    return (
        <main className="min-h-screen bg-[#061713] text-white">
            <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_20%_10%,rgba(69,223,185,0.22),transparent_34%),linear-gradient(145deg,#092620,#061713_62%,#030907)]">
                <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
                    <Link href="/#catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-[#67e8ca] transition hover:text-white">
                        <ArrowLeft className="h-4 w-4" />
                        Назад в каталог
                    </Link>

                    <div className="py-10">
                        <div className="overflow-hidden rounded-[2rem] border border-[#45dfb9]/20 bg-[#08231d] shadow-2xl shadow-black/25 lg:grid lg:grid-cols-[minmax(0,1.08fr)_420px]">
                            <SalonGallery gallery={gallery} salonName={salon.name} variant="hero" />

                            <aside className="relative border-t border-white/10 bg-[#08231d] p-6 backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:-top-16 before:h-16 before:bg-gradient-to-t before:from-[#08231d] before:to-transparent sm:p-8 lg:border-t-0 lg:before:inset-y-0 lg:before:-left-20 lg:before:h-auto lg:before:w-20 lg:before:bg-gradient-to-r lg:before:from-transparent lg:before:to-[#08231d]">
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/70">
                                    <MapPin className="h-3.5 w-3.5 text-[#45dfb9]" />
                                    {location || salon.city}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/70">
                                    {salon.countryCode}
                                </span>
                                {salon.isPartner && (
                                    <span className="rounded-full border border-[#45dfb9]/30 bg-[#16483d]/80 px-3 py-1 text-xs font-semibold text-[#6ff0d0]">
                                        Партнёр Hahazen
                                    </span>
                                )}
                            </div>

                            <h1 className="mt-7 text-4xl font-black tracking-tight sm:text-5xl">{salon.name}</h1>
                            {salon.shortDescription && (
                                <p className="mt-5 text-base leading-7 text-[#b9d1cb]">{salon.shortDescription}</p>
                            )}

                            {serviceTags.length > 0 && (
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {serviceTags.map((service) => (
                                        <span key={service} className="rounded-full border border-[#45dfb9]/15 bg-[#12352e] px-3 py-1 text-xs font-semibold text-[#b9d1cb]">
                                            {service}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                {bookingUrl ? (
                                    <a href={bookingUrl} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#45dfb9] px-5 py-3 text-sm font-bold text-[#032018] transition hover:bg-[#67e8ca]">
                                        <CalendarDays className="h-4 w-4" />
                                        Записаться
                                    </a>
                                ) : (
                                    <div className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/60">
                                        Онлайн-запись недоступна
                                    </div>
                                )}
                                {salon.phone && (
                                    <a href={`tel:${salon.phone}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:border-[#45dfb9]/40 hover:bg-white/[0.04]">
                                        <Phone className="h-4 w-4 text-[#45dfb9]" />
                                        Позвонить
                                    </a>
                                )}
                            </div>

                            {(salon.websiteUrl || salon.instagramUrl) && (
                                <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/70">
                                    {salon.websiteUrl && (
                                        <a href={salon.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-[#67e8ca]">
                                            <Globe2 className="h-4 w-4" />
                                            Сайт
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    )}
                                    {salon.instagramUrl && (
                                        <a href={salon.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-[#67e8ca]">
                                            <Instagram className="h-4 w-4" />
                                            Instagram
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    )}
                                </div>
                            )}
                            </aside>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <article className="rounded-3xl border border-white/10 bg-[#0c221f]/72 p-6">
                    <h2 className="text-2xl font-bold">О салоне</h2>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#b9d1cb]">
                        {salon.description || salon.shortDescription || "Описание салона скоро появится."}
                    </p>
                </article>

                <aside className="h-fit rounded-3xl border border-white/10 bg-[#0c221f]/72 p-6 lg:sticky lg:top-6">
                    <h2 className="text-lg font-bold">Информация</h2>
                    <dl className="mt-5 space-y-4 text-sm">
                        <div>
                            <dt className="text-white/45">Город</dt>
                            <dd className="mt-1 font-semibold text-white">{salon.city}</dd>
                        </div>
                        {salon.address && (
                            <div>
                                <dt className="text-white/45">Адрес</dt>
                                <dd className="mt-1 font-semibold text-white">{salon.address}</dd>
                            </div>
                        )}
                        {salon.phone && (
                            <div>
                                <dt className="text-white/45">Телефон</dt>
                                <dd className="mt-1 font-semibold text-white">{salon.phone}</dd>
                            </div>
                        )}
                        {salon.servicesSummary && (
                            <div>
                                <dt className="flex items-center gap-2 text-white/45">
                                    <Scissors className="h-4 w-4" />
                                    Услуги
                                </dt>
                                <dd className="mt-1 leading-6 text-white">{salon.servicesSummary}</dd>
                            </div>
                        )}
                    </dl>
                </aside>
            </section>
        </main>
    );
}
