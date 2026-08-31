const SkeletonBlock = ({ className }: { className: string }) => (
    <div className={`animate-pulse rounded-2xl bg-white/[0.08] ${className}`} />
);

export default function Loading() {
    return (
        <main
            className="min-h-screen bg-[#061713] text-white"
            aria-busy="true"
            aria-label="Загрузка карточки салона"
        >
            <span className="sr-only" role="status">
                Загружаем информацию о салоне
            </span>

            <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_10%,rgba(69,223,185,0.22),transparent_34%),linear-gradient(145deg,#092620,#061713_62%,#030907)]">
                <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
                    <SkeletonBlock className="h-5 w-36" />

                    <div className="py-10">
                        <div className="overflow-hidden rounded-[2rem] border border-[#45dfb9]/20 bg-[#08231d] shadow-2xl shadow-black/25 lg:grid lg:grid-cols-[minmax(0,1.08fr)_420px]">
                            <SkeletonBlock className="min-h-[320px] rounded-none sm:min-h-[440px]" />

                            <div className="border-t border-white/10 p-6 sm:p-8 lg:border-l lg:border-t-0">
                                <div className="flex gap-2">
                                    <SkeletonBlock className="h-7 w-32 rounded-full" />
                                    <SkeletonBlock className="h-7 w-16 rounded-full" />
                                </div>

                                <SkeletonBlock className="mt-8 h-12 w-4/5" />
                                <SkeletonBlock className="mt-5 h-4 w-full" />
                                <SkeletonBlock className="mt-3 h-4 w-5/6" />

                                <div className="mt-6 flex gap-2">
                                    <SkeletonBlock className="h-7 w-24 rounded-full" />
                                    <SkeletonBlock className="h-7 w-28 rounded-full" />
                                    <SkeletonBlock className="h-7 w-20 rounded-full" />
                                </div>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <SkeletonBlock className="h-12 w-full sm:w-40" />
                                    <SkeletonBlock className="h-12 w-full sm:w-36" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="rounded-3xl border border-white/10 bg-[#0c221f]/72 p-6">
                    <SkeletonBlock className="h-8 w-40" />
                    <SkeletonBlock className="mt-6 h-4 w-full" />
                    <SkeletonBlock className="mt-3 h-4 w-full" />
                    <SkeletonBlock className="mt-3 h-4 w-3/4" />
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#0c221f]/72 p-6">
                    <SkeletonBlock className="h-7 w-32" />
                    <SkeletonBlock className="mt-6 h-20 w-full" />
                    <SkeletonBlock className="mt-4 h-12 w-full" />
                </div>
            </section>
        </main>
    );
}
