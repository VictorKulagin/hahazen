"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Addbranches } from "@/services/branchesApi";
import { branchesList } from "@/services/branchesList";
import { setApiContext } from "@/services/apiContext";
import { authStorage } from "@/services/authStorage";
import { getApiErrorMessage } from "@/services/apiError";
import { normalizePhoneInput } from "@/components/utils/phone";

export type BranchSwitcherItem = {
    id: number;
    company_id?: number;
    companyId?: number;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
};

type CompanyItem = {
    id: number;
    name?: string | null;
};

type BranchSwitcherModalProps = {
    isOpen: boolean;
    branches: BranchSwitcherItem[] | null | undefined;
    company: CompanyItem | null | undefined;
    activeBranchId: number | null | undefined;
    redirectPathPrefix: string;
    onClose: () => void;
    onBranchesChange: (branches: BranchSwitcherItem[]) => void;
};

export default function BranchSwitcherModal({
    isOpen,
    branches,
    company,
    activeBranchId,
    redirectPathPrefix,
    onClose,
    onBranchesChange,
}: BranchSwitcherModalProps) {
    const router = useRouter();
    const [branchForm, setBranchForm] = useState({
        name: "",
        address: "",
        phone: "",
        email: "",
    });
    const [isCreatingBranch, setIsCreatingBranch] = useState(false);
    const [isSwitchingBranch, setIsSwitchingBranch] = useState<number | null>(null);
    const [branchModalError, setBranchModalError] = useState("");

    if (!isOpen) return null;

    const branchList = branches ?? [];

    const refreshBranches = async () => {
        if (!company?.id) {
            throw new Error("Идентификатор компании отсутствует.");
        }

        const data = await branchesList(company.id);
        onBranchesChange(data);
        return data;
    };

    const handleBranchSwitch = async (branch: BranchSwitcherItem) => {
        const companyId = company?.id ?? branch.company_id ?? branch.companyId;
        if (!companyId) {
            setBranchModalError("Идентификатор компании отсутствует.");
            return;
        }

        setIsSwitchingBranch(branch.id);
        setBranchModalError("");

        try {
            const context = await setApiContext({
                company_id: companyId,
                branch_id: branch.id,
            });

            authStorage.setContext(context ?? {
                company_id: companyId,
                branch_id: branch.id,
                company_name: company?.name ?? null,
                branch_name: branch.name,
            });

            const selected = branchList.find((item) => item.id === branch.id) ?? branch;
            onBranchesChange([selected, ...branchList.filter((item) => item.id !== branch.id)]);
            onClose();
            router.push(`${redirectPathPrefix}/${branch.id}`);
        } catch (err) {
            setBranchModalError(getApiErrorMessage(err, "Не удалось переключить филиал."));
        } finally {
            setIsSwitchingBranch(null);
        }
    };

    const handleBranchFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setBranchForm((prev) => ({
            ...prev,
            [name]: name === "phone" ? normalizePhoneInput(value) : value,
        }));
    };

    const handleCreateBranch = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!company?.id) {
            setBranchModalError("Идентификатор компании отсутствует.");
            return;
        }

        setIsCreatingBranch(true);
        setBranchModalError("");

        try {
            const createdBranch = await Addbranches({
                company_id: company.id,
                name: branchForm.name.trim(),
                address: branchForm.address.trim() || null,
                phone: branchForm.phone.trim() || null,
                email: branchForm.email.trim() || null,
            });

            setBranchForm({ name: "", address: "", phone: "", email: "" });
            await refreshBranches().catch(() => null);
            await handleBranchSwitch({
                ...createdBranch,
                company_id: createdBranch.company_id ?? company.id,
            });
        } catch (err) {
            setBranchModalError(getApiErrorMessage(err, "Не удалось создать филиал."));
        } finally {
            setIsCreatingBranch(false);
        }
    };

    return (
        <div className="admin-dialog-overlay fixed inset-0 flex items-center justify-left bg-black/50 z-50" onClick={onClose}>
            <div
                className="admin-dialog-panel z-50 max-h-[calc(100vh-120px)] overflow-y-auto bg-white dark:bg-[rgb(var(--card))] p-6 rounded-lg shadow-lg dark:shadow-none text-black dark:text-white absolute top-[100px] w-full sm:w-11/12 md:w-[520px]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold">Филиалы</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Выберите активный филиал или добавьте новый.
                        </p>
                    </div>
                    <button
                        className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                        onClick={onClose}
                    >
                        Закрыть
                    </button>
                </div>

                {branchModalError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                        {branchModalError}
                    </div>
                )}

                <div className="mt-5 space-y-3">
                    {branchList.length > 0 ? (
                        branchList.map((branch) => {
                            const isActive = branch.id === activeBranchId;

                            return (
                                <div
                                    key={branch.id}
                                    className={`rounded-xl border p-4 transition ${
                                        isActive
                                            ? "border-green-500 bg-green-50 dark:border-green-400/60 dark:bg-green-500/10"
                                            : "border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                    }`}
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate font-semibold">{branch.name}</p>
                                                {isActive && (
                                                    <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                                                        Активный
                                                    </span>
                                                )}
                                            </div>
                                            {branch.address && (
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    {branch.address}
                                                </p>
                                            )}
                                            {branch.phone && (
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    {normalizePhoneInput(branch.phone)}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            disabled={isActive || isSwitchingBranch === branch.id}
                                            className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 dark:disabled:bg-white/10 dark:disabled:text-gray-400"
                                            onClick={() => handleBranchSwitch(branch)}
                                        >
                                            {isSwitchingBranch === branch.id ? "Переключение..." : isActive ? "Выбран" : "Выбрать"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
                            Филиал не найден
                        </p>
                    )}
                </div>

                <form onSubmit={handleCreateBranch} className="mt-6 border-t border-gray-200 pt-5 dark:border-white/10">
                    <h3 className="text-base font-semibold">Добавить филиал</h3>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="sm:col-span-2">
                            <span className="mb-1.5 block text-sm text-gray-600 dark:text-gray-300">Название</span>
                            <input
                                name="name"
                                value={branchForm.name}
                                onChange={handleBranchFormChange}
                                required
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                placeholder="Название филиала"
                            />
                        </label>
                        <label className="sm:col-span-2">
                            <span className="mb-1.5 block text-sm text-gray-600 dark:text-gray-300">Адрес</span>
                            <input
                                name="address"
                                value={branchForm.address}
                                onChange={handleBranchFormChange}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                placeholder="Адрес филиала"
                            />
                        </label>
                        <label>
                            <span className="mb-1.5 block text-sm text-gray-600 dark:text-gray-300">Телефон</span>
                            <input
                                name="phone"
                                value={branchForm.phone}
                                onChange={handleBranchFormChange}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                placeholder="+7..."
                            />
                        </label>
                        <label>
                            <span className="mb-1.5 block text-sm text-gray-600 dark:text-gray-300">Email</span>
                            <input
                                name="email"
                                type="email"
                                value={branchForm.email}
                                onChange={handleBranchFormChange}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                placeholder="branch@example.com"
                            />
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={isCreatingBranch || !branchForm.name.trim()}
                        className="mt-4 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isCreatingBranch ? "Создание..." : "Добавить филиал"}
                    </button>
                </form>
            </div>
        </div>
    );
}
