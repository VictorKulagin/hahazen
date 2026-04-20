// components/schedulePage/EditСlientModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import type { Client } from "@/services/clientApi";
import { useUpdateClient, useDeleteClient } from "@/hooks/useClient";
import {CalendarDays} from "lucide-react";

type Props = {
    isOpen: boolean;
    client: Client | null;          // редактируемый клиент
    companyId: number | null;       // чтобы гарантированно отправлять
    userId: number | null;          // чтобы гарантированно отправлять
    onClose: () => void;
    onSave: (updated: Client) => void;
};

export const EditClientModal: React.FC<Props> = ({
                                                     isOpen,
                                                     client,
                                                     companyId,
                                                     userId,
                                                     onClose,
                                                     onSave,
                                                 }) => {
    const { mutateAsync: updateClient } = useUpdateClient();
    const { mutateAsync: deleteClient } = useDeleteClient();

    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [patronymic, setPatronymic] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [gender, setGender] = useState<"" | "male" | "female">("");
    const [vip, setVip] = useState<0 | 1>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [cardNumber, setCardNumber] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [forbidOnlineBooking, setForbidOnlineBooking] = useState<0 | 1>(0);
    const [comment, setComment] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const inputClass = "w-full px-4 py-3 rounded-xl \
border border-gray-200 dark:border-white/10 \
bg-white dark:bg-white/5 \
text-black dark:text-white \
transition \
focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500";

    // Заполняем форму при открытии / смене клиента
    useEffect(() => {
        if (!isOpen || !client) return;

        setSubmitError(null);
        setSuccess(false);
        setIsSubmitting(false);

        setName(client.name ?? "");
        setLastName(client.last_name ?? "");
        setPatronymic(client.patronymic ?? "");
        setPhone(client.phone ?? "");
        setEmail(client.email ?? "");
        setGender((client.gender as any) ?? "");
        setVip((client.vip ?? 0) as 0 | 1);
        setDiscount(client.discount ?? 0);
        setCardNumber(client.card_number ?? "");
        setBirthDate(client.birth_date ?? "");
        setForbidOnlineBooking((client.forbid_online_booking ?? 0) as 0 | 1);
        setComment(client.comment ?? "");
    }, [isOpen, client]);

    if (!isOpen) return null;

    const getErrorMessage = (err: any) =>
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Не удалось обновить клиента.";

    const handleSave = async () => {
        if (!client?.id) {
            setSubmitError("Не удалось определить ID клиента.");
            return;
        }
        if (!companyId || !userId) {
            setSubmitError("Не удалось определить companyId/userId.");
            return;
        }
        if (!name.trim()) {
            setSubmitError("Имя обязательно.");
            return;
        }

        setSubmitError(null);
        setIsSubmitting(true);

        try {
            const payload: Client = {
                // важно: оставляем id отдельно — он берётся в useUpdateClient
                user_id: userId,
                company_id: companyId,

                name: name.trim(),
                last_name: lastName.trim() || undefined,
                patronymic: patronymic.trim() || undefined,
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
                gender: gender || undefined,
                vip,
                discount,
                card_number: cardNumber.trim() || undefined,
                birth_date: birthDate || undefined,
                forbid_online_booking: forbidOnlineBooking,
                comment: comment.trim() || undefined,
                photo: client.photo ?? null, // фото пока не редактируем — сохраняем как было
            };

            const updated = await updateClient({ id: client.id, data: payload });

            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
                onSave(updated);
                onClose();
            }, 1200);
        } catch (err) {
            setSubmitError(String(getErrorMessage(err)));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!client?.id) {
            setSubmitError("Не удалось определить ID клиента.");
            return;
        }

        const confirmed = window.confirm("Удалить клиента? Это действие нельзя отменить.");
        if (!confirmed) return;

        setSubmitError(null);
        setIsDeleting(true);

        try {
            await deleteClient(client.id);
            onClose();
        } catch (err: any) {
            setSubmitError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Не удалось удалить клиента."
            );
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
            <div className="bg-[rgb(var(--background))] text-[rgb(var(--foreground))] w-full sm:w-[28rem] h-full shadow-lg rounded-l-2xl rounded-tr-2xl overflow-hidden flex flex-col">
                <div className="sticky top-0 z-20 border-b border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[rgb(var(--card))]/95 backdrop-blur-md">
                    <div className="flex items-start justify-between px-4 py-0">
                        <div className="flex items-start gap-3 min-w-0">
                            <span className="mt-[1.3rem] h-2 w-2 rounded-full bg-emerald-400 shrink-0" />

                            <h2 className="text-[17px] leading-[2.75] font-semibold text-[rgb(var(--foreground))] truncate">
                                Редактирование клиента
                            </h2>
                        </div>

                        <button
                            onClick={onClose}
                            className="
        mt-[8px]
        flex h-9 w-9 items-center justify-center
        rounded-xl
        border border-gray-200 dark:border-white/10
        bg-gray-100 text-gray-500
        hover:bg-gray-200 hover:text-gray-700
        dark:bg-white/5 dark:text-white/60
        dark:hover:bg-white/10 dark:hover:text-white
        transition
      "
                        >
                            ✕
                        </button>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
                </div>

                <div className="flex-1 overflow-y-auto p-4 text-black dark:text-white space-y-4 bg-gray-50 dark:bg-[rgb(var(--background))]">
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                            <input
                                className={inputClass}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Имя"
                            />
                       </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                        <input
                            className={inputClass}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Фамилия"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
                        <input
                            className={inputClass}
                            value={patronymic}
                            onChange={(e) => setPatronymic(e.target.value)}
                            placeholder="Отчество"
                        />
                    </div>
                    </div>


                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                            <input
                                className={inputClass}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Телефон"
                            />
                        </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            className={inputClass}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                        />
                    </div>
                    </div>

                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Пол</label>
                            <select
                                className={`${inputClass} bg-white dark:bg-[rgb(var(--card))]`}
                                value={gender}
                                onChange={(e) => setGender(e.target.value as any)}
                            >
                                <option value="" className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white">—</option>
                                <option value="male" className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white">Муж</option>
                                <option value="female" className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white">Жен</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">VIP</label>
                            <select
                                className={`${inputClass} bg-white dark:bg-[rgb(var(--card))]`}
                                value={vip}
                                onChange={(e) => setVip(Number(e.target.value) as 0 | 1)}
                            >
                                <option value={0} className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white">Нет</option>
                                <option value={1} className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white">Да</option>
                            </select>
                        </div>
                    </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Скидка %</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={discount}
                                onChange={(e) => setDiscount(Number(e.target.value))}
                                placeholder="Скидка %"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Дата рождения</label>
                            <div className="relative">
                            <input
                                type="date"
                                className={inputClass}
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                placeholder="Дата рождения"
                            />
                                <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-white pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    </div>

                        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Номер карты</label>
                        <input
                            className={inputClass}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="Номер карты"
                        />
                            </div>
                        </div>

                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Онлайн-запись</label>
                        <select
                            className={`${inputClass} bg-white dark:bg-[rgb(var(--card))]`}
                            value={forbidOnlineBooking}
                            onChange={(e) =>
                                setForbidOnlineBooking(Number(e.target.value) as 0 | 1)
                            }
                        >
                            <option value={0} className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white">Разрешена</option>
                            <option value={1} className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white">Запрещена</option>
                        </select>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                        <textarea
                            className={`${inputClass} bg-white dark:bg-[rgb(var(--card))]`}
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                        </div>
                    </div>
                </div>

                {/* Футер: сообщения над кнопками */}
                <div className="sticky bottom-0 z-20 border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[rgb(var(--card))]/95 backdrop-blur-md px-4 py-4">

                    {(submitError || success) && (
                        <div className="mb-3">
                            {submitError && (
                                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                                    {submitError}
                                </div>
                            )}
                            {success && (
                                <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                                    ✅ Сохранено
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between gap-3">
                        {/* Удалить */}
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting || isSubmitting}
                            className={`
        h-11 px-5 rounded-xl border transition
        ${
                                isDeleting
                                    ? "bg-red-50 text-red-400 border-red-100 cursor-not-allowed"
                                    : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                            }
      `}
                        >
                            {isDeleting ? "Удаление..." : "Удалить"}
                        </button>

                        <div className="flex gap-3">
                            {/* Закрыть */}
                            <button
                                onClick={onClose}
                                className="
          h-11 px-5 rounded-xl
          border border-gray-300
          bg-white text-gray-700
          hover:bg-gray-100
          dark:border-white/10
          dark:bg-white/[0.03]
          dark:text-[rgb(var(--foreground))]
          dark:hover:bg-white/10
          transition
        "
                            >
                                Закрыть
                            </button>

                            {/* Сохранить */}
                            <button
                                onClick={handleSave}
                                disabled={isSubmitting || isDeleting}
                                className={`
          h-11 px-5 rounded-xl font-medium text-white transition
          ${
                                    isSubmitting || isDeleting
                                        ? "bg-green-500/70 cursor-not-allowed"
                                        : "bg-green-600 hover:bg-green-700"
                                }
        `}
                            >
                                {isSubmitting ? "Сохранение..." : "Сохранить"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
