"use client";

import Link from "next/link";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    BuildingStorefrontIcon,
    CalendarIcon,
    CheckCircleIcon,
    GlobeAltIcon,
    SparklesIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";

type SetupStepId = "services" | "employees" | "schedule" | "online" | "catalog";

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
        {
            id: "catalog" as const,
            title: "Карточка салона",
            description: "Заполните публичную карточку в каталоге Hahazen.",
            href: `/settings/catalog/${branchId}`,
            icon: BuildingStorefrontIcon,
        },
    ];

    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    if (currentIndex < 0) return null;

    const current = steps[currentIndex];
    const next = steps[currentIndex + 1];
    const Icon = current.icon;

    return (
        <section className="mb-6 overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(8,47,54,0.88),rgba(4,20,22,0.84))] dark:shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
            <div className="relative p-4 sm:p-5">
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.13),transparent_42%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.12),transparent_44%)]" />

                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-[0_10px_24px_rgba(5,150,105,0.22)]">
                            <Icon className="h-6 w-6" />
                        </span>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-300/15 dark:bg-emerald-300/10 dark:text-emerald-200">
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
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-px hover:border-emerald-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-emerald-400/40 dark:hover:bg-white/10"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            К шагам
                        </Link>

                        {next ? (
                            <Link
                                href={next.href}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(5,150,105,0.2)] transition hover:-translate-y-px hover:from-emerald-600 hover:to-teal-700"
                            >
                                Далее: {next.title}
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        ) : (
                            <Link
                                href="/cabinet"
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(5,150,105,0.2)] transition hover:-translate-y-px hover:from-emerald-600 hover:to-teal-700"
                            >
                                Завершить
                                <CheckCircleIcon className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                </div>

                <div className="relative mt-4 grid grid-cols-4 gap-1.5" aria-hidden="true">
                    {steps.map((step, index) => (
                        <span
                            key={step.id}
                            className={`h-1 rounded-full transition-colors ${
                                index <= currentIndex
                                    ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                                    : "bg-slate-200/80 dark:bg-white/10"
                            }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
