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
        <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow max-w-xl mx-auto text-black">
            <button type="button" onClick={onCancel} className="mb-4 text-green-600 hover:underline">
                ← Назад к списку
            </button>

            <h1 className="text-2xl font-bold mb-4">Редактирование клиента: {formData.name}</h1>

            <label className="block mb-2">
                Имя
                <input name="name" value={formData.name || ""} onChange={handleChange} required className="w-full border p-2 rounded" />
            </label>

            <label className="block mb-2">
                Фамилия
                <input name="last_name" value={formData.last_name || ""} onChange={handleChange} className="w-full border p-2 rounded" />
            </label>

            <label className="block mb-2">
                Телефон
                <input name="phone" value={formData.phone || ""} onChange={handleChange} className="w-full border p-2 rounded" />
            </label>

            <label className="block mb-2">
                Email
                <input name="email" value={formData.email || ""} onChange={handleChange} className="w-full border p-2 rounded" />
            </label>

            <label className="block mb-2">
                Пол
                <select name="gender" value={formData.gender || ""} onChange={handleChange} className="w-full border p-2 rounded">
                    <option value="">Выберите пол</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                </select>
            </label>

            <label className="block mb-2 flex items-center space-x-2">
                <input
                    type="checkbox"
                    name="vip"
                    checked={!!formData.vip}
                    onChange={handleChange}
                />
                <span>VIP</span>
            </label>

            <label className="block mb-2">
                Скидка, %
                <input
                    type="number"
                    name="discount"
                    value={formData.discount ?? ""}
                    onChange={handleChange}
                    min={0}
                    max={100}
                    className="w-full border p-2 rounded"
                />
            </label>

            <label className="block mb-2 flex items-center space-x-2">
                <input
                    type="checkbox"
                    name="forbid_online_booking"
                    checked={!!formData.forbid_online_booking}
                    onChange={handleChange}
                />
                <span>Запретить онлайн бронирование</span>
            </label>

            <label className="block mb-2">
                Комментарий
                <textarea name="comment" value={formData.comment || ""} onChange={handleChange} className="w-full border p-2 rounded" />
            </label>

            <label className="block mb-2">
                Фото (URL)
                <input name="photo" value={formData.photo || ""} onChange={handleChange} className="w-full border p-2 rounded" />
            </label>

            <button
                type="submit"
                disabled={updateMutation.isPending}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
                {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </button>

            {updateMutation.isError && (
                <p className="text-red-500 mt-2">Ошибка: {(updateMutation.error as Error).message}</p>
            )}
        </form>
    );
};

export default ClientCardEditable;
