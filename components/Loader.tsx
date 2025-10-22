"use client";

import { motion, AnimatePresence } from "framer-motion";
import React from "react";

interface LoaderProps {
    /** Тип анимации */
    type?: "default" | "dots" | "spinner" | "skeleton";
    /** Текст под логотипом */
    message?: string;
    /** Кол-во скелетон-элементов (если skeleton) */
    count?: number;
    /** Показать или скрыть (для анимации исчезновения) */
    visible?: boolean;
}

const Loader: React.FC<LoaderProps> = ({
                                           type = "default",
                                           message = "Загружаем данные...",
                                           count = 4,
                                           visible = true,
                                       }) => {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="loader"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex flex-col items-center justify-center h-full"
                >
                    {type === "default" && (
                        <>
                            <img
                                src="/logo.png"
                                alt="logo"
                                className="h-10 w-10 animate-pulse mb-3"
                            />
                            <p className="text-gray-300">{message}</p>
                        </>
                    )}

                    {type === "spinner" && (
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-t-green-500 border-gray-600 rounded-full animate-spin mb-3" />
                            <p className="text-gray-300">{message}</p>
                        </div>
                    )}

                    {type === "dots" && (
                        <p className="text-gray-400 text-lg">
                            Загружаем
                            <motion.span
                                className="inline-block mx-1"
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                            >
                                .
                            </motion.span>
                            <motion.span
                                className="inline-block mx-1"
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                            >
                                .
                            </motion.span>
                            <motion.span
                                className="inline-block mx-1"
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                            >
                                .
                            </motion.span>
                        </p>
                    )}

                    {type === "skeleton" && (
                        <div className="p-4 grid gap-3 w-full max-w-md">
                            {[...Array(count)].map((_, i) => (
                                <div key={i} className="animate-pulse bg-gray-700 rounded-lg h-12" />
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Loader;
