"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { companiesAddForm } from "@/hooks/companiesAddForm";
import { AddCompanies } from "@/services/companiesApi";


export default function AddCompanyPage() {
    const {
        formState: { name, address, phone, email },
        handleInputChange,
        error,
        setError,
        success,
        setSuccess,
        isLoading,
        setIsLoading,
    } = companiesAddForm();

    const router = useRouter();


    const handleAddCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");


        try {
            const token = localStorage.getItem("access_token"); // Получаем токен из localStorage
            if (!token) {
                throw new Error("Ошибка: Токен не найден. Войдите в систему.");
            }
            const newCompanies = await AddCompanies({
                name,
                address,
                phone,
                email
            });

            setSuccess("Компания успешно добавлена!");
            setTimeout(() => router.push(`/branches?companyId=${newCompanies.id}`), 2000);
        } catch (err: any) {

            console.log("Ошибка:" + err); // Логируем всю ошибку
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Ошибка при добавлении компании. Попробуйте позже.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Добавить компанию</h2>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
                <form onSubmit={handleAddCompany} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Название компании
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="Введите название компании"
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
                            value={address}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="Введите адрес"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Телефон
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="Введите номер телефона"
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
                            placeholder="Введите email"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-md shadow hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                        {isLoading ? "Загрузка..." : "Добавить компанию"}
                    </button>
                </form>
            </div>
        </div>
    );
}
