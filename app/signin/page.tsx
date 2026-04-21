'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signinApi } from "@/services/signinApi";
import { authStorage } from "@/services/authStorage";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ensureApiContext } from "@/services/apiContext";

export default function Page() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const router = useRouter();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const newSignin = await signinApi({ email, password });
            authStorage.setAuth(newSignin);
            const context = await ensureApiContext();
            authStorage.setContext(context);
            if (!context) {
                router.push("/context/select");
                return;
            }
            router.push("/cabinet");
        } catch (error) {
            console.log(error);
            setError("Неправильное имя пользователя или пароль");
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_35%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent)]" />

            <div className="absolute right-4 top-4 z-10">
                <ThemeToggle />
            </div>

            <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
                <div className="w-full max-w-md rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:shadow-none sm:p-8">
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
                            Вход в аккаунт
                        </h1>

                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Войдите, чтобы управлять расписанием, клиентами и услугами.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Электронная почта
                            </label>
                            <input
                                type="text"
                                id="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value.replace(/^[\s\u00A0]+|[\s\u00A0]+$/g, ""))
                                }
                                className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
                                placeholder="example@mail.com"
                                required
                            />
                        </div>

                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Пароль
                                </label>

                                <a
                                    href="/request-password-reset"
                                    className="text-xs font-medium text-green-500 hover:text-green-400"
                                >
                                    Забыли пароль?
                                </a>
                            </div>

                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value.replace(/^[\s\u00A0]+|[\s\u00A0]+$/g, ""))
                                }
                                className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
                                placeholder="Введите ваш пароль"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-[rgb(var(--card))]"
                        >
                            Войти
                        </button>
                    </form>

                    <div className="mt-6 border-t border-gray-200 pt-4 text-center dark:border-white/10">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Нет аккаунта?{" "}
                            <a href="/signup" className="font-medium text-green-500 hover:text-green-400">
                                Зарегистрироваться
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
