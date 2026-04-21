"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiContext, fetchApiContexts, setApiContext } from "@/services/apiContext";
import { authStorage } from "@/services/authStorage";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function ContextSelectPage() {
    const router = useRouter();
    const [contexts, setContexts] = useState<ApiContext[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadContexts = async () => {
            try {
                const availableContexts = await fetchApiContexts();
                setContexts(availableContexts);
            } catch (err: any) {
                setError(err?.response?.data?.message || "Не удалось загрузить доступные контексты.");
            } finally {
                setIsLoading(false);
            }
        };

        loadContexts();
    }, []);

    const handleSelect = async (context: ApiContext) => {
        setIsSaving(true);
        setError("");

        try {
            const savedContext = await setApiContext({
                company_id: context.company_id,
                branch_id: context.branch_id ?? null,
            });

            authStorage.setContext(savedContext);
            router.push("/cabinet");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Не удалось выбрать рабочий контекст.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-[rgb(var(--background))] px-4 py-8 text-[rgb(var(--foreground))]">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-500">
                            Hahazen
                        </p>
                        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                            Выберите рабочий контекст
                        </h1>
                    </div>
                    <ThemeToggle />
                </div>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-gray-300">
                        Загрузка...
                    </div>
                ) : contexts.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-gray-300">
                        Для пользователя не найдено ни одной компании или филиала.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {contexts.map((context) => {
                            const key = `${context.company_id}:${context.branch_id ?? "company"}`;
                            const title = context.label || context.branch_name || context.company_name || "Контекст";
                            const subtitle = [
                                context.company_name,
                                context.branch_name,
                                context.role,
                            ].filter(Boolean).join(" · ");

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleSelect(context)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-green-400 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[rgb(var(--card))] dark:hover:border-green-500/70 dark:hover:bg-green-500/10"
                                >
                                    <span className="block text-base font-semibold text-gray-900 dark:text-white">
                                        {title}
                                    </span>
                                    {subtitle && (
                                        <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
                                            {subtitle}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
