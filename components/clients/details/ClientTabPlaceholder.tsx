"use client";

import React from "react";
import { Wrench } from "lucide-react";

type ClientTabPlaceholderProps = {
    title: string;
    description: string;
};

export default function ClientTabPlaceholder({
    title,
    description,
}: ClientTabPlaceholderProps) {
    return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                <Wrench className="h-5 w-5" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
            </h3>

            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                {description}
            </p>
        </div>
    );
}
