"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    Company,
    CompanyUpdatePayload,
    updateCompany,
} from "@/services/companiesList";
import { can } from "@/lib/permissions";
import { getApiErrorMessage } from "@/services/apiError";

type CompanySettingsCardProps = {
    company: Company | null | undefined;
    canManageCompany?: boolean;
    onSaved?: (company: Company) => void;
};

type CompanyPermissionApi = typeof can & {
    company?: {
        updateProfile?: () => boolean;
        updateSettings?: () => boolean;
    };
};

const COUNTRY_OPTIONS = [
    { value: "KG", label: "Кыргызстан" },
    { value: "KZ", label: "Казахстан" },
    { value: "RU", label: "Россия" },
];

const CURRENCY_OPTIONS = [
    { value: "KGS", label: "KGS" },
    { value: "KZT", label: "KZT" },
    { value: "RUB", label: "RUB" },
    { value: "USD", label: "USD" },
];

const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:disabled:bg-white/5 dark:disabled:text-white/35";

export default function CompanySettingsCard({
    company,
    canManageCompany = false,
    onSaved,
}: CompanySettingsCardProps) {
    const permissions = can as CompanyPermissionApi;
    const canUpdateProfile =
        canManageCompany || (permissions.company?.updateProfile?.() ?? false);
    const canUpdateSettings =
        canManageCompany || (permissions.company?.updateSettings?.() ?? false);
    const canSave = canUpdateProfile || canUpdateSettings;

    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [countryCode, setCountryCode] = useState("KG");
    const [currencyCode, setCurrencyCode] = useState("KGS");
    const [bonusesEnabled, setBonusesEnabled] = useState(true);
    const [bonusSpendMaxPercent, setBonusSpendMaxPercent] = useState(50);
    const [bonusPointsLabel, setBonusPointsLabel] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!company) return;

        setName(company.name ?? "");
        setAddress(company.address ?? "");
        setPhone(company.phone ?? "");
        setEmail(company.email ?? "");
        setCountryCode((company.country_code ?? "KG").toUpperCase());
        setCurrencyCode((company.currency_code ?? "KGS").toUpperCase());
        setBonusesEnabled(company.bonuses_enabled ?? true);
        setBonusSpendMaxPercent(company.bonus_spend_max_percent ?? 50);
        setBonusPointsLabel(company.bonus_points_label ?? "");
        setMessage("");
        setError("");
    }, [company]);

    const localePreview = useMemo(() => {
        if (company?.default_locale) return company.default_locale;
        return countryCode === "KG" ? "ru_KG" : "ru_RU";
    }, [company?.default_locale, countryCode]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!company?.id || !canSave) return;

        const payload: CompanyUpdatePayload = {};

        if (canUpdateProfile) {
            payload.name = name.trim();
            payload.address = address.trim() || null;
            payload.phone = phone.trim() || null;
            payload.email = email.trim() || null;
        }

        if (canUpdateSettings) {
            payload.country_code = countryCode;
            payload.currency_code = currencyCode;
            payload.bonuses_enabled = bonusesEnabled;
            payload.bonus_spend_max_percent = Math.max(
                0,
                Math.min(100, Number(bonusSpendMaxPercent) || 0)
            );
            payload.bonus_points_label = bonusPointsLabel.trim() || null;
        }

        setIsSaving(true);
        setMessage("");
        setError("");

        try {
            const updatedCompany = await updateCompany(company.id, payload);
            onSaved?.(updatedCompany);
            setMessage("Настройки сохранены");
        } catch (err) {
            setError(getApiErrorMessage(err, "Не удалось сохранить настройки компании"));
        } finally {
            setIsSaving(false);
        }
    };

    if (!company) {
        return (
            <section className="rounded-2xl border border-gray-200 bg-white p-4 text-gray-500 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-gray-400 dark:shadow-none">
                Компания не найдена.
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 shadow-sm dark:border-white/10 dark:bg-[rgb(var(--card))] dark:text-white dark:shadow-none">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Компания и регион</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Валюта, страна и бонусная программа приходят из API компании.
                    </p>
                </div>

                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-300">
                    {currencyCode}
                </span>
            </div>

            {!canSave && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                    У вас нет прав на изменение настроек компании.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2">
                    <label>
                        <span className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                            Название
                        </span>
                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            disabled={!canUpdateProfile || isSaving}
                            className={inputClass}
                        />
                    </label>

                    <label>
                        <span className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                            Email
                        </span>
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            disabled={!canUpdateProfile || isSaving}
                            className={inputClass}
                        />
                    </label>

                    <label>
                        <span className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                            Телефон
                        </span>
                        <input
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            disabled={!canUpdateProfile || isSaving}
                            className={inputClass}
                        />
                    </label>

                    <label>
                        <span className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                            Адрес
                        </span>
                        <input
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                            disabled={!canUpdateProfile || isSaving}
                            className={inputClass}
                        />
                    </label>
                </div>

                <div className="grid gap-3 border-t border-gray-200 pt-4 dark:border-white/10 md:grid-cols-2">
                    <label>
                        <span className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                            Страна
                        </span>
                        <select
                            value={countryCode}
                            onChange={(event) => setCountryCode(event.target.value)}
                            disabled={!canUpdateSettings || isSaving}
                            className={inputClass}
                        >
                            {COUNTRY_OPTIONS.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                    className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white"
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                            Валюта
                        </span>
                        <select
                            value={currencyCode}
                            onChange={(event) => setCurrencyCode(event.target.value)}
                            disabled={!canUpdateSettings || isSaving}
                            className={inputClass}
                        >
                            {CURRENCY_OPTIONS.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                    className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white"
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                            Локаль
                        </span>
                        <input value={localePreview} disabled className={inputClass} />
                    </label>

                    <label>
                        <span className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                            Максимум списания бонусами, %
                        </span>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={bonusSpendMaxPercent}
                            onChange={(event) =>
                                setBonusSpendMaxPercent(Number(event.target.value))
                            }
                            disabled={!canUpdateSettings || isSaving}
                            className={inputClass}
                        />
                    </label>

                    <label className="md:col-span-2">
                        <span className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                            Название бонусов
                        </span>
                        <input
                            value={bonusPointsLabel}
                            onChange={(event) => setBonusPointsLabel(event.target.value)}
                            disabled={!canUpdateSettings || isSaving}
                            placeholder="Например, бонусы"
                            className={inputClass}
                        />
                    </label>

                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm dark:border-white/10 dark:bg-white/5">
                        <input
                            type="checkbox"
                            checked={bonusesEnabled}
                            onChange={(event) => setBonusesEnabled(event.target.checked)}
                            disabled={!canUpdateSettings || isSaving}
                            className="h-4 w-4"
                        />
                        <span>Бонусная программа включена</span>
                    </label>
                </div>

                {(message || error) && (
                    <div
                        className={`rounded-xl px-3 py-2 text-sm ${
                            error
                                ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
                                : "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300"
                        }`}
                    >
                        {error || message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!canSave || isSaving}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-green-500 px-5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSaving ? "Сохранение..." : "Сохранить настройки"}
                </button>
            </form>
        </section>
    );
}
