"use client";

import React, { useState, useEffect } from "react";
import { useClients } from "@/hooks/useClient";
import { useCreateClient } from "@/hooks/useClient";
import type { Client } from "@/services/clientApi";
import {
    normalizePhoneInput,
    isValidPhone,
    getPhoneDigitsCount,
    MIN_PHONE_DIGITS,
} from "@/components/utils/phone";

interface ClientAutocompleteProps {
    onSelect: (client: Client) => void;
}

const ClientAutocomplete: React.FC<ClientAutocompleteProps> = ({ onSelect }) => {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newClient, setNewClient] = useState<Partial<Client>>({
        name: "",
        last_name: "",
        phone: "",
    });

    const [touched, setTouched] = useState(false);

    const phoneIsValid = isValidPhone(newClient.phone || "");
    const showError = touched && newClient.phone && !phoneIsValid;

    // debounce ввод
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = useClients(
        debouncedSearch ? { any: debouncedSearch } : {},
        { page: 1, perPage: 5 }
    );

    const { mutateAsync: createClient, isPending: creating } = useCreateClient();

    const handleSelect = (client: Client) => {
        setShowDropdown(false);
        setSearch(`${client.name} ${client.last_name || ""}`);
        onSelect(client);
    };

    const handleCreate = async () => {
        try {
            if (!newClient.name || !newClient.phone) {
                alert("Имя и телефон обязательны");
                return;
            }
            // отправляем запрос на сервер
            const created = await createClient(newClient as Client);

            // закрываем форму добавления
            setIsAdding(false);
            setNewClient({ name: "", last_name: "", phone: "" });

            // обновляем поле поиска
            setSearch(`${created.name} ${created.last_name || ""}`);

            // ВАЖНО: передаем выбранного клиента наверх
            onSelect(created);
            setShowDropdown(false);
        } catch (err: any) {
            console.error("Ошибка создания клиента:", err);
            alert(err?.message || "Не удалось создать клиента");
        }
    };

    return (
        <div className="relative">
            {!isAdding ? (
                <>
                    <input
                        type="text"
                        placeholder="Поиск клиента"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setShowDropdown(true);
                        }}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                    />
                    {showDropdown && (
                        <div className="absolute bg-white dark:bg-[rgb(var(--background))] border border-gray-200 dark:border-white/10 rounded-xl shadow w-full mt-1 z-10 max-h-60 overflow-y-auto">
                            {isLoading && <p className="p-2 text-gray-500">Поиск...</p>}
                            {data?.clients?.length ? (
                                data.clients.map((client) => (
                                    <div
                                        key={client.id}
                                        onClick={() => handleSelect(client)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
                                    >
                    <span className="font-medium text-black dark:text-white">
                      {client.name} {client.last_name}
                    </span>
                                        <span className="text-gray-500 text-sm ml-2">
                      {client.phone}
                    </span>
                                    </div>
                                ))
                            ) : (
                                <p className="p-2 text-gray-500">Не найдено</p>
                            )}
                            <div className="sticky bottom-0 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[rgb(var(--card))] z-10">
                                <button
                                    type="button"
                                    className="w-full px-3 py-2 text-blue-600 dark:text-blue-400 font-medium hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center"
                                    onClick={() => setIsAdding(true)}
                                >
                                    ➕ <span className="ml-2">Добавить нового клиента</span>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                    <input
                        type="text"
                        placeholder="Имя"
                        value={newClient.name}
                        onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                    />
                    <input
                        type="text"
                        placeholder="Фамилия"
                        value={newClient.last_name}
                        onChange={(e) =>
                            setNewClient((p) => ({ ...p, last_name: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                    />
                    <div>
                        <input
                            type="tel"
                            placeholder="+..."
                            value={newClient.phone}
                            onChange={(e) =>
                                setNewClient((p) => ({
                                    ...p,
                                    phone: normalizePhoneInput(e.target.value),
                                }))
                            }
                            onBlur={() => setTouched(true)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                            inputMode="numeric"
                            autoComplete="tel"
                        />

                        {showError && (
                            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                                Введите корректный номер: от {MIN_PHONE_DIGITS} цифр
                            </p>
                        )}

                        <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
                            Цифр: {getPhoneDigitsCount(newClient.phone || "")}
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-3 py-1 bg-gray-300 rounded"
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            onClick={handleCreate} // <-- вот тут
                            disabled={creating}
                            className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
                        >
                            {creating ? "Создание..." : "Сохранить"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientAutocomplete;
