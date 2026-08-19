"use client";

import { useState } from "react";
import { useCreateServiceGroup, useServiceGroups } from "@/hooks/useServices";

type Props = {
    branchId?: number;
    value: number | null;
    onChange: (groupId: number | null) => void;
    inputClass: string;
};

export const ServiceGroupSelect = ({
    branchId,
    value,
    onChange,
    inputClass,
}: Props) => {
    const { data: serviceGroups = [], isLoading } = useServiceGroups(branchId);
    const { mutateAsync: createGroup, isPending } = useCreateServiceGroup();
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        const name = newGroupName.trim();
        if (!branchId) {
            setError("Не удалось определить филиал.");
            return;
        }
        if (!name) {
            setError("Введите название категории.");
            return;
        }

        setError(null);
        try {
            const group = await createGroup({ branch_id: branchId, name });
            onChange(group.id);
            setNewGroupName("");
            setIsCreating(false);
        } catch (createError) {
            setError(
                createError instanceof Error
                    ? createError.message
                    : "Не удалось создать категорию."
            );
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Категория услуг
                </label>
                <button
                    type="button"
                    onClick={() => {
                        setIsCreating((current) => !current);
                        setError(null);
                    }}
                    className="text-xs font-medium text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-300"
                >
                    {isCreating ? "Отмена" : "+ Новая категория"}
                </button>
            </div>

            <select
                value={value ?? ""}
                onChange={(event) =>
                    onChange(event.target.value ? Number(event.target.value) : null)
                }
                disabled={isLoading}
                className={inputClass}
            >
                <option value="">Без категории</option>
                {serviceGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                        {group.name}
                    </option>
                ))}
            </select>

            {isCreating && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex gap-2">
                        <input
                            autoFocus
                            value={newGroupName}
                            onChange={(event) => setNewGroupName(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    handleCreate();
                                }
                            }}
                            placeholder="Например: Поклейка"
                            className={`${inputClass} min-w-0`}
                        />
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={isPending}
                            className="shrink-0 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isPending ? "..." : "Создать"}
                        </button>
                    </div>
                    {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
                </div>
            )}
        </div>
    );
};
