"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
    findSpecialtyOption,
    getFilteredSpecialties,
    getProCardModeLabel,
    SPECIALTY_GROUPS,
} from "@/lib/employee-specialties";

type SpecialtyAutocompleteProps = {
    value: string;
    onChange: (value: string) => void;
    inputClassName: string;
    placeholder?: string;
};

export default function SpecialtyAutocomplete({
    value,
    onChange,
    inputClassName,
    placeholder = "Например: массажист",
}: SpecialtyAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const filteredOptions = useMemo(() => getFilteredSpecialties(value), [value]);
    const selectedOption = useMemo(() => findSpecialtyOption(value), [value]);

    const groupedOptions = useMemo(
        () =>
            SPECIALTY_GROUPS.map((group) => ({
                ...group,
                items: filteredOptions.filter((option) => option.groupId === group.id),
            })).filter((group) => group.items.length > 0),
        [filteredOptions],
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className={`${inputClassName} pr-11`}
                    placeholder={placeholder}
                    autoComplete="off"
                />

                <button
                    type="button"
                    onClick={() => {
                        setIsOpen((prev) => !prev);
                        inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700 dark:text-white/60 dark:hover:text-white"
                    aria-label="Показать список специализаций"
                >
                    <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} />
                </button>
            </div>

            {selectedOption ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Профкарта: {getProCardModeLabel(selectedOption.proCardMode)}
                </p>
            ) : (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Начните вводить специализацию, например: «Мас», «Кос», «Ман».
                </p>
            )}

            {isOpen && (
                <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-[rgb(var(--card))]">
                    {groupedOptions.length > 0 ? (
                        <div className="p-2">
                            {groupedOptions.map((group) => (
                                <div key={group.id} className="mb-2 last:mb-0">
                                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Группа: {group.label}
                                    </div>

                                    <div className="space-y-1">
                                        {group.items.map((option) => {
                                            const isSelected = selectedOption?.id === option.id;

                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => {
                                                        onChange(option.label);
                                                        setIsOpen(false);
                                                    }}
                                                    className={`flex w-full items-start justify-between gap-3 rounded-xl px-3 py-3 text-left transition ${
                                                        isSelected
                                                            ? "bg-green-50 text-green-900 dark:bg-green-500/10 dark:text-green-200"
                                                            : "hover:bg-gray-50 dark:hover:bg-white/5"
                                                    }`}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {option.label}
                                                        </div>
                                                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                            Профкарта: {getProCardModeLabel(option.proCardMode)}
                                                        </div>
                                                    </div>

                                                    {isSelected && (
                                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-300" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                            Ничего не найдено. Можно ввести специализацию вручную.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
