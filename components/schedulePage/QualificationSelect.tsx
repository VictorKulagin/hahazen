"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { LEVEL_COLOR_STYLES, LEVEL_OPTIONS } from "@/lib/employee-levels";

type Props = {
    value: string;
    onChange: (value: string) => void;
};

export default function QualificationSelect({ value, onChange }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const normalizedValue = value == null ? "" : String(value);

    const selectedLevel = useMemo(
        () => LEVEL_OPTIONS.find((level) => level.value === normalizedValue) ?? LEVEL_OPTIONS[LEVEL_OPTIONS.length - 1],
        [normalizedValue]
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-black transition hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/20"
            >
                <span className="flex min-w-0 items-center gap-3">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${LEVEL_COLOR_STYLES[selectedLevel.color].dot}`} />
                    <span className={`truncate text-sm font-medium ${LEVEL_COLOR_STYLES[selectedLevel.color].text}`}>
                        {selectedLevel.label}
                    </span>
                </span>

                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-400 transition dark:text-white/50 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-[rgb(var(--card))]">
                    <div className="max-h-72 overflow-y-auto p-2">
                        {LEVEL_OPTIONS.map((level) => {
                            const isSelected = level.value === normalizedValue;

                            return (
                                <button
                                    key={`${level.value}-${level.label}`}
                                    type="button"
                                    onClick={() => {
                                        onChange(level.value);
                                        setIsOpen(false);
                                    }}
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                                        isSelected
                                            ? "bg-gray-100 text-black dark:bg-white/10 dark:text-white"
                                            : "text-gray-700 hover:bg-gray-50 dark:text-white/85 dark:hover:bg-white/5"
                                    }`}
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${LEVEL_COLOR_STYLES[level.color].dot}`} />
                                        <span className={`truncate text-sm font-medium ${LEVEL_COLOR_STYLES[level.color].text}`}>
                                            {level.label}
                                        </span>
                                    </span>

                                    {isSelected && <Check className="h-4 w-4 shrink-0 text-emerald-500" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
