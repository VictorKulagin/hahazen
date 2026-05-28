"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { confirmEmailApi } from "@/services/confirmEmailApi";
import { getApiErrorMessage } from "@/services/apiError";

type ConfirmStatus = "loading" | "success" | "error" | "missing-token";

function ConfirmEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams?.get("token") ?? "";
    const [status, setStatus] = useState<ConfirmStatus>(
        token ? "loading" : "missing-token"
    );
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) return;

        let active = true;
        let redirectTimer: number | undefined;

        confirmEmailApi(token)
            .then((response) => {
                if (!active) return;

                setStatus("success");
                setMessage(response.message || "Почта успешно подтверждена.");
                redirectTimer = window.setTimeout(() => router.push("/signin"), 3000);
            })
            .catch((error: unknown) => {
                if (!active) return;

                setStatus("error");
                setMessage(
                    getApiErrorMessage(
                        error,
                        "Не удалось подтвердить почту. Ссылка недействительна или устарела."
                    )
                );
            });

        return () => {
            active = false;
            if (redirectTimer) window.clearTimeout(redirectTimer);
        };
    }, [router, token]);

    const isLoading = status === "loading";
    const isSuccess = status === "success";
    const isError = status === "error" || status === "missing-token";
    const title = isLoading
        ? "Подтверждаем почту"
        : isSuccess
          ? "Почта подтверждена"
          : "Ссылка недействительна";
    const description = isLoading
        ? "Проверяем ссылку подтверждения."
        : isSuccess
          ? "Теперь можно войти в аккаунт."
          : status === "missing-token"
            ? "В ссылке отсутствует токен подтверждения."
            : message;

    return (
        <main className="relative min-h-screen overflow-hidden bg-[rgb(var(--background))] px-4 py-10 text-[rgb(var(--foreground))]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_35%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent)]" />

            <div className="absolute right-4 top-4 z-10">
                <ThemeToggle />
            </div>

            <div className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center">
                <section className="w-full max-w-md rounded-[28px] border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:shadow-none sm:p-8">
                    <div className="mb-6 flex flex-col items-center">
                        <Image
                            src="/logo.png"
                            alt="Hahazen"
                            width={64}
                            height={64}
                            className="mb-4 h-16 w-16 rounded-2xl object-cover shadow-md"
                        />

                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-500">
                            Hahazen
                        </p>

                        <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/5">
                            {isLoading && (
                                <Loader2 className="h-7 w-7 animate-spin text-green-500" />
                            )}
                            {isSuccess && (
                                <CheckCircle2 className="h-7 w-7 text-green-500" />
                            )}
                            {isError && <XCircle className="h-7 w-7 text-red-500" />}
                        </div>

                        <h1 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">
                            {title}
                        </h1>

                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {description}
                        </p>
                    </div>

                    {isSuccess && (
                        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
                            {message || "Почта успешно подтверждена."}
                        </div>
                    )}

                    {status === "error" && (
                        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                            {message}
                        </div>
                    )}

                    <Link
                        href="/signin"
                        className="inline-flex w-full items-center justify-center rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-600"
                    >
                        Перейти ко входу
                    </Link>
                </section>
            </div>
        </main>
    );
}

export default function ConfirmEmailPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center bg-[rgb(var(--background))] text-gray-500">
                    Загрузка...
                </main>
            }
        >
            <ConfirmEmailContent />
        </Suspense>
    );
}
