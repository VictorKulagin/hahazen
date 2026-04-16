'use client';

import { useRouter } from 'next/navigation';
import { useRegisterForm } from "@/hooks/useRegisterForm";
import { registerUser } from "@/services/userApi";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function RegisterPage() {
    const {
        formState: { username, password, email, name, lastName },
        handleInputChange,
        error,
        setError,
        success,
        setSuccess,
        isLoading,
        setIsLoading,
    } = useRegisterForm();

    const router = useRouter();

    const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === " ") e.preventDefault();
    };

    const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        if (e.key === " " && input.selectionStart === 0) {
            e.preventDefault();
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const newUser = await registerUser({
                username,
                password,
                email,
                name,
                last_name: lastName,
            });

            // @ts-ignore
            if (newUser.access_token) {
                // @ts-ignore
                localStorage.setItem("access_token", newUser.access_token);
            } else {
                throw new Error("Ошибка: Сервер не вернул access_token.");
            }

            setSuccess("Пользователь успешно зарегистрирован!");
            setError("");
            setTimeout(() => router.push("/companies"), 2000);
        } catch (err: any) {
            if (err.response?.status === 422) {
                const errors = err.response.data;
                const usernameError = errors.find((err: any) => err.field === "username");
                const emailError = errors.find((err: any) => err.field === "email");

                if (usernameError) {
                    setError(`Ошибка в поле "Логин": ${usernameError.message}`);
                }

                if (emailError) {
                    setError(`Ошибка в поле "Email": ${emailError.message}`);
                }
            } else {
                setError("Ошибка при регистрации. Попробуйте позже.");
            }
        } finally {
            setIsLoading(false);
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
                            Регистрация
                        </h1>

                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Создайте аккаунт, чтобы управлять расписанием, клиентами и услугами.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Имя
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={handleInputChange}
                                className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                placeholder="Введите ваше имя"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Фамилия
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                value={lastName}
                                onChange={handleInputChange}
                                className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                placeholder="Введите вашу фамилию"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Электронная почта
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={handleInputChange}
                                onKeyDown={handleEmailKeyDown}
                                className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                placeholder="example@mail.com"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Имя пользователя
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={handleInputChange}
                                className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                placeholder="Введите имя пользователя"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Пароль
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={handleInputChange}
                                onKeyDown={handlePasswordKeyDown}
                                className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                placeholder="Введите пароль"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-70"
                        >
                            {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                        </button>
                    </form>

                    <div className="mt-6 border-t border-gray-200 pt-4 text-center dark:border-white/10">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Уже есть аккаунт?{" "}
                            <a href="/signin" className="font-medium text-green-500 hover:text-green-400">
                                Войти
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
