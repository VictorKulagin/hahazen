'use client';

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPasswordApi } from "@/services/resetPasswordApi";
import PasswordInput from "@/components/PasswordInput";

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
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Установить новый пароль
                </h2>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                {message && <p className="text-green-600 text-sm mb-4">{message}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Новый пароль
                        </label>

                        <PasswordInput value={password} onChange={setPassword} />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-md shadow hover:bg-green-600"
                    >
                        Сохранить пароль
                    </button>
                </form>

                <div className="text-center mt-4">
                    <a href="/signin" className="text-green-500 hover:underline">
                        Вернуться к входу
                    </a>
                </div>
            </div>
        </div>
    );
}
