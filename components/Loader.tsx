"use client";

import React from "react";

interface LoaderProps {
    type?: "default" | "dots" | "spinner" | "skeleton";
    message?: string;
    count?: number;
    visible?: boolean;
}

const SkeletonBlock = ({ className, style }: { className: string; style?: React.CSSProperties }) => (
    <span className={`fast-loader-shimmer block ${className}`} style={style} />
);

const AppShellSkeleton = ({ message }: { message: string }) => (
    <div
        role="status"
        aria-live="polite"
        aria-label={message}
        className="fast-loader-shell flex h-full min-h-[100dvh] w-full overflow-hidden"
    >
        <aside className="hidden w-[280px] shrink-0 border-r border-emerald-900/10 p-4 dark:border-emerald-200/10 md:flex md:flex-col">
            <div className="flex items-center gap-3 border-b border-emerald-900/10 pb-4 dark:border-emerald-200/10">
                <SkeletonBlock className="h-9 w-9 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <SkeletonBlock className="h-3 w-28 rounded-full" />
                    <SkeletonBlock className="h-2.5 w-20 rounded-full opacity-65" />
                </div>
            </div>

            <div className="mt-5 space-y-2">
                {[82, 68, 76, 64, 72].map((width, index) => (
                    <div key={width} className={`flex items-center gap-3 rounded-2xl px-3 py-3 ${index === 0 ? "bg-emerald-500/10" : ""}`}>
                        <SkeletonBlock className="h-5 w-5 rounded-md" />
                        <SkeletonBlock
                            className={`h-3 rounded-full ${index === 0 ? "" : "opacity-65"}`}
                            style={{ width: `${width}%` }}
                        />
                    </div>
                ))}
            </div>

            <div className="mt-auto rounded-2xl border border-emerald-900/10 p-3 dark:border-emerald-200/10">
                <div className="flex items-center gap-3">
                    <SkeletonBlock className="h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <SkeletonBlock className="h-3 w-24 rounded-full" />
                        <SkeletonBlock className="h-2.5 w-32 rounded-full opacity-60" />
                    </div>
                </div>
            </div>
        </aside>

        <div className="min-w-0 flex-1 p-3 sm:p-5">
            <div className="mx-auto w-full max-w-[1800px] space-y-4">
                <div className="fast-loader-panel flex items-center justify-between rounded-2xl border p-4">
                    <div className="space-y-2">
                        <SkeletonBlock className="h-4 w-36 rounded-full" />
                        <SkeletonBlock className="h-2.5 w-56 max-w-[55vw] rounded-full opacity-60" />
                    </div>
                    <SkeletonBlock className="h-9 w-28 rounded-xl" />
                </div>

                <div className="fast-loader-panel rounded-2xl border p-4">
                    <div className="flex items-center gap-3">
                        <SkeletonBlock className="h-10 w-10 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <SkeletonBlock className="h-3.5 w-40 rounded-full" />
                            <SkeletonBlock className="h-2.5 w-64 max-w-[58vw] rounded-full opacity-60" />
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2">
                        {[0, 1, 2, 3].map((item) => (
                            <SkeletonBlock key={item} className={`h-1.5 rounded-full ${item < 2 ? "" : "opacity-40"}`} />
                        ))}
                    </div>
                </div>

                <div className="fast-loader-panel rounded-[28px] border p-4 sm:p-5">
                    <div className="mb-5 flex items-center justify-between">
                        <SkeletonBlock className="h-5 w-32 rounded-full" />
                        <SkeletonBlock className="h-9 w-24 rounded-xl" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {[0, 1, 2, 3, 4, 5].map((item) => (
                            <div key={item} className="rounded-2xl border border-emerald-900/10 p-4 dark:border-emerald-200/10">
                                <div className="flex items-center gap-3">
                                    <SkeletonBlock className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <SkeletonBlock className="h-3.5 w-2/3 rounded-full" />
                                        <SkeletonBlock className="h-2.5 w-1/2 rounded-full opacity-55" />
                                    </div>
                                </div>
                                <SkeletonBlock className="mt-5 h-2.5 w-full rounded-full opacity-45" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        <span className="sr-only">{message}</span>
    </div>
);

const Loader: React.FC<LoaderProps> = ({
    type = "default",
    message = "Подготавливаем рабочее пространство...",
    count = 4,
    visible = true,
}) => {
    if (!visible) return null;

    if (type === "default") {
        return <AppShellSkeleton message={message} />;
    }

    if (type === "skeleton") {
        return (
            <div role="status" aria-label={message} className="grid w-full max-w-md gap-3 p-4">
                {[...Array(count)].map((_, index) => (
                    <SkeletonBlock key={index} className="h-12 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div role="status" aria-label={message} className="flex h-full flex-col items-center justify-center gap-3 text-sm text-emerald-700 dark:text-emerald-200">
            {type === "spinner" ? (
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
            ) : (
                <span className="flex gap-1.5">
                    {[0, 1, 2].map((item) => (
                        <span key={item} className="fast-loader-dot h-2 w-2 rounded-full bg-emerald-500" style={{ animationDelay: `${item * 120}ms` }} />
                    ))}
                </span>
            )}
            <span>{message}</span>
        </div>
    );
};

export default Loader;
