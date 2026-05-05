"use client";

import React, { FormEvent, useMemo, useRef, useState } from "react";
import { Gift, Loader2, MinusCircle, PlusCircle, Wallet } from "lucide-react";
import { Client, ClientBonusTransactionKind } from "@/services/clientApi";
import {
    useClientBonusTransactions,
    useCreateClientBonusTransaction,
} from "@/hooks/useClientBonusTransactions";

type ClientBonusesTabProps = {
    client: Client;
    canEdit: boolean;
};

const kindLabels: Record<ClientBonusTransactionKind, string> = {
    top_up: "Начисление",
    spend: "Списание",
    manual: "Коррекция",
};

const formatBonusAmount = (value?: number | null) =>
    new Intl.NumberFormat("ru-RU").format(Number(value ?? 0));

const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function ClientBonusesTab({
    client,
    canEdit,
}: ClientBonusesTabProps) {
    const clientId = client.id;
    const [operation, setOperation] =
        useState<ClientBonusTransactionKind>("top_up");
    const [amount, setAmount] = useState("");
    const [comment, setComment] = useState("");
    const [formError, setFormError] = useState("");
    const amountInputRef = useRef<HTMLInputElement>(null);
    const {
        data: transactions = [],
        isLoading,
        error,
    } = useClientBonusTransactions(clientId);
    const createTransaction = useCreateClientBonusTransaction(clientId);

    const balance = useMemo(
        () => formatBonusAmount(client.bonus_balance),
        [client.bonus_balance],
    );

    const amountHint =
        operation === "spend"
            ? "Введите сколько бонусов списать. Знак минус ставить не нужно."
            : operation === "manual"
              ? "Введите изменение баланса: например -30 или 50."
              : "Введите сколько бонусов начислить.";

    const amountAccentClass =
        operation === "spend"
            ? "border-red-300 bg-red-50/70 ring-2 ring-red-100 focus:border-red-500 dark:border-red-500/40 dark:bg-red-500/10 dark:ring-red-500/15"
            : operation === "manual"
              ? "border-blue-300 bg-blue-50/70 ring-2 ring-blue-100 focus:border-blue-500 dark:border-blue-500/40 dark:bg-blue-500/10 dark:ring-blue-500/15"
              : "border-gray-200 bg-white focus:border-green-500 dark:border-white/10 dark:bg-white/5";

    const selectOperation = (nextOperation: ClientBonusTransactionKind) => {
        setOperation(nextOperation);
        setFormError("");
        window.setTimeout(() => amountInputRef.current?.focus(), 0);
    };

    const submitTransaction = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");

        const normalizedAmount = Number(amount.replace(",", "."));

        if (!Number.isInteger(normalizedAmount)) {
            setFormError("Введите целое число бонусов.");
            return;
        }

        if (operation !== "manual" && normalizedAmount <= 0) {
            setFormError("Для начисления или списания введите число больше нуля.");
            return;
        }

        if (operation === "manual" && normalizedAmount === 0) {
            setFormError("Для корректировки введите ненулевое изменение баланса.");
            return;
        }

        const delta =
            operation === "spend" ? -normalizedAmount : normalizedAmount;

        createTransaction.mutate(
            {
                delta,
                kind: operation,
                comment: comment.trim() || null,
            },
            {
                onSuccess: () => {
                    setAmount("");
                    setComment("");
                },
                onError: (mutationError) => {
                    const message =
                        (mutationError as { response?: { data?: { message?: string } } })
                            ?.response?.data?.message;
                    setFormError(message ?? "Не удалось сохранить операцию.");
                },
            },
        );
    };

    if (!clientId) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Бонусы станут доступны после сохранения клиента.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-500/30 dark:bg-green-500/10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-white">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-200">
                                Текущий баланс
                            </p>
                            <p className="text-3xl font-semibold text-green-900 dark:text-white">
                                {balance} бонусов
                            </p>
                        </div>
                    </div>

                    <p className="mt-4 text-sm text-green-800 dark:text-green-100">
                        Баланс обновляется после каждой операции и хранится в карточке клиента.
                    </p>
                </div>

                {canEdit && (
                    <form
                        onSubmit={submitTransaction}
                        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none"
                    >
                        <div className="mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <h2 className="font-semibold">Операция с бонусами</h2>
                        </div>

                        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <button
                                type="button"
                                onClick={() => selectOperation("top_up")}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                                    operation === "top_up"
                                        ? "bg-green-600 text-white"
                                        : "border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                                }`}
                            >
                                <PlusCircle className="h-4 w-4" />
                                <span>Начислить</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => selectOperation("spend")}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                                    operation === "spend"
                                        ? "bg-red-600 text-white"
                                        : "border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                                }`}
                            >
                                <MinusCircle className="h-4 w-4" />
                                <span>Списать</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => selectOperation("manual")}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                                    operation === "manual"
                                        ? "bg-blue-600 text-white"
                                        : "border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                                }`}
                            >
                                <Wallet className="h-4 w-4" />
                                <span>Коррекция</span>
                            </button>
                        </div>

                        <label className="block space-y-1">
                            <span className="flex items-center justify-between gap-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                                <span>Количество бонусов</span>
                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                                    {amountHint}
                                </span>
                            </span>
                            <input
                                ref={amountInputRef}
                                value={amount}
                                onChange={(event) => setAmount(event.target.value)}
                                inputMode={operation === "manual" ? "text" : "numeric"}
                                placeholder={
                                    operation === "manual"
                                        ? "Например, -30 или 50"
                                        : "Например, 50"
                                }
                                className={`w-full rounded-xl border px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 dark:text-white ${amountAccentClass}`}
                            />
                        </label>

                        <label className="mt-3 block space-y-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                Комментарий
                            </span>
                            <textarea
                                value={comment}
                                onChange={(event) => setComment(event.target.value)}
                                rows={3}
                                placeholder="Причина операции"
                                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                        </label>

                        {formError && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-300">
                                {formError}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={createTransaction.isPending}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {createTransaction.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            <span>
                                {createTransaction.isPending
                                    ? "Сохранение..."
                                    : "Сохранить операцию"}
                            </span>
                        </button>
                    </form>
                )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    История бонусов
                </h2>

                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 p-8 text-gray-500 dark:border-white/10 dark:text-gray-300">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Загрузка операций...</span>
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                        Не удалось загрузить историю бонусов.
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
                        <Gift className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                        <p className="font-semibold text-gray-900 dark:text-white">
                            Операций пока нет
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Начисления и списания появятся здесь после первой операции.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-white/10">
                        {transactions.map((transaction) => {
                            const isPositive = transaction.delta > 0;

                            return (
                                <div
                                    key={transaction.id}
                                    className="grid gap-3 py-3 md:grid-cols-[160px_minmax(0,1fr)_160px_160px] md:items-center"
                                >
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(transaction.created_at)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {kindLabels[transaction.kind] ?? transaction.kind}
                                        </p>
                                        {transaction.comment && (
                                            <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                                                {transaction.comment}
                                            </p>
                                        )}
                                    </div>
                                    <div
                                        className={`font-semibold ${
                                            isPositive
                                                ? "text-green-600 dark:text-green-300"
                                                : "text-red-600 dark:text-red-300"
                                        }`}
                                    >
                                        {isPositive ? "+" : ""}
                                        {formatBonusAmount(transaction.delta)}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        Баланс: {formatBonusAmount(transaction.balance_after)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
