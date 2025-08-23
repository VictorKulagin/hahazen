import React, { useState } from "react";
import { Client } from "@/services/clientApi";
import { useUpdateClient } from "@/hooks/useClient";

interface Props {
    selectedClient: Client;
    onCancel: () => void;
}

const ClientCardEditable: React.FC<Props> = ({ selectedClient, onCancel }) => {
    const [formData, setFormData] = useState<Client>({ ...selectedClient });
    const updateMutation = useUpdateClient();

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;

        if (type === "checkbox") {
            // Приводим к HTMLInputElement, чтобы получить checked
            const target = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: target.checked ? 1 : 0 }));
        } else if (type === "number") {
            setFormData(prev => ({ ...prev, [name]: Number(value) || undefined }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.id) return;
        updateMutation.mutate(
            { id: formData.id, data: formData },
            {
                onSuccess: () => {
                    onCancel();
                },
            }
        );
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="p-6 bg-gray-50 rounded-xl shadow-md max-w-xl mx-auto text-black space-y-4"
        >
            {/* Кнопка назад */}
            <button
                type="button"
                onClick={onCancel}
                className="text-green-600 hover:text-green-800 font-semibold flex items-center space-x-2"
            >
                ← <span>Назад к списку</span>
            </button>

            {/* Заголовок */}
            <h1 className="text-2xl font-bold text-gray-900">Редактирование клиента: {formData.name}</h1>

            {/* Поля формы */}
            <div className="space-y-3">
                <label className="block">
                    <span className="font-semibold">Имя</span>
                    <input
                        name="name"
                        value={formData.name || ""}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </label>

                <label className="block">
                    <span className="font-semibold">Фамилия</span>
                    <input
                        name="last_name"
                        value={formData.last_name || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </label>

                <label className="block">
                    <span className="font-semibold">Телефон</span>
                    <input
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </label>

                <label className="block">
                    <span className="font-semibold">Email</span>
                    <input
                        name="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </label>

                <label className="block">
                    <span className="font-semibold">Пол</span>
                    <select
                        name="gender"
                        value={formData.gender || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                        <option value="">Выберите пол</option>
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                    </select>
                </label>

                {/* Чекбоксы */}
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        name="vip"
                        checked={!!formData.vip}
                        onChange={handleChange}
                        className="h-4 w-4 text-green-600 rounded focus:ring-2 focus:ring-green-400"
                    />
                    <span className="font-semibold">VIP</span>
                </label>

                <label className="block">
                    <span className="font-semibold">Скидка, %</span>
                    <input
                        type="number"
                        name="discount"
                        value={formData.discount ?? ""}
                        onChange={handleChange}
                        min={0}
                        max={100}
                        className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </label>

                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        name="forbid_online_booking"
                        checked={!!formData.forbid_online_booking}
                        onChange={handleChange}
                        className="h-4 w-4 text-red-600 rounded focus:ring-2 focus:ring-red-400"
                    />
                    <span className="font-semibold">Запретить онлайн бронирование</span>
                </label>

                <label className="block">
                    <span className="font-semibold">Комментарий</span>
                    <textarea
                        name="comment"
                        value={formData.comment || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </label>

                <label className="block">
                    <span className="font-semibold">Фото (URL)</span>
                    <input
                        name="photo"
                        value={formData.photo || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </label>
            </div>

            {/* Кнопка сохранения */}
            <button
                type="submit"
                disabled={updateMutation.isPending}
                className={`mt-4 w-full px-4 py-2 rounded-lg text-white font-semibold transition ${
                    updateMutation.isPending ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
            >
                {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </button>

            {/* Ошибка */}
            {updateMutation.isError && (
                <p className="text-red-500 mt-2">Ошибка: {(updateMutation.error as Error).message}</p>
            )}
        </form>
    );
};

export default ClientCardEditable;
