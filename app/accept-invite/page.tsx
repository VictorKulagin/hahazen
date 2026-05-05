"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { acceptInvite } from "@/services/userApi";
import { authStorage } from "@/services/authStorage";
import { ensureApiContext } from "@/services/apiContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

function AcceptInviteContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams?.get("token") ?? null;
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!token) {
            setError("Ссылка приглашения недействительна.");
            return;
        }

        if (password.length < 6) {
            setError("Пароль должен быть не короче 6 символов.");
            return;
        }

        if (password !== passwordRepeat) {
            setError("Пароли не совпадают.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await acceptInvite({ token, password });

            if (response.access_token) {
                authStorage.setAuth(response as Parameters<typeof authStorage.setAuth>[0]);
                const context = await ensureApiContext();
                authStorage.setContext(context);
                router.push(context ? "/cabinet" : "/context/select");
                return;
            }

            router.push("/signin");
        } catch (submitError: any) {
            setError(
                submitError?.response?.data?.message ||
                    "Не удалось принять приглашение. Проверьте ссылку или попробуйте позже.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-[rgb(var(--background))] px-4 py-10 text-[rgb(var(--foreground))]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_35%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent)]" />

            <div className="absolute right-4 top-4 z-10">
                <ThemeToggle />
            </div>

            <div className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center">
                <section className="w-full max-w-md rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:shadow-none sm:p-8">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <img
                            src="/logo.png"
                            alt="Hahazen"
                            className="mb-4 h-16 w-16 rounded-2xl object-cover shadow-md"
                        />

                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-500">
                            Hahazen
                        </p>

                        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                            Принятие приглашения
                        </h1>

                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Придумайте пароль для вашей новой учётной записи.
                        </p>
                    </div>

                    {!token && (
                        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            Ссылка приглашения недействительна.
                        </div>
                    )}

                    {error && (
                        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Пароль
                            </span>
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="new-password"
                                disabled={!token || isLoading}
                                className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
                                required
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Повтор пароля
                            </span>
                            <input
                                type="password"
                                value={passwordRepeat}
                                onChange={(event) =>
                                    setPasswordRepeat(event.target.value)
                                }
                                autoComplete="new-password"
                                disabled={!token || isLoading}
                                className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
                                required
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={!token || isLoading}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                            <span>{isLoading ? "Подтверждение..." : "Подтвердить"}</span>
                        </button>
                    </form>

                    <div className="mt-6 border-t border-gray-200 pt-4 text-center dark:border-white/10">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Уже есть аккаунт?{" "}
                            <a
                                href="/signin"
                                className="font-medium text-green-500 hover:text-green-400"
                            >
                                Войти
                            </a>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center bg-[rgb(var(--background))] text-gray-500">
                    Загрузка...
                </main>
            }
        >
            <AcceptInviteContent />
        </Suspense>
    );
}
