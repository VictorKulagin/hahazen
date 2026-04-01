// components/clientsPage/CreateClientModal.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useCreateClient } from "@/hooks/useClient";
import type { Client } from "@/services/clientApi";

type Props = {
    isOpen: boolean;
    companyId: number | null;
    userId: number | null;
    onClose: () => void;
    onSave: () => void;
};

export const CreateClientModal: React.FC<Props> = ({ isOpen, companyId, userId, onClose, onSave }) => {
    const { mutateAsync: createClient } = useCreateClient();

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

    useEffect(() => {
        if (!isOpen) return;
        setSubmitError(null);
        setIsSubmitting(false);
        setSuccess(false);
        setVip(0);
        setDiscount(0);
        setForbidOnlineBooking(0);
    }, [isOpen]);

    if (!isOpen) return null;

    const getErrorMessage = (err: any) =>
        err?.response?.data?.message || err?.response?.data?.error || err?.message || "Не удалось создать клиента.";

    const handleSave = async () => {
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
                photo: null,
            };

            await createClient(payload);

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onSave();
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
                    Создать клиента
                </div>

                <div className="flex-1 overflow-y-auto p-4 text-black space-y-4 bg-gray-50">
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                        <input
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Имя"
                        />


                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                        <input
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Фамилия"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
                        <input
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                            value={patronymic}
                            onChange={(e) => setPatronymic(e.target.value)}
                            placeholder="Отчество"
                        />
                    </div>
                    </div>



                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                        <input
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Телефон"
                        />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                        />
                    </div>
                    </div>



                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">

                        {/* строка 1 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Пол</label>
                                <select
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value as any)}
                                >
                                    <option value="">—</option>
                                    <option value="male">Муж</option>
                                    <option value="female">Жен</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">VIP</label>
                                <select
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                    value={vip}
                                    onChange={(e) => setVip(Number(e.target.value) as 0 | 1)}
                                >
                                    <option value={0}>Нет</option>
                                    <option value={1}>Да</option>
                                </select>
                            </div>
                        </div>

                        {/* строка 2 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Скидка %</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                    value={discount}
                                    onChange={(e) => setDiscount(Number(e.target.value))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Дата рождения</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                />
                            </div>
                        </div>

                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Номер карты</label>
                            <input
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="Номер карты"
                            />
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Онлайн-запись</label>
                        <select
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                            value={forbidOnlineBooking}
                            onChange={(e) => setForbidOnlineBooking(Number(e.target.value) as 0 | 1)}
                        >
                            <option value={0}>Разрешена</option>
                            <option value={1}>Запрещена</option>
                        </select>
                    </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                    </div>

            </div>


            <div className="p-4 border-t bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">

                    {submitError && (
                        <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {submitError}
                        </div>
                    )}
                    {success && (
                        <div className="mb-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                            ✅ Клиент успешно создан!
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all duration-200"
                        >
                            Закрыть
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Создание..." : "Создать"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
