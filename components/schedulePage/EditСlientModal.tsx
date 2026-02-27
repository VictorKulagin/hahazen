// components/schedulePage/EditСlientModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import type { Client } from "@/services/clientApi";
import { useUpdateClient } from "@/hooks/useClient";

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

    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

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

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
            <div className="bg-white w-full sm:w-[28rem] h-full shadow-lg flex flex-col">
                <div className="p-4 border-b bg-gray-50 text-black font-semibold">
                    Редактировать клиента
                </div>

                <div className="flex-1 overflow-y-auto p-4 text-black">
                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Имя *</label>
                        <input
                            className="w-full p-2 border rounded"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Фамилия</label>
                        <input
                            className="w-full p-2 border rounded"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Отчество</label>
                        <input
                            className="w-full p-2 border rounded"
                            value={patronymic}
                            onChange={(e) => setPatronymic(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Телефон</label>
                        <input
                            className="w-full p-2 border rounded"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Email</label>
                        <input
                            className="w-full p-2 border rounded"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block font-semibold mb-1">Пол</label>
                            <select
                                className="w-full p-2 border rounded bg-white"
                                value={gender}
                                onChange={(e) => setGender(e.target.value as any)}
                            >
                                <option value="">—</option>
                                <option value="male">Муж</option>
                                <option value="female">Жен</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-semibold mb-1">VIP</label>
                            <select
                                className="w-full p-2 border rounded bg-white"
                                value={vip}
                                onChange={(e) => setVip(Number(e.target.value) as 0 | 1)}
                            >
                                <option value={0}>Нет</option>
                                <option value={1}>Да</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block font-semibold mb-1">Скидка %</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded"
                                value={discount}
                                onChange={(e) => setDiscount(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Дата рождения</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Номер карты</label>
                        <input
                            className="w-full p-2 border rounded"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Онлайн-запись</label>
                        <select
                            className="w-full p-2 border rounded bg-white"
                            value={forbidOnlineBooking}
                            onChange={(e) =>
                                setForbidOnlineBooking(Number(e.target.value) as 0 | 1)
                            }
                        >
                            <option value={0}>Разрешена</option>
                            <option value={1}>Запрещена</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Комментарий</label>
                        <textarea
                            className="w-full p-2 border rounded"
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                </div>

                {/* Футер: сообщения над кнопками */}
                <div className="p-4 border-t">
                    {submitError && (
                        <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {submitError}
                        </div>
                    )}

                    {success && (
                        <div className="mb-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                            ✅ Данные клиента обновлены!
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
                            Закрыть
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
                        >
                            {isSubmitting ? "Сохранение..." : "Сохранить"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
