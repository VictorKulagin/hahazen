'use client'; // Указывает на использование клиентского рендеринга

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signinApi } from "@/services/signinApi";

export default function Page() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const router = useRouter();
    const [error, setError] = useState('');



    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

            try {
                const newSignin = await signinApi({
                    email,
                    password
                });

            // Если успешный ответ, сохраняем токен
            const { access_token } = newSignin;

             console.log(newSignin);

            // Сохраняем токен в localStorage или в куки
            localStorage.setItem('access_token', access_token);

            // Перенаправляем пользователя на главную страницу
            //router.push('/dashboard');
            router.push('/cabinet');
        } catch (error) {
            // Обработка ошибки
            console.log(error);
            setError('Неправильное имя пользователя или пароль');
        }
    };

    return (
        <>
        <div className="flex flex-col items-center">
            <img src="/logo.png" alt="Logo" className="w-24 h-24 mb-4" />
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Вход в аккаунт</h2>
        </div>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Вход в аккаунт</h2>
                {error && (
                    <p className="text-red-500 text-sm mb-4">{error}</p>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Электронная почта
                        </label>
                        <input
                            /*type="email"*/
                            type="text"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="example@mail.com"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Пароль
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="Введите ваш пароль"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-md shadow hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                        Войти
                    </button>
                </form>
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Нет аккаунта?{' '}
                        <a href="/signup" className="text-green-500 hover:underline">
                            Зарегистрироваться
                        </a>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                        <a href="/forgot-password" className="text-green-500 hover:underline">
                            Забыли пароль?
                        </a>
                    </p>
                </div>
            </div>
        </div>
        </>
    );
}
