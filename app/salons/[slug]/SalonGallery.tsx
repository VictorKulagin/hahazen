"use client";

import { useState } from "react";

type SalonGalleryProps = {
    gallery: string[];
    salonName: string;
    variant?: "default" | "hero";
};

export default function SalonGallery({ gallery, salonName, variant = "default" }: SalonGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const selectedImage = gallery[selectedIndex];
    const isHero = variant === "hero";

    return (
        <div className={isHero ? "relative h-full min-h-[360px] lg:min-h-[520px]" : "space-y-5"}>
            <div className={isHero ? "h-full overflow-hidden bg-[#0c221f]/72" : "overflow-hidden rounded-3xl border border-white/10 bg-[#0c221f]/72"}>
                {selectedImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Catalog gallery uses API upload URLs directly.
                    <img
                        src={selectedImage}
                        alt={salonName}
                        className={isHero ? "h-full min-h-[360px] w-full object-cover lg:min-h-[520px]" : "h-[260px] w-full object-cover sm:h-[420px]"}
                    />
                ) : (
                    <div className={isHero ? "h-full min-h-[360px] bg-[radial-gradient(circle_at_30%_20%,rgba(69,223,185,0.22),transparent_34%),linear-gradient(135deg,#21463f,#102320)] lg:min-h-[520px]" : "h-[260px] bg-[radial-gradient(circle_at_30%_20%,rgba(69,223,185,0.22),transparent_34%),linear-gradient(135deg,#21463f,#102320)] sm:h-[420px]"} />
                )}
            </div>

            {gallery.length > 1 && (
                <div className={isHero ? "absolute bottom-3 left-3 right-3 z-10 grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-3 sm:grid-cols-3"}>
                    {gallery.map((url, index) => {
                        const isActive = index === selectedIndex;

                        return (
                            <button
                                key={`${url}-${index}`}
                                type="button"
                                aria-label={`Показать фото ${index + 1}`}
                                aria-pressed={isActive}
                                onClick={() => setSelectedIndex(index)}
                                className={`overflow-hidden border bg-white/[0.04] text-left transition ${
                                    isHero ? "rounded-xl shadow-lg shadow-black/25 backdrop-blur" : "rounded-2xl"
                                } ${
                                    isActive
                                        ? "border-[#45dfb9] ring-2 ring-[#45dfb9]/30"
                                        : "border-white/10 hover:border-[#45dfb9]/60"
                                }`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element -- Catalog gallery uses API upload URLs directly. */}
                                <img
                                    src={url}
                                    alt={`${salonName}: фото ${index + 1}`}
                                    className={`w-full object-cover transition ${isHero ? "h-16 sm:h-20" : "h-32 sm:h-40"} ${isActive ? "opacity-100" : "opacity-75 hover:opacity-100"}`}
                                />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
