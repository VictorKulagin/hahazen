"use client";

import Link from "next/link";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CalendarIcon,
    CheckCircleIcon,
    GlobeAltIcon,
    SparklesIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";

type SetupStepId = "services" | "employees" | "schedule" | "online";

type SetupStepNavProps = {
    branchId?: number | string | null;
    currentStep: SetupStepId;
};

export default function SetupStepNav({ branchId, currentStep }: SetupStepNavProps) {
    if (!branchId) return null;

    const steps = [
        {
            id: "services" as const,
            title: "Услуги",
            description: "Добавьте позиции, цены и длительность.",
            href: `/settings/service_categories/${branchId}`,
            icon: SparklesIcon,
        },
        {
            id: "employees" as const,
            title: "Мастера",
            description: "Добавьте сотрудников и привяжите услуги.",
            href: `/settings/filial_staff/${branchId}`,
            icon: UserGroupIcon,
        },
        {
            id: "schedule" as const,
            title: "Расписание",
            description: "Проверьте график и рабочие слоты.",
            href: `/schedule/${branchId}`,
            icon: CalendarIcon,
        },
        {
            id: "online" as const,
            title: "Онлайн-запись",
            description: "Скопируйте ссылку для клиентов.",
            href: `/online/booking_forms/${branchId}`,
            icon: GlobeAltIcon,
        },
    ];

    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    if (currentIndex < 0) return null;

    const current = steps[currentIndex];
    const next = steps[currentIndex + 1];
    const Icon = current.icon;

    return (
        <section className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(17,24,39,0.98),rgba(20,34,54,0.92))] dark:shadow-none">
            <div className="relative p-4">
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.10),transparent_38%)]" />

                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-500/15 text-green-600 dark:bg-green-400/15 dark:text-green-300">
                            <Icon className="h-6 w-6" />
                        </span>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-400/10 dark:text-green-300">
                                    Шаг {currentIndex + 1} из {steps.length}
                                </span>
                                <h2 className="text-base font-bold text-gray-950 dark:text-white">
                                    {current?.title}
                                </h2>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-white/65">
                                {current?.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Link
                            href="/cabinet"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:border-green-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-green-400/40 dark:hover:bg-white/10"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            К шагам
                        </Link>

                        {next ? (
                            <Link
                                href={next.href}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 text-sm font-semibold text-white transition hover:bg-green-600"
                            >
                                Далее: {next.title}
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        ) : (
                            <Link
                                href="/cabinet"
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 text-sm font-semibold text-white transition hover:bg-green-600"
                            >
                                Завершить
                                <CheckCircleIcon className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
