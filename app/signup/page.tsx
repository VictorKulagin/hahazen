'use client'; // Указывает на использование клиентского рендеринга

import {useState} from 'react';
//import axios from 'axios';
import {useRouter} from 'next/navigation';
import { useRegisterForm } from "@/hooks/useRegisterForm";
import { registerUser } from "@/services/userApi";

// Интерфейс для данных, отправляемых на сервер
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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Вызываем функцию для регистрации
            const newUser = await registerUser({
                username,
                password,
                email,
                name,
                last_name: lastName,
            });

            // Логируем ответ сервера
            console.log("Ответ сервера:", newUser);

            // Проверяем, есть ли токен в ответе
            if (newUser.access_token) {
                localStorage.setItem("access_token", newUser.access_token); // Сохраняем токен
                console.log("Токен сохранён:", newUser.access_token);
            } else {
                throw new Error("Ошибка: Сервер не вернул access_token.");
            }

            setSuccess("Пользователь успешно зарегистрирован!");
            setError("");
            setTimeout(() => router.push("/companies"), 2000);
        } catch (err: any) {
            // Обрабатываем ошибки
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
        <>
            <div className="flex flex-col items-center">
                <img src="/logo.png" alt="Logo" className="w-24 h-24 mb-4"/>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Вход в аккаунт</h2>
            </div>
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Регистрация</h2>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Имя
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="Введите ваше имя"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                Фамилия
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                value={lastName}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="Введите вашу фамилию"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Электронная почта
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="example@mail.com"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Имя пользователя
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="Введите имя пользователя"
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
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="Введите пароль"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-green-500 text-white py-2 px-4 rounded-md shadow hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            Зарегистрироваться
                        </button>
                    </form>
                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            Уже есть аккаунт?{' '}
                            <a href="/signin" className="text-green-500 hover:underline">
                                Войти
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
