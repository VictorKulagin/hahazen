'use client';

import { useState } from "react";
import { requestPasswordResetApi } from "@/services/requestPasswordResetApi";

export default function Page() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setMessage("");

        try {
            const res = await requestPasswordResetApi({ email });

            // Сервер должен вернуть message
            setMessage(res.message || "Письмо с инструкциями отправлено!");
            setEmail("");
        } catch (err) {
            console.error(err);
            setError("Ошибка отправки. Проверьте email и попробуйте снова.");
        }
    };

    return (
        <>
            <div className="flex flex-col items-center">
                <img src="/logo.png" alt="Logo" className="w-24 h-24 mb-4" />
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Восстановление пароля</h2>
            </div>

            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-xl font-bold text-center text-gray-800 mb-6">
                        Запрос на сброс пароля
                    </h2>

                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    {message && <p className="text-green-600 text-sm mb-4">{message}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4 text-black">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Электронная почта
                            </label>
                            <input
                                type="text"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                           focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="example@mail.com"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-green-500 text-white py-2 px-4 rounded-md shadow
                         hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            Отправить ссылку
                        </button>
                    </form>

                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            <a href="/signin" className="text-green-500 hover:underline">
                                Вернуться к входу
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
