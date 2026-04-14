"use client";
import React from "react";
import {
    UserPlusIcon,
    WrenchScrewdriverIcon,
    UserIcon,
    XMarkIcon,
} from "@heroicons/react/24/solid";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: "client" | "employee" | "service") => void;
};

export const CreateMenuModal: React.FC<Props> = ({
                                                     isOpen,
                                                     onClose,
                                                     onSelect,
                                                 }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
            <div
                className="
                    bg-[rgb(var(--background))]
                    text-[rgb(var(--foreground))]
                    w-full sm:w-[28rem]
                    h-full
                    shadow-lg
                    rounded-l-2xl
                    rounded-tr-2xl
                    overflow-hidden
                    flex flex-col
                "
            >
                {/* Header */}
                <div className="sticky top-0 z-20 border-b border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[rgb(var(--card))]/95 backdrop-blur-md">
                    <div className="flex items-start justify-between px-4 py-0">
                        <div className="flex items-start gap-3 min-w-0">
                            <span className="mt-[1.3rem] h-2 w-2 rounded-full bg-emerald-400 shrink-0" />

                            <h2 className="text-[17px] leading-[2.75] font-semibold text-[rgb(var(--foreground))] truncate">
                                Что хотите добавить?
                            </h2>
                        </div>

                        <button
                            onClick={onClose}
                            className="
                                mt-[8px]
                                flex h-9 w-9 items-center justify-center
                                rounded-xl
                                border border-gray-200 dark:border-white/10
                                bg-gray-100 text-gray-500
                                hover:bg-gray-200 hover:text-gray-700
                                dark:bg-white/5 dark:text-white/60
                                dark:hover:bg-white/10 dark:hover:text-white
                                transition
                            "
                            aria-label="Закрыть окно"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[rgb(var(--background))]">
                    <button
                        onClick={() => {
                            onSelect("client");
                            onClose();
                        }}
                        className="
                            flex items-center gap-3 w-full p-4
                            border border-gray-200 dark:border-white/10
                            rounded-2xl
                            bg-white dark:bg-white/5
                            hover:bg-gray-50 dark:hover:bg-white/10
                            transition
                        "
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                            <UserIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-base font-medium text-gray-900 dark:text-white">
                            Клиента
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            onSelect("employee");
                            onClose();
                        }}
                        className="
                            flex items-center gap-3 w-full p-4
                            border border-gray-200 dark:border-white/10
                            rounded-2xl
                            bg-white dark:bg-white/5
                            hover:bg-gray-50 dark:hover:bg-white/10
                            transition
                        "
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 dark:bg-green-500/10">
                            <UserPlusIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-base font-medium text-gray-900 dark:text-white">
                            Сотрудника
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            onSelect("service");
                            onClose();
                        }}
                        className="
                            flex items-center gap-3 w-full p-4
                            border border-gray-200 dark:border-white/10
                            rounded-2xl
                            bg-white dark:bg-white/5
                            hover:bg-gray-50 dark:hover:bg-white/10
                            transition
                        "
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                            <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-base font-medium text-gray-900 dark:text-white">
                            Услугу
                        </span>
                    </button>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 z-20 border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[rgb(var(--card))]/95 backdrop-blur-md px-4 py-4">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="
                                h-11 px-5 rounded-xl
                                border border-gray-300
                                bg-white text-gray-700
                                hover:bg-gray-100
                                dark:border-white/10
                                dark:bg-white/[0.03]
                                dark:text-[rgb(var(--foreground))]
                                dark:hover:bg-white/10
                                transition
                            "
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
