'use client';

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPasswordApi } from "@/services/resetPasswordApi";
import PasswordInput from "@/components/PasswordInput";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const token = searchParams?.get("token") ?? "";

    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!token) {
            setError("Недействительная ссылка для сброса пароля");
            return;
        }

        try {
            const res = await resetPasswordApi(token, { password });
            setMessage(res.message || "Пароль успешно изменён!");
            setPassword("");
        } catch (err) {
            console.error(err);
            setError("Ошибка при сбросе пароля. Попробуйте снова.");
        }
    };

    return (
        <div className="public-auth-page relative min-h-screen flex items-center justify-center px-4 py-10 text-[rgb(var(--foreground))]">
            <div className="absolute right-4 top-4 z-10">
                <ThemeToggle />
            </div>
            <div className="public-auth-card w-full max-w-md rounded-[28px] border border-gray-200 bg-white p-8 shadow-md dark:border-white/10 dark:bg-[rgb(var(--card))]">
                <h2 className="mb-6 text-center text-2xl font-bold text-gray-800 dark:text-white">
                    Установить новый пароль
                </h2>

                {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
                {message && <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">{message}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Новый пароль
                        </label>

                        <PasswordInput value={password} onChange={setPassword} />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-green-600"
                    >
                        Сохранить пароль
                    </button>
                </form>

                <div className="mt-6 border-t border-gray-200 pt-4 text-center dark:border-white/10">
                    <a href="/signin" className="text-sm font-medium text-green-500 hover:text-green-400">
                        Вернуться к входу
                    </a>
                </div>
            </div>
        </div>
    );
}
