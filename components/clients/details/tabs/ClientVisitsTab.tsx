"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import {
    CalendarCheck,
    Check,
    Clock,
    CreditCard,
    Edit3,
    FileText,
    Loader2,
    Map as MapIcon,
    MapPin,
} from "lucide-react";
import { Client } from "@/services/clientApi";
import {
    useClientAppointments,
    useUpdateClientAppointmentComment,
} from "@/hooks/useClientAppointments";
import { useClientProCard } from "@/hooks/useClientProCard";
import { ClientProCardMark } from "@/services/clientProCardApi";
import { AppointmentResponse } from "@/types/appointments";

type ClientVisitsTabProps = {
    client: Client;
};

type BodyMapPreviewProps = {
    marks: ClientProCardMark[];
};

const VISITS_PAGE_SIZE = 20;

const visitStatusLabels: Record<string, string> = {
    expected: "Ожидается",
    completed: "Завершён",
    arrived: "Пришёл",
    no_show: "Не пришёл",
    cancelled: "Отменён",
};

const paymentStatusLabels: Record<string, string> = {
    unpaid: "Не оплачено",
    paid: "Оплачено",
    partial: "Частично",
};

const bodyMapViews = [
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

const formatAppointmentDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getServiceId = (service: AppointmentResponse["services"][number]) => {
    const item = service as { id?: number; service_id?: number };

    return item.service_id ?? item.id;
};

const getServicesText = (appointment: AppointmentResponse) => {
    if (!appointment.services?.length) {
        return "Услуги не указаны";
    }

    return appointment.services
        .map((service) => service.name || `Услуга #${getServiceId(service) ?? "-"}`)
        .join(", ");
};

const getMarkLabel = (mark: ClientProCardMark) =>
    mark.title || mark.diagnosis || mark.description || "Без описания";

function BodyMapPreview({ marks }: BodyMapPreviewProps) {
    const [activeView, setActiveView] = useState("front");
    const activeMap =
        bodyMapViews.find((view) => view.key === activeView) ?? bodyMapViews[0];
    const visibleMarks = marks.filter(
        (mark) => (mark.map_key ?? "front") === activeView,
    );

    return (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-semibold">Карта тела визита</span>
                </div>

                <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-white/[0.04]">
                    {bodyMapViews.map((view) => (
                        <button
                            key={view.key}
                            type="button"
                            onClick={() => setActiveView(view.key)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                activeView === view.key
                                    ? "bg-green-600 text-white"
                                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/10"
                            }`}
                        >
                            {view.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(220px,360px)_minmax(0,1fr)]">
                <div className="relative aspect-[11/16] overflow-hidden rounded-2xl border border-gray-200 bg-[linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] bg-[size:34px_34px] dark:border-white/10">
                    <div className="absolute inset-5 flex items-center justify-center">
                        <img
                            src={activeMap.imageSrc}
                            alt={`Карта тела: ${activeMap.label.toLocaleLowerCase("ru-RU")}`}
                            className="h-full w-full object-contain"
                        />
                    </div>

                    {visibleMarks.map((mark, index) => (
                        <div
                            key={mark.id}
                            className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-lg ring-4 ring-white/80 dark:ring-slate-900/80"
                            style={{
                                left: `${mark.x ?? 50}%`,
                                top: `${mark.y ?? 50}%`,
                            }}
                            title={getMarkLabel(mark)}
                        >
                            {index + 1}
                        </div>
                    ))}
                </div>

                <div className="space-y-2">
                    {visibleMarks.length === 0 ? (
                        <p className="rounded-xl bg-white px-3 py-4 text-sm text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
                            На этой стороне карты нет отметок.
                        </p>
                    ) : (
                        visibleMarks.map((mark, index) => (
                            <div
                                key={mark.id}
                                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]"
                            >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                    {index + 1}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {getMarkLabel(mark)}
                                    </p>
                                    {mark.description && (
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            {mark.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ClientVisitsTab({ client }: ClientVisitsTabProps) {
    const clientId = client.id;
    const [expandedAppointmentId, setExpandedAppointmentId] = useState<number | null>(
        null,
    );
    const [expandedTextAppointmentId, setExpandedTextAppointmentId] = useState<
        number | null
    >(null);
    const [editingCommentAppointmentId, setEditingCommentAppointmentId] =
        useState<number | null>(null);
    const [commentDraft, setCommentDraft] = useState("");
    const [visibleVisitsCount, setVisibleVisitsCount] =
        useState(VISITS_PAGE_SIZE);
    const {
        data: appointments = [],
        isLoading,
        error,
    } = useClientAppointments(clientId);
    const updateAppointmentComment = useUpdateClientAppointmentComment(clientId);
    const { data: proCard } = useClientProCard(clientId);

    useEffect(() => {
        setVisibleVisitsCount(VISITS_PAGE_SIZE);
    }, [clientId]);

    const marksByAppointmentId = useMemo(() => {
        const grouped = new Map<number, ClientProCardMark[]>();

        for (const mark of proCard?.marks ?? []) {
            if (!mark.appointment_id) continue;

            const current = grouped.get(mark.appointment_id) ?? [];
            grouped.set(mark.appointment_id, [...current, mark]);
        }

        return grouped;
    }, [proCard]);

    const visibleAppointments = useMemo(
        () => appointments.slice(0, visibleVisitsCount),
        [appointments, visibleVisitsCount],
    );
    const hasMoreAppointments = visibleVisitsCount < appointments.length;

    const startEditComment = (appointment: AppointmentResponse) => {
        setEditingCommentAppointmentId(appointment.id);
        setCommentDraft(appointment.comment ?? "");
    };

    const cancelEditComment = () => {
        setEditingCommentAppointmentId(null);
        setCommentDraft("");
    };

    const submitComment = (
        event: FormEvent<HTMLFormElement>,
        appointment: AppointmentResponse,
    ) => {
        event.preventDefault();

        updateAppointmentComment.mutate(
            {
                appointment,
                comment: commentDraft.trim() || null,
            },
            {
                onSuccess: () => {
                    cancelEditComment();
                    setExpandedTextAppointmentId(appointment.id);
                },
            },
        );
    };

    if (!clientId) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                История визитов станет доступна после сохранения клиента.
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 p-8 text-gray-500 dark:border-white/10 dark:text-gray-300">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Загрузка визитов...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                Не удалось загрузить историю визитов.
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
                <CalendarCheck className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Визитов пока нет
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Когда у клиента появятся записи, они будут отображаться здесь.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {visibleAppointments.map((appointment) => {
                const visitMarks = marksByAppointmentId.get(appointment.id) ?? [];
                const isExpanded = expandedAppointmentId === appointment.id;
                const hasTextNote = Boolean(appointment.comment?.trim());
                const isTextExpanded = expandedTextAppointmentId === appointment.id;
                const isEditingComment =
                    editingCommentAppointmentId === appointment.id;
                const isSavingComment =
                    updateAppointmentComment.isPending && isEditingComment;

                return (
                    <div
                        key={appointment.id}
                        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                                    <CalendarCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    <h2 className="font-semibold">
                                        {formatAppointmentDate(
                                            appointment.appointment_datetime,
                                        )}
                                    </h2>
                                </div>

                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                    {getServicesText(appointment)}
                                </p>
                            </div>

                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-300">
                                {visitStatusLabels[appointment.visit_status ?? ""] ??
                                    appointment.visit_status ??
                                    "Статус не указан"}
                            </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {appointment.total_duration} мин
                            </span>

                            <span className="inline-flex items-center gap-1">
                                <CreditCard className="h-4 w-4" />
                                {paymentStatusLabels[
                                    appointment.payment_status ?? ""
                                ] ??
                                    appointment.payment_status ??
                                    "Оплата не указана"}
                            </span>
                        </div>

                        {visitMarks.length > 0 || hasTextNote ? (
                            <div className="mt-4 space-y-2">
                                {visitMarks.length > 0 && (
                                    <div className="rounded-2xl border border-green-500/70 bg-green-50 p-3 text-green-800 dark:bg-green-500/10 dark:text-green-200">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <MapIcon className="h-5 w-5 text-green-600 dark:text-green-300" />
                                                <div>
                                                    <p className="text-sm font-semibold">
                                                        Связано с картой тела
                                                    </p>
                                                    <p className="text-xs">
                                                        {visitMarks.length} отметка(и) на карте этого визита
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setExpandedAppointmentId(
                                                        isExpanded
                                                            ? null
                                                            : appointment.id,
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                                            >
                                                <MapIcon className="h-4 w-4" />
                                                <span>
                                                    {isExpanded
                                                        ? "Скрыть карту"
                                                        : "Показать карту"}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {hasTextNote && (
                                    <div className="rounded-2xl border border-blue-500/60 bg-blue-50 p-3 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                                                <div>
                                                    <p className="text-sm font-semibold">
                                                        Связано с текстовой заметкой
                                                    </p>
                                                    <p className="text-xs">
                                                        У визита есть текстовый комментарий
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setExpandedTextAppointmentId(
                                                        isTextExpanded
                                                            ? null
                                                            : appointment.id,
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                            >
                                                <FileText className="h-4 w-4" />
                                                <span>
                                                    {isTextExpanded
                                                        ? "Скрыть текст"
                                                        : "Показать текст"}
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => startEditComment(appointment)}
                                                className="inline-flex items-center gap-2 rounded-xl border border-blue-500/60 px-3 py-2 text-sm font-semibold transition hover:bg-blue-100 dark:hover:bg-blue-500/15"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                                <span>Редактировать</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <MapIcon className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-semibold">
                                                Профзаметки
                                            </p>
                                            <p className="text-xs">
                                                Связанных профзаметок для этого визита пока нет
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => startEditComment(appointment)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-blue-500/50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-500/10"
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span>Добавить комментарий</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {visitMarks.length > 0 && !hasTextNote && !isEditingComment && (
                            <div className="mt-3 rounded-2xl border border-blue-500/30 bg-blue-50 p-3 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                                        <div>
                                            <p className="text-sm font-semibold">
                                                Комментарий визита
                                            </p>
                                            <p className="text-xs">
                                                Можно добавить текстовую заметку к этому визиту
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => startEditComment(appointment)}
                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span>Добавить комментарий</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {isEditingComment && (
                            <form
                                onSubmit={(event) => submitComment(event, appointment)}
                                className="mt-3 rounded-2xl border border-blue-500/30 bg-blue-50 p-4 dark:bg-blue-500/10"
                            >
                                <label className="block space-y-2">
                                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                        Комментарий визита
                                    </span>
                                    <textarea
                                        value={commentDraft}
                                        onChange={(event) =>
                                            setCommentDraft(event.target.value)
                                        }
                                        rows={4}
                                        placeholder="Текст по этому визиту"
                                        className="w-full resize-none rounded-xl border border-blue-500/30 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 dark:bg-white/5 dark:text-white"
                                    />
                                </label>

                                <div className="mt-3 flex flex-wrap justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={cancelEditComment}
                                        disabled={isSavingComment}
                                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingComment}
                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Check className="h-4 w-4" />
                                        <span>
                                            {isSavingComment
                                                ? "Сохранение..."
                                                : "Сохранить комментарий"}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        )}

                        {isExpanded && <BodyMapPreview marks={visitMarks} />}
                        {isTextExpanded && appointment.comment && !isEditingComment && (
                            <div className="mt-3 rounded-2xl border border-blue-500/30 bg-blue-50 p-4 dark:bg-blue-500/10">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                        Комментарий визита
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => startEditComment(appointment)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-blue-500/50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:text-blue-200 dark:hover:bg-blue-500/15"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                        <span>Редактировать</span>
                                    </button>
                                </div>
                                <p className="whitespace-pre-wrap text-sm text-blue-900 dark:text-blue-100">
                                    {appointment.comment}
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}

            {hasMoreAppointments && (
                <div className="flex justify-center pt-2">
                    <button
                        type="button"
                        onClick={() =>
                            setVisibleVisitsCount(
                                (count) => count + VISITS_PAGE_SIZE,
                            )
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                    >
                        Показать ещё
                    </button>
                </div>
            )}
        </div>
    );
}
