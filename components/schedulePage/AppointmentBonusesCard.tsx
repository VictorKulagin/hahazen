"use client";

import React, { useEffect } from "react";
import { Gift, Sparkles } from "lucide-react";
import { formatMoney } from "@/lib/currency";

type AppointmentBonusesCardProps = {
    clientId?: number | null;
    balance?: number | null;
    cost: number;
    value: number;
    onChange: (value: number) => void;
    currencyCode?: string | null;
    maxSpendPercent?: number | null;
    pointsLabel?: string | null;
};

const formatAmount = (value: number) =>
    new Intl.NumberFormat("ru-RU").format(Math.max(0, Math.round(value)));

const parseAmount = (value: string) => {
    const normalized = Number(value.replace(/\s/g, "").replace(",", "."));

    return Number.isFinite(normalized) ? Math.max(0, Math.floor(normalized)) : 0;
};

export default function AppointmentBonusesCard({
    clientId,
    balance,
    cost,
    value,
    onChange,
    currencyCode,
    maxSpendPercent = 100,
    pointsLabel = "Б",
}: AppointmentBonusesCardProps) {
    const availableBalance = Math.max(0, Number(balance ?? 0));
    const percentLimit = Math.max(0, Math.min(100, Number(maxSpendPercent ?? 100)));
    const costLimit = Math.floor((Math.max(0, cost) * percentLimit) / 100);
    const maxSpend = Math.min(availableBalance, costLimit);
    const spendAmount = Math.min(value, maxSpend);
    const payableAmount = Math.max(0, cost - spendAmount);
    const pointsUnit = pointsLabel?.trim() || "Б";
    const isUnavailable = !clientId || maxSpend <= 0;
    const isCompact = !clientId || availableBalance <= 0;

    const setSpendAmount = (nextValue: number) => {
        onChange(Math.min(Math.max(0, Math.floor(nextValue)), maxSpend));
    };

    useEffect(() => {
        if (value > maxSpend) {
            onChange(maxSpend);
        }
    }, [value, maxSpend, onChange]);

    return (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-400/20 dark:bg-violet-500/10">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-violet-600 dark:text-violet-300" />
                    <h3 className="text-[13px] font-semibold tracking-wide text-gray-900 dark:text-white/90">
                        Бонусы клиента
                    </h3>
                </div>

                <div className="text-right text-sm">
                    <span className="text-gray-500 dark:text-white/50">Доступно: </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                        {formatAmount(availableBalance)} {pointsUnit}
                    </span>
                </div>
            </div>

            {isCompact ? (
                <p className="text-xs text-gray-500 dark:text-white/45">
                    {!clientId
                        ? "Выберите клиента, чтобы списать бонусы."
                        : "У клиента пока нет бонусов для списания."}
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2">
                        <div className="relative">
                            <input
                                value={spendAmount || ""}
                                onChange={(event) =>
                                    setSpendAmount(parseAmount(event.target.value))
                                }
                                disabled={isUnavailable}
                                inputMode="numeric"
                                placeholder="0"
                                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-16 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 disabled:bg-gray-100 disabled:text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:disabled:bg-white/5 dark:disabled:text-white/30"
                            />
                            <span className="pointer-events-none absolute right-4 top-1/2 max-w-12 -translate-y-1/2 truncate text-sm text-gray-400">
                                {pointsUnit}
                            </span>
                        </div>

                        {[100, 500].map((amount) => (
                            <button
                                key={amount}
                                type="button"
                                onClick={() => setSpendAmount(spendAmount + amount)}
                                disabled={isUnavailable || spendAmount >= maxSpend}
                                className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                            >
                                +{amount}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => setSpendAmount(maxSpend)}
                            disabled={isUnavailable}
                            className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                        >
                            Макс
                        </button>
                    </div>

                    <div className="mt-3 rounded-xl border border-white/60 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex items-center justify-between gap-3 text-sm text-gray-500 dark:text-white/55">
                            <span>Стоимость услуг</span>
                            <span>{formatMoney(cost, currencyCode)}</span>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3 text-sm text-emerald-700 dark:text-emerald-300">
                            <span className="inline-flex items-center gap-1">
                                <Sparkles className="h-4 w-4" />
                                Списать бонусами
                            </span>
                            <span>
                                -{formatAmount(spendAmount)} {pointsUnit}
                            </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-200 pt-3 dark:border-white/10">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                К оплате
                            </span>
                            <span className="text-xl font-bold text-violet-600 dark:text-violet-300">
                                {formatMoney(payableAmount, currencyCode)}
                            </span>
                        </div>
                    </div>

                    <p className="mt-2 text-xs text-gray-500 dark:text-white/45">
                        {maxSpend <= 0
                            ? "Для этой записи бонусы списать нельзя: нет доступного баланса, стоимости или лимита списания."
                            : "Бонусы спишутся после сохранения записи."}
                    </p>
                </>
            )}
        </div>
    );
}
