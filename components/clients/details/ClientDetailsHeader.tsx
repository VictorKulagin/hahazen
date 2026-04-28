"use client";

import React from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Client } from "@/services/clientApi";

type ClientDetailsHeaderProps = {
    client: Client;
    onBack: () => void;
    getAvatarColor: (name?: string) => string;
};

export default function ClientDetailsHeader({
    client,
    onBack,
    getAvatarColor,
}: ClientDetailsHeaderProps) {
    return (
        <>
            <button
                onClick={onBack}
                className="flex items-center space-x-2 font-semibold text-green-600 transition hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
            >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Назад</span>
            </button>

            <div className="mb-6 flex items-center gap-5">
                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(
                        client.name,
                    )}`}
                >
                    {`${client.name?.[0] ?? ""}${client.last_name?.[0] ?? ""}`.toUpperCase() || "?"}
                </div>

                <div className="min-w-0">
                    <h1 className="truncate text-2xl font-semibold leading-tight text-gray-900 dark:text-white">
                        {client.name}
                    </h1>
                    <p className="truncate text-base text-gray-500 dark:text-gray-400">
                        {client.last_name ?? "-"}
                    </p>
                </div>
            </div>
        </>
    );
}
