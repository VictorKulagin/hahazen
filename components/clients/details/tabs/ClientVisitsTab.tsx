"use client";

import React from "react";
import { CalendarCheck, Clock, CreditCard, Loader2 } from "lucide-react";
import { Client } from "@/services/clientApi";
import { useClientAppointments } from "@/hooks/useClientAppointments";
import { AppointmentResponse } from "@/types/appointments";

type ClientVisitsTabProps = {
    client: Client;
};

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

const getServicesText = (appointment: AppointmentResponse) => {
    if (!appointment.services?.length) {
        return "Услуги не указаны";
    }

    return appointment.services
        .map((service) => service.name || `Услуга #${service.service_id}`)
        .join(", ");
};

export default function ClientVisitsTab({ client }: ClientVisitsTabProps) {
    const clientId = client.id;
    const { data: appointments = [], isLoading, error } = useClientAppointments(clientId);

    if (!clientId) {
        return <div>История визитов станет доступна после сохранения клиента.</div>;
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
            {appointments.map((appointment) => (
                <div
                    key={appointment.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none"
                >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                                <CalendarCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <h2 className="font-semibold">
                                    {formatAppointmentDate(appointment.appointment_datetime)}
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
                            {paymentStatusLabels[appointment.payment_status ?? ""] ??
                                appointment.payment_status ??
                                "Оплата не указана"}
                        </span>
                    </div>

                    {appointment.comment && (
                        <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
                            {appointment.comment}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}
