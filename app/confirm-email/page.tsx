"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, Loader2, MailCheck, XCircle } from "lucide-react";
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
                setMessage(response.message || "Email подтверждён. Теперь можно войти.");
                redirectTimer = window.setTimeout(() => router.push("/signin"), 4000);
            })
            .catch((error: unknown) => {
                if (!active) return;

                setStatus("error");
                setMessage(
                    getApiErrorMessage(
                        error,
                        "Не удалось подтвердить почту. Возможно, ссылка устарела или уже была использована."
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
        ? "Проверяем ссылку"
        : isSuccess
          ? "Почта подтверждена"
          : "Ссылка не сработала";
    const description = isLoading
        ? "Это займёт всего пару секунд."
        : isSuccess
          ? "Спасибо! Аккаунт готов к работе, можно переходить ко входу."
          : status === "missing-token"
            ? "В ссылке нет токена подтверждения. Откройте письмо ещё раз и перейдите по полной ссылке."
            : message;

    return (
        <main className="public-auth-page relative min-h-screen overflow-hidden bg-slate-100 px-4 py-10 text-slate-900 dark:bg-[rgb(var(--background))] dark:text-[rgb(var(--foreground))]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.13),transparent_38%)] dark:bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_35%)]" />
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/70 to-transparent dark:from-white/5" />

            <div className="absolute right-4 top-4 z-10">
                <ThemeToggle />
            </div>

            <div className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center">
                <section className="public-auth-card w-full max-w-md rounded-3xl border border-white bg-white p-6 text-center shadow-[0_22px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[rgb(var(--card))] dark:shadow-none sm:p-8">
                    <div className="mb-6 flex flex-col items-center">
                        <Image
                            src="/logo.png"
                            alt="Hahazen"
                            width={64}
                            height={64}
                            className="mb-4 h-16 w-16 rounded-2xl object-cover shadow-md"
                        />

                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-500 dark:text-green-400">
                            Hahazen
                        </p>

                        <div className="mt-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-500 dark:bg-green-500/10 dark:text-green-300">
                            {isLoading && <Loader2 className="h-8 w-8 animate-spin" />}
                            {isSuccess && <CheckCircle2 className="h-8 w-8" />}
                            {isError && <XCircle className="h-8 w-8 text-red-500" />}
                        </div>

                        <h1 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">
                            {title}
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-gray-400">
                            {description}
                        </p>
                    </div>

                    {isSuccess && (
                        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-left text-sm text-green-900 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-100">
                            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-500 dark:text-green-300" />
                            <span>
                                Через несколько секунд откроем страницу входа. Если не
                                откроется, нажмите кнопку ниже.
                            </span>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                            {message}
                        </div>
                    )}

                    <Link
                        href="/signin"
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-green-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-600"
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
                <main className="public-auth-page flex min-h-screen items-center justify-center bg-slate-100 text-slate-500 dark:bg-[rgb(var(--background))]">
                    Загрузка...
                </main>
            }
        >
            <ConfirmEmailContent />
        </Suspense>
    );
}
