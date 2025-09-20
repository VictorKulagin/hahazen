"use client";
import React, { useState, useEffect } from "react";
import { Employee } from "@/services/employeeApi";

type Props = {
    isOpen: boolean;
    employee: Employee | null;
    onClose: () => void;
    onSave: (updated: Employee) => void;
};

export const EditEmployeeModal: React.FC<Props> = ({ isOpen, employee, onClose, onSave }) => {
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");

    useEffect(() => {
        if (employee && isOpen) {
            setName(employee.name);
            setLastName(employee.last_name ?? "");
            setPhone(employee.phone ?? "");
        }
    }, [employee, isOpen]);

    if (!isOpen || !employee) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50 transition-opacity ${
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        >
            <div
                className={`bg-white w-[28rem] h-full shadow-lg transform transition-transform ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Кнопка закрытия */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-50 bg-white rounded-full shadow p-1"
                    aria-label="Закрыть окно"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Контент */}
                <div className="p-6 text-black">
                    <h2 className="text-lg font-bold mb-4">Редактировать сотрудника</h2>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSave({ ...employee, name, last_name: lastName, phone });
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Имя
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Имя"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Фамилия
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Фамилия"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Телефон
                            </label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Телефон"
                            />
                        </div>

                        {/* Кнопки */}
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                            >
                                Закрыть
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Сохранить
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

