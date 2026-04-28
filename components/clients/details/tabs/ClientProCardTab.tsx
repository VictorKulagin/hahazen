"use client";

import React, { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import {
    Check,
    Edit3,
    FileText,
    Info,
    Loader2,
    MapPin,
    Plus,
    Save,
    Trash2,
} from "lucide-react";
import { Client } from "@/services/clientApi";
import {
    ClientProCardMark,
    ClientProCardType,
    UpsertClientProCardMarkPayload,
} from "@/services/clientProCardApi";
import {
    useClientProCard,
    useCreateClientProCardMark,
    useDeleteClientProCardMark,
    useUpdateClientProCard,
    useUpdateClientProCardMark,
} from "@/hooks/useClientProCard";
import { useClientAppointments } from "@/hooks/useClientAppointments";

type ClientProCardTabProps = {
    client: Client;
    canEdit: boolean;
};

type MarkFormState = {
    id?: number;
    appointment_id?: number | null;
    service_id?: number | null;
    map_key: string;
    mark_type: string;
    x: number;
    y: number;
    title: string;
    diagnosis: string;
    description: string;
};

const mapOptions = [
    {
        key: "front",
        label: "Спереди",
        imageSrc: "/images/pro-card/body-front.png",
    },
    {
        key: "back",
        label: "Сзади",
        imageSrc: "/images/pro-card/body-back.png",
    },
];

const proCardTypes: Array<{ value: ClientProCardType; label: string }> = [
    { value: "body", label: "Карта тела" },
    { value: "text", label: "Текст" },
];

const emptyMarkForm = (mapKey: string, x = 50, y = 50): MarkFormState => ({
    appointment_id: null,
    service_id: null,
    map_key: mapKey,
    mark_type: "note",
    x,
    y,
    title: "",
    diagnosis: "",
    description: "",
});

const getMarkLabel = (mark: ClientProCardMark) =>
    mark.title || mark.diagnosis || mark.description || "Без описания";

const PRO_CARD_NOTICE_STORAGE_KEY = "hahazen-pro-card-visual-notice-seen";

const proCardNoticeText = [
    "Модуль «Карта тела» предназначен исключительно для визуальных заметок и организации информации.",
    "Он не является медицинским инструментом, не предназначен для постановки диагнозов, назначения лечения или ведения медицинской документации.",
    "Пользователь самостоятельно несёт ответственность за содержание добавленных заметок.",
    "Продолжая использование, вы подтверждаете, что понимаете назначение модуля и согласны с этими условиями.",
];

export default function ClientProCardTab({
    client,
    canEdit,
}: ClientProCardTabProps) {
    const clientId = client.id;
    const [activeMapKey, setActiveMapKey] = useState("front");
    const [typeDraft, setTypeDraft] = useState<ClientProCardType>("body");
    const [titleDraft, setTitleDraft] = useState("");
    const [textDraft, setTextDraft] = useState("");
    const [markForm, setMarkForm] = useState<MarkFormState | null>(null);
    const [showVisualNotice, setShowVisualNotice] = useState(false);
    const [syncedClientId, setSyncedClientId] = useState<number | null>(null);

    const { data: proCard, isLoading, error } = useClientProCard(clientId);
    const updateCard = useUpdateClientProCard(clientId ?? 0);
    const createMark = useCreateClientProCardMark(clientId ?? 0);
    const updateMark = useUpdateClientProCardMark(clientId ?? 0);
    const deleteMark = useDeleteClientProCardMark(clientId ?? 0);

    const { data: appointments = [] } = useClientAppointments(clientId);

    useEffect(() => {
        if (!proCard || !clientId || syncedClientId === clientId) return;

        setTypeDraft(proCard.type);
        setTitleDraft(proCard.title ?? "");
        setTextDraft(proCard.text ?? "");
        setSyncedClientId(clientId);
    }, [clientId, proCard, syncedClientId]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const hasSeenNotice = window.localStorage.getItem(PRO_CARD_NOTICE_STORAGE_KEY);
        setShowVisualNotice(!hasSeenNotice);
    }, []);

    const marks = useMemo(() => proCard?.marks ?? [], [proCard]);
    const visibleMarks = useMemo(
        () => marks.filter((mark) => (mark.map_key ?? "front") === activeMapKey),
        [activeMapKey, marks],
    );

    const activeMap =
        mapOptions.find((item) => item.key === activeMapKey) ?? mapOptions[0];

    if (!clientId) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Профкарта станет доступна после сохранения клиента.
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 p-8 text-gray-500 dark:border-white/10 dark:text-gray-300">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Загрузка профкарты...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                Не удалось загрузить профкарту.
            </div>
        );
    }

    const saveCard = () => {
        updateCard.mutate({
            type: typeDraft,
            title: titleDraft || null,
            text: textDraft || null,
        });
    };

    const startEditMark = (mark: ClientProCardMark) => {
        setMarkForm({
            id: mark.id,
            appointment_id: mark.appointment_id ?? null,
            service_id: mark.service_id ?? null,
            map_key: mark.map_key ?? activeMapKey,
            mark_type: mark.mark_type ?? "note",
            x: Number(mark.x ?? 50),
            y: Number(mark.y ?? 50),
            title: mark.title ?? "",
            diagnosis: mark.diagnosis ?? "",
            description: mark.description ?? "",
        });
    };

    const handleMapClick = (event: MouseEvent<HTMLDivElement>) => {
        if (!canEdit || typeDraft !== "body") return;

        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        setMarkForm(emptyMarkForm(activeMapKey, Number(x.toFixed(3)), Number(y.toFixed(3))));
    };

    const submitMark = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!markForm) return;

        const payload: UpsertClientProCardMarkPayload = {
            map_key: markForm.map_key,
            mark_type: markForm.mark_type,
            x: markForm.x,
            y: markForm.y,
            title: markForm.title || null,
            diagnosis: markForm.diagnosis || null,
            description: markForm.description || null,
        };

        if (markForm.id) {
            updateMark.mutate(
                { markId: markForm.id, payload },
                { onSuccess: () => setMarkForm(null) },
            );
            return;
        }

        createMark.mutate(payload, { onSuccess: () => setMarkForm(null) });
    };

    const isSaving =
        updateCard.isPending ||
        createMark.isPending ||
        updateMark.isPending ||
        deleteMark.isPending;

    const closeVisualNotice = () => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(PRO_CARD_NOTICE_STORAGE_KEY, "1");
        }

        setShowVisualNotice(false);
    };

    return (
        <div className="space-y-5">
            {showVisualNotice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-900">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                            <MapPin className="h-5 w-5" />
                        </div>

                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Назначение модуля
                        </h2>

                        <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                            {proCardNoticeText.map((text) => (
                                <p key={text}>{text}</p>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={closeVisualNotice}
                            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                            Понятно
                        </button>
                    </div>
                </div>
            )}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                    Используется для визуальных заметок. Не является медицинской документацией.
                </p>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                        <label className="space-y-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                            <span>Тип профкарты</span>
                            <select
                                value={typeDraft}
                                disabled={!canEdit}
                                onChange={(event) =>
                                    setTypeDraft(event.target.value as ClientProCardType)
                                }
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-green-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            >
                                {proCardTypes.map((item) => (
                                    <option key={item.value} value={item.value} className="bg-white text-black dark:bg-[rgb(var(--card))] dark:text-white">
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                            <span>Заголовок</span>
                            <input
                                value={titleDraft}
                                disabled={!canEdit}
                                onChange={(event) => setTitleDraft(event.target.value)}
                                placeholder={typeDraft === "body" ? "Карта тела" : "Профкарта"}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                        </label>
                    </div>

                    {canEdit && (
                        <button
                            type="button"
                            onClick={saveCard}
                            disabled={updateCard.isPending}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save className="h-4 w-4" />
                            <span>Сохранить</span>
                        </button>
                    )}
                </div>

                <label className="mt-4 block space-y-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    <span>Общий текст</span>
                    <textarea
                        value={textDraft}
                        disabled={!canEdit}
                        onChange={(event) => setTextDraft(event.target.value)}
                        placeholder="Общие рекомендации, особенности клиента, противопоказания"
                        rows={4}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                </label>
            </div>

            {typeDraft === "text" ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                    <div className="mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                        <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h2 className="text-lg font-semibold">Текстовая профкарта</h2>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
                        {textDraft || "Пока нет текста профкарты."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {titleDraft || "Карта тела"}
                                </h2>

                                <button
                                    type="button"
                                    onClick={() => setShowVisualNotice(true)}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
                                    title="Назначение модуля"
                                >
                                    <Info className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/[0.03]">
                                {mapOptions.map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => setActiveMapKey(item.key)}
                                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                            activeMapKey === item.key
                                                ? "bg-green-600 text-white"
                                                : "text-gray-600 hover:bg-white dark:text-gray-300 dark:hover:bg-white/10"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div
                            role="button"
                            tabIndex={0}
                            onClick={handleMapClick}
                            className="relative mx-auto aspect-[11/16] max-h-[640px] w-full max-w-[520px] overflow-hidden rounded-2xl border border-gray-200 bg-[linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] bg-[size:44px_44px] dark:border-white/10 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]"
                        >
                            <div className="absolute inset-6 flex items-center justify-center">
                                <img
                                    src={activeMap.imageSrc}
                                    alt={`Карта тела: ${activeMap.label.toLocaleLowerCase("ru-RU")}`}
                                    className="h-full w-full object-contain"
                                />
                            </div>

                            {visibleMarks.map((mark, index) => (
                                <button
                                    key={mark.id}
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        startEditMark(mark);
                                    }}
                                    className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-lg ring-4 ring-white/80 transition hover:scale-105 dark:ring-slate-900/80"
                                    style={{
                                        left: `${mark.x ?? 50}%`,
                                        top: `${mark.y ?? 50}%`,
                                    }}
                                    title={getMarkLabel(mark)}
                                >
                                    {index + 1}
                                </button>
                            ))}

                            {markForm && markForm.map_key === activeMapKey && !markForm.id && (
                                <div
                                    className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-600 shadow-lg ring-4 ring-white/80 dark:ring-slate-900/80"
                                    style={{
                                        left: `${markForm.x}%`,
                                        top: `${markForm.y}%`,
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {canEdit && (
                            <button
                                type="button"
                                onClick={() => setMarkForm(emptyMarkForm(activeMapKey))}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-green-500 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-500/10"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Добавить отметку</span>
                            </button>
                        )}

                        {markForm && (
                            <form
                                onSubmit={submitMark}
                                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none"
                            >
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {markForm.id ? "Редактировать отметку" : "Новая отметка"}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setMarkForm(null)}
                                        className="text-sm text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                    >
                                        Отмена
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <select
                                        value={markForm.appointment_id ?? ""}
                                        onChange={(event) => {
                                            const appointmentId = event.target.value ? Number(event.target.value) : null;
                                            const appointment = appointments.find((item) => item.id === appointmentId);
                                            const serviceId = appointment?.services?.[0]?.service_id ?? null;

                                            setMarkForm({
                                                ...markForm,
                                                appointment_id: appointmentId,
                                                service_id: serviceId,
                                            });
                                        }}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-green-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    >
                                        <option value="">Без привязки к визиту</option>

                                        {appointments.map((appointment) => (
                                            <option key={appointment.id} value={appointment.id}>
                                                {appointment.appointment_datetime} · {appointment.total_duration} мин
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        value={markForm.title}
                                        onChange={(event) =>
                                            setMarkForm({ ...markForm, title: event.target.value })
                                        }
                                        placeholder="Зона, например: Поясница"
                                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    />
                                    <input
                                        value={markForm.diagnosis}
                                        onChange={(event) =>
                                            setMarkForm({
                                                ...markForm,
                                                diagnosis: event.target.value,
                                            })
                                        }
                                        placeholder="Заметка мастера"
                                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    />
                                    <textarea
                                        value={markForm.description}
                                        onChange={(event) =>
                                            setMarkForm({
                                                ...markForm,
                                                description: event.target.value,
                                            })
                                        }
                                        placeholder="Комментарий"
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Check className="h-4 w-4" />
                                    <span>Сохранить отметку</span>
                                </button>
                            </form>
                        )}

                        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                            <div className="mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                                <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <h3 className="font-semibold">Хронология отметок</h3>
                            </div>

                            <div className="space-y-2">
                                {visibleMarks.length === 0 ? (
                                    <p className="rounded-xl bg-gray-50 px-3 py-4 text-sm text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
                                        На этой стороне карты отметок пока нет.
                                    </p>
                                ) : (
                                    visibleMarks.map((mark, index) => (
                                        <div
                                            key={mark.id}
                                            className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 dark:border-white/10"
                                        >
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {getMarkLabel(mark)}
                                                </p>
                                                {mark.description && (
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        {mark.description}
                                                    </p>
                                                )}
                                            </div>
                                            {canEdit && (
                                                <div className="flex shrink-0 gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditMark(mark)}
                                                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                                                        title="Редактировать"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteMark.mutate(mark.id)}
                                                        disabled={deleteMark.isPending}
                                                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                                                        title="Удалить"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
