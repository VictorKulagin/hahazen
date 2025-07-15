"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {useRouter} from "next/navigation";
import { branchesAddForm } from "@/hooks/branchesAddForm";
import { Addbranches } from "@/services/branchesApi";
import { AddCompanies } from "@/services/companiesApi";
import {companiesAddForm} from "@/hooks/companiesAddForm";


export default function Page() {

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
    const searchParams = useSearchParams(); // Получаем параметры из URL
    const [companyId, setCompanyId] = useState<number | null>(null);

    useEffect(() => {
        const companyIdParam = searchParams?.get("companyId");
        if (companyIdParam) {
            setCompanyId(Number(companyIdParam));
        }
    }, [searchParams]);

    if (!companyId) {
        return <p>Загрузка...</p>;
    }


    console.log(companyId);

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!companyId) {
                throw new Error("Ошибка: Не найден company_id. Пожалуйста, выберите компанию.");
            }


            // Создание филиала
            const newBranches = await Addbranches({
                company_id: Number(companyId), // Используем ID из URL
                name: name, // Имя филиала
                address: address, // Адрес филиала
                phone: phone, // Телефон филиала
                email: email, // Email филиала
            });

            // Успех
            setSuccess("Филиал успешно создан!");
            setError("");
            setTimeout(() => router.push("/cabinet"), 2000);
        } catch (error) {
            // Обработка ошибок
            setError(
                error.response?.data?.message ||
                "Ошибка при регистрации. Убедитесь, что данные корректны."
            );
            setSuccess("");
        } finally {
            // Сброс состояния загрузки
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <div className="flex flex-col items-center">
                    <img src="/logo.png" alt="Logo" className="w-24 h-24 mb-4" />
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Создание Филиала Компании</h2>
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Название компании
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="Введите название филиала"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                            Адрес
                        </label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={address}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="Введите адрес филиала"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Телефон
                        </label>
                        <input
                            type="text"
                            id="phone"
                            name="phone"
                            value={phone}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="Введите телефон филиала"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="Введите email филиала"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-md shadow hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                        Создать филиал
                    </button>
                </form>
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Вернуться на{" "}
                        <a href="/" className="text-green-500 hover:underline">
                            главную
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
