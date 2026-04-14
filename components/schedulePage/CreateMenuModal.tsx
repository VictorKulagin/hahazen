"use client";
import React from "react";
import { UserPlusIcon, WrenchScrewdriverIcon,UserIcon, } from "@heroicons/react/24/solid";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: "client" | "employee" | "service" ) => void;
};

export const CreateMenuModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
            {/* Панель справа */}
            <div className="bg-white dark:bg-[rgb(var(--background))] w-full sm:w-[28rem] h-full shadow-lg flex flex-col">
                {/* Заголовок */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
                    <h2 className="text-lg font-bold">Что хотите добавить?</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Контент */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <button
                        onClick={() => {
                            onSelect("client");
                            onClose();
                        }}
                        className="flex items-center gap-3 w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition"
                    >
                        <UserIcon className="h-6 w-6 text-indigo-600" />
                        <span className="text-lg">Клиента</span>
                    </button>

                    <button
                        onClick={() => {
                            onSelect("employee");
                            onClose();
                        }}
                        className="flex items-center gap-3 w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition"
                    >
                        <UserPlusIcon className="h-6 w-6 text-green-600" />
                        <span className="text-lg">Сотрудника</span>
                    </button>

                    <button
                        onClick={() => {
                            onSelect("service");
                            onClose();
                        }}
                        className="flex items-center gap-3 w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition"
                    >
                        <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600" />
                        <span className="text-lg">Услугу</span>
                    </button>
                </div>

                {/* Футер */}
                <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[rgb(var(--card))] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 dark:bg-white/10 text-black dark:text-white rounded hover:bg-gray-400 dark:hover:bg-white/20 transition"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};
