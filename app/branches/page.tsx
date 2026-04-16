"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { branchesAddForm } from "@/hooks/branchesAddForm";
import { Addbranches } from "@/services/branchesApi";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

function BranchesContent() {
    const {
        formState: { name, address, phone, email },
        handleInputChange,
        error,
        setError,
        success,
        setSuccess,
        isLoading,
        setIsLoading,
    } = branchesAddForm();

    const router = useRouter();
    const searchParams = useSearchParams();
    const [companyId, setCompanyId] = useState<number | null>(null);

    useEffect(() => {
        const companyIdParam = searchParams?.get("companyId");
        if (companyIdParam) {
            setCompanyId(Number(companyIdParam));
        }
    }, [searchParams]);

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!companyId) {
                throw new Error("Ошибка: Не найден company_id. Пожалуйста, выберите компанию.");
            }

            await Addbranches({
                company_id: Number(companyId),
                name,
                address,
                phone,
                email,
            });

            setSuccess("Филиал успешно создан!");
            setError("");
            setTimeout(() => router.push("/cabinet"), 2000);
        } catch (error) {
            if (typeof error === "object" && error !== null && "response" in error) {
                // @ts-ignore
                setError(error.response?.data?.message || "Ошибка при создании филиала.");
            } else {
                setError("Неизвестная ошибка.");
            }
            setSuccess("");
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
                    <div className="mb-6 text-center">
                        <img
                            src="/logo.png"
                            alt="Hahazen"
                            className="mx-auto mb-4 h-16 w-16 rounded-2xl object-cover shadow-md"
                        />

                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-500">
                            Hahazen
                        </p>

                        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                            Создать филиал
                        </h1>

                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Укажите основные данные филиала, чтобы завершить первоначальную настройку CRM.
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
                                Название филиала
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={name}
                                onChange={handleInputChange}
                                className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                placeholder="Введите название филиала"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Адрес
                            </label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={address}
                                onChange={handleInputChange}
                                className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                placeholder="Введите адрес филиала"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Телефон
                            </label>
                            <input
                                type="text"
                                id="phone"
                                name="phone"
                                value={phone}
                                onChange={handleInputChange}
                                className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                placeholder="Введите телефон филиала"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={handleInputChange}
                                className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                placeholder="Введите email филиала"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-70"
                        >
                            {isLoading ? "Загрузка..." : "Создать филиал"}
                        </button>
                    </form>

                    <div className="mt-6 border-t border-gray-200 pt-4 text-center dark:border-white/10">
                        <a
                            href="/"
                            className="text-sm text-gray-500 transition hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400"
                        >
                            Вернуться на главную
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Загрузка данных компании...
            </p>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <BranchesContent />
        </Suspense>
    );
}
