"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Check,
    CheckCircle2,
    Clock3,
    MessageSquareText,
    Search,
    Sparkles,
    UserRound,
} from "lucide-react";
import {
    useAvailability,
    useAvailableEmployees,
    useCreateAppointment,
    useServices,
} from "@/hooks/useBranches";
import { formatMoney } from "@/lib/currency";
import { normalizePhoneInput } from "@/components/utils/phone";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type ParamsType = {
    id?: string;
};

type Step = "services" | "time" | "master" | "confirm";

const STEPS: Array<{ id: Step; label: string; shortLabel: string }> = [
    { id: "services", label: "Услуги", shortLabel: "Услуги" },
    { id: "time", label: "Дата, затем время", shortLabel: "Дата" },
    { id: "master", label: "Специалист", shortLabel: "Мастер" },
    { id: "confirm", label: "Подтверждение", shortLabel: "Готово" },
];

const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500/70 focus:ring-4 focus:ring-emerald-400/10 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400/70 dark:focus:bg-white/[0.08]";

const ServiceSelectionPage = () => {
    const params = useParams<ParamsType>();
    const branchId = params?.id ? Number(params.id) : null;

    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentStep, setCurrentStep] = useState<Step>("services");
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [selectedMaster, setSelectedMaster] = useState<number | null>(null);
    const [clientData, setClientData] = useState({
        name: "",
        phone: "",
        comment: "",
    });

    const {
        data: services = [],
        isLoading: servicesLoading,
        isError: servicesError,
        error: servicesErrorDetails,
    } = useServices(branchId ?? undefined);

    const {
        data: timeSlots,
        isLoading: availabilityLoading,
        isError: availabilityError,
    } = useAvailability(branchId ?? undefined, selectedServices);

    const [selectedDate, selectedTime] = selectedSlot?.split("T") || [];
    const {
        data: masters = [],
        isFetching: mastersLoading,
        isError: mastersError,
        refetch: retryMasters,
    } = useAvailableEmployees(
        branchId ?? undefined,
        selectedDate,
        selectedTime,
        selectedServices
    );

    const {
        mutate: createAppointment,
        isPending,
        isError: isSubmitError,
        error: submitError,
    } = useCreateAppointment();

    const groupedSlots = useMemo(
        () =>
            (timeSlots ?? []).reduce<Record<string, string[]>>((acc, slot) => {
                acc[slot.date] = acc[slot.date] || [];
                if (!acc[slot.date].includes(slot.time)) {
                    acc[slot.date].push(slot.time);
                }
                return acc;
            }, {}),
        [timeSlots]
    );

    const filteredServices = useMemo(
        () =>
            services.filter((service) =>
                service.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
            ),
        [searchQuery, services]
    );

    const selectedServiceItems = useMemo(
        () => services.filter((service) => selectedServices.includes(service.id)),
        [selectedServices, services]
    );

    const selectedMasterItem = masters.find((master) => master.id === selectedMaster);
    const totalDuration = selectedServiceItems.reduce(
        (sum, service) => sum + Number(service.duration_minutes || 0),
        0
    );
    const totalPrice = selectedServiceItems.reduce(
        (sum, service) => sum + Number(service.base_price || 0),
        0
    );
    const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);

    const handleServiceToggle = (serviceId: number) => {
        setSelectedServices((previous) =>
            previous.includes(serviceId)
                ? previous.filter((id) => id !== serviceId)
                : [...previous, serviceId]
        );
    };

    const handleContinue = () => {
        switch (currentStep) {
            case "services":
                setCurrentStep("time");
                break;
            case "time":
                setCurrentStep("master");
                break;
            case "master":
                setCurrentStep("confirm");
                break;
            case "confirm":
                handleFinalBooking();
                break;
        }
    };

    const handleBack = () => {
        setCurrentStep((previous) => {
            if (previous === "confirm") return "master";
            if (previous === "master") return "time";
            return "services";
        });
    };

    const handleFinalBooking = () => {
        if (!branchId || !selectedDate || !selectedTime || !selectedMaster) {
            console.error("Missing required data");
            return;
        }

        createAppointment(
            {
                branch_id: branchId,
                employee_id: selectedMaster,
                services: selectedServices.join(","),
                appointment_datetime: `${selectedDate}T${selectedTime}:00`,
                name: clientData.name,
                phone: clientData.phone,
                comment: clientData.comment,
            },
            {
                onSuccess: () => {
                    window.location.href = "/booking/success";
                },
            }
        );
    };

    const canContinue =
        (currentStep === "services" && selectedServices.length > 0) ||
        (currentStep === "time" && Boolean(selectedSlot)) ||
        (currentStep === "master" && Boolean(selectedMaster)) ||
        (currentStep === "confirm" &&
            Boolean(clientData.name.trim()) &&
            Boolean(clientData.phone.trim()));

    const primaryButtonLabel = isPending
        ? "Отправляем..."
        : currentStep === "confirm"
          ? "Подтвердить запись"
          : "Продолжить";

    if (!branchId || Number.isNaN(branchId)) {
        return <BookingState title="Некорректная ссылка" text="Проверьте адрес страницы онлайн-записи." />;
    }

    if (servicesLoading) {
        return <BookingState title="Загружаем услуги" text="Подготавливаем доступные варианты записи." loading />;
    }

    if (servicesError) {
        return (
            <BookingState
                title="Не удалось загрузить услуги"
                text={servicesErrorDetails?.message || "Попробуйте обновить страницу немного позже."}
            />
        );
    }

    return (
        <div className="booking-surface relative min-h-screen overflow-hidden bg-slate-50 pb-32 text-slate-900 dark:bg-[#041311] dark:text-slate-100">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-12rem] top-[-10rem] h-[34rem] w-[34rem] rounded-full bg-cyan-200/40 blur-[110px] dark:bg-cyan-700/20" />
                <div className="absolute right-[-14rem] top-[18rem] h-[38rem] w-[38rem] rounded-full bg-emerald-200/35 blur-[130px] dark:bg-emerald-600/15" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.025)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)] dark:bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)]" />
            </div>

            <header className="relative border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#041311]/75">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src="/logo.png"
                            alt="Hahazen"
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-xl border border-slate-200 object-cover shadow-lg shadow-emerald-200/40 dark:border-white/10 dark:shadow-emerald-950/40"
                        />
                        <div>
                            <p className="text-sm font-semibold tracking-wide text-slate-950 dark:text-white">Hahazen</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Онлайн-запись</p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3">
                        <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-1.5 text-xs text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/[0.08] dark:text-emerald-200 sm:inline-flex">
                            Запись займёт пару минут
                        </span>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="relative mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
                <section className="mb-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300/80">
                        Шаг {currentStepIndex + 1} из {STEPS.length}
                    </p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                                Запишитесь на удобное время
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
                                Выберите услуги, время и специалиста. Подтверждение займёт всего несколько шагов.
                            </p>
                        </div>
                    </div>
                </section>

                <BookingProgress currentStep={currentStep} />

                {isSubmitError && (
                    <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                        Не удалось создать запись: {submitError?.message}
                    </div>
                )}

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <section className="min-w-0">
                        {currentStep === "services" && (
                            <ServicesStep
                                services={filteredServices}
                                searchQuery={searchQuery}
                                selectedServices={selectedServices}
                                onSearchChange={setSearchQuery}
                                onToggle={handleServiceToggle}
                            />
                        )}

                        {currentStep === "time" && (
                            <TimeStep
                                groupedSlots={groupedSlots}
                                selectedSlot={selectedSlot}
                                loading={availabilityLoading}
                                error={availabilityError}
                                onSelect={setSelectedSlot}
                            />
                        )}

                        {currentStep === "master" && (
                            <MasterStep
                                masters={masters}
                                selectedMaster={selectedMaster}
                                loading={mastersLoading}
                                error={mastersError}
                                onSelect={setSelectedMaster}
                                onRetry={() => void retryMasters()}
                            />
                        )}

                        {currentStep === "confirm" && (
                            <ConfirmStep clientData={clientData} onChange={setClientData} />
                        )}
                    </section>

                    <BookingSummary
                        selectedServices={selectedServiceItems}
                        totalDuration={totalDuration}
                        totalPrice={totalPrice}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        selectedMasterName={selectedMasterItem?.name}
                    />
                </div>
            </main>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#061714]/90 sm:py-4">
                <div className="mx-auto flex max-w-6xl items-center gap-3">
                    {currentStep !== "services" && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:bg-white/[0.09] sm:px-6"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Назад</span>
                        </button>
                    )}

                    <div className="hidden min-w-0 flex-1 sm:block">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                            {selectedServices.length > 0
                                ? `Выбрано услуг: ${selectedServices.length}`
                                : "Выберите хотя бы одну услугу"}
                        </p>
                        {selectedServices.length > 0 && (
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {totalDuration} мин · {formatMoney(totalPrice)}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleContinue}
                        disabled={!canContinue || isPending}
                        className="ml-auto inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 text-sm font-bold text-[#05251d] shadow-[0_14px_40px_rgba(52,211,153,0.22)] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none sm:max-w-[250px]"
                    >
                        {primaryButtonLabel}
                        {!isPending && <ArrowRight className="h-4 w-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

function BookingProgress({ currentStep }: { currentStep: Step }) {
    const currentIndex = STEPS.findIndex((step) => step.id === currentStep);

    return (
        <div className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white/75 p-2 shadow-sm backdrop-blur dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-none">
            <div className="grid grid-cols-4 gap-1">
                {STEPS.map((step, index) => {
                    const completed = index < currentIndex;
                    const active = index === currentIndex;

                    return (
                        <div
                            key={step.id}
                            className={`relative flex min-w-0 items-center gap-2 rounded-xl px-2 py-2.5 transition sm:px-3 ${
                                active ? "bg-slate-100 dark:bg-white/[0.08]" : ""
                            }`}
                        >
                            <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                    completed
                                        ? "bg-emerald-500 text-white dark:bg-emerald-400 dark:text-[#05251d]"
                                        : active
                                          ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/50 dark:bg-emerald-400/10 dark:text-emerald-200"
                                          : "border border-slate-200 text-slate-400 dark:border-white/10 dark:text-slate-500"
                                }`}
                            >
                                {completed ? <Check className="h-4 w-4" /> : index + 1}
                            </span>
                            <span
                                className={`truncate text-xs font-medium sm:text-sm ${
                                    active
                                        ? "text-slate-950 dark:text-white"
                                        : completed
                                          ? "text-emerald-700 dark:text-emerald-200"
                                          : "text-slate-400 dark:text-slate-500"
                                }`}
                            >
                                <span className="sm:hidden">{step.shortLabel}</span>
                                <span className="hidden sm:inline">{step.label}</span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

type ServicesStepProps = {
    services: Array<{ id: number; name: string; duration_minutes: number; base_price: number }>;
    selectedServices: number[];
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onToggle: (id: number) => void;
};

function ServicesStep({
    services,
    selectedServices,
    searchQuery,
    onSearchChange,
    onToggle,
}: ServicesStepProps) {
    return (
        <div>
            <StepHeading
                icon={<Sparkles className="h-5 w-5" />}
                title="Выберите услуги"
                text="Можно выбрать сразу несколько услуг."
            />

            <label className="relative mb-5 block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Найти услугу"
                    className={`${inputClass} pl-12`}
                />
            </label>

            {services.length === 0 ? (
                <EmptyState text="По вашему запросу услуги не найдены." />
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {services.map((service) => {
                        const selected = selectedServices.includes(service.id);

                        return (
                            <button
                                type="button"
                                key={service.id}
                                onClick={() => onToggle(service.id)}
                                className={`group flex min-h-[132px] flex-col justify-between rounded-2xl border p-4 text-left transition duration-200 ${
                                    selected
                                        ? "border-emerald-500/45 bg-emerald-50 shadow-[0_14px_45px_rgba(16,185,129,0.08)] dark:border-emerald-300/55 dark:bg-emerald-400/[0.1]"
                                        : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none dark:hover:border-white/[0.16] dark:hover:bg-white/[0.065]"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="text-base font-semibold leading-snug text-slate-950 dark:text-white">
                                        {service.name}
                                    </h3>
                                    <span
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
                                            selected
                                                ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-300 dark:bg-emerald-400 dark:text-[#05251d]"
                                                : "border-slate-300 bg-white text-transparent group-hover:border-emerald-400 dark:border-white/15 dark:bg-white/[0.04] dark:group-hover:border-white/30"
                                        }`}
                                    >
                                        <Check className="h-4 w-4" />
                                    </span>
                                </div>

                                <div className="mt-5 flex items-end justify-between gap-3">
                                    <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        {service.duration_minutes} мин
                                    </span>
                                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-200">
                                        {formatMoney(service.base_price)}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

type TimeStepProps = {
    groupedSlots: Record<string, string[]>;
    selectedSlot: string | null;
    loading: boolean;
    error: boolean;
    onSelect: (slot: string | null) => void;
};

function TimeStep({ groupedSlots, selectedSlot, loading, error, onSelect }: TimeStepProps) {
    const selectedSlotDate = selectedSlot?.split("T")[0] || null;
    const [selectedDay, setSelectedDay] = useState<string | null>(selectedSlotDate);
    const availableDates = Object.keys(groupedSlots);
    const selectedTimes = selectedDay ? groupedSlots[selectedDay] ?? [] : [];

    const handleDateSelect = (date: string) => {
        setSelectedDay(date);
        if (selectedSlotDate !== date) {
            onSelect(null);
        }
    };

    return (
        <div>
            <StepHeading
                icon={<CalendarDays className="h-5 w-5" />}
                title="Сначала выберите дату, затем время"
                text="После выбора даты покажем доступное время для выбранных услуг."
            />

            {loading ? (
                <InlineLoader text="Ищем свободное время..." />
            ) : error ? (
                <EmptyState text="Не удалось загрузить свободное время. Попробуйте вернуться и повторить выбор." />
            ) : Object.keys(groupedSlots).length === 0 ? (
                <EmptyState text="Для выбранных услуг пока нет свободного времени." />
            ) : (
                <div className="space-y-5">
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none sm:p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white dark:bg-emerald-400 dark:text-[#05251d]">
                                1
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-slate-950 dark:text-white">Выберите дату</p>
                                <p className="mt-0.5 text-xs text-slate-500">Показаны дни со свободным временем</p>
                            </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {availableDates.map((date) => {
                                const selected = selectedDay === date;

                                return (
                                    <button
                                        type="button"
                                        key={date}
                                        onClick={() => handleDateSelect(date)}
                                        className={`rounded-xl border px-4 py-3 text-left transition ${
                                            selected
                                                ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-300 dark:bg-emerald-400 dark:text-[#05251d]"
                                                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:border-white/[0.08] dark:bg-white/[0.045] dark:text-slate-200 dark:hover:border-emerald-300/35 dark:hover:bg-emerald-400/[0.08]"
                                        }`}
                                    >
                                        <span className="block text-sm font-semibold capitalize">{formatBookingDate(date)}</span>
                                        <span className={`mt-1 block text-xs ${selected ? "text-white/75 dark:text-[#05251d]/65" : "text-slate-500"}`}>
                                            Доступно окон: {groupedSlots[date].length}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none sm:p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                selectedDay
                                    ? "bg-emerald-500 text-white dark:bg-emerald-400 dark:text-[#05251d]"
                                    : "border border-slate-200 text-slate-400 dark:border-white/10 dark:text-slate-500"
                            }`}>
                                2
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-slate-950 dark:text-white">Выберите время</p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {selectedDay ? formatBookingDate(selectedDay) : "Сначала выберите дату выше"}
                                </p>
                            </div>
                        </div>

                        {selectedDay ? (
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
                                {selectedTimes.map((time) => {
                                    const slot = `${selectedDay}T${time}`;
                                    const selected = selectedSlot === slot;

                                    return (
                                        <button
                                            type="button"
                                            key={slot}
                                            onClick={() => onSelect(slot)}
                                            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                                                selected
                                                    ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-300 dark:bg-emerald-400 dark:text-[#05251d]"
                                                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:border-white/[0.08] dark:bg-white/[0.045] dark:text-slate-200 dark:hover:border-emerald-300/35 dark:hover:bg-emerald-400/[0.08]"
                                            }`}
                                        >
                                            {time}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                                После выбора даты здесь появится доступное время.
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}

type MasterStepProps = {
    masters: Array<{ id: number; name: string; specialization: string }>;
    selectedMaster: number | null;
    loading: boolean;
    error: boolean;
    onSelect: (id: number) => void;
    onRetry: () => void;
};

function MasterStep({
    masters,
    selectedMaster,
    loading,
    error,
    onSelect,
    onRetry,
}: MasterStepProps) {
    return (
        <div>
            <StepHeading
                icon={<UserRound className="h-5 w-5" />}
                title="Выберите специалиста"
                text="Доступны специалисты, которые могут выполнить выбранные услуги в это время."
            />

            {loading ? (
                <InlineLoader text="Проверяем специалистов..." />
            ) : error ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-10 text-center dark:border-amber-300/15 dark:bg-amber-400/[0.06]">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-100">
                        Не удалось проверить специалистов для выбранного времени.
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-600 dark:text-slate-400">
                        Расписание специалистов временно недоступно. Попробуйте ещё раз или выберите другое время.
                    </p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-5 rounded-xl border border-amber-300 bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-200 dark:border-amber-200/20 dark:bg-amber-300/10 dark:text-amber-100 dark:hover:bg-amber-300/15"
                    >
                        Проверить ещё раз
                    </button>
                </div>
            ) : masters.length === 0 ? (
                <EmptyState text="На выбранное время доступных специалистов нет." />
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {masters.map((master) => {
                        const selected = selectedMaster === master.id;
                        const initial = master.name.trim().charAt(0).toUpperCase() || "H";

                        return (
                            <button
                                type="button"
                                key={master.id}
                                onClick={() => onSelect(master.id)}
                                className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                                    selected
                                        ? "border-emerald-500/45 bg-emerald-50 dark:border-emerald-300/55 dark:bg-emerald-400/[0.1]"
                                        : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none dark:hover:border-white/[0.16] dark:hover:bg-white/[0.065]"
                                }`}
                            >
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-cyan-500 text-lg font-bold text-[#05251d]">
                                    {initial}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white">
                                        {master.name}
                                    </span>
                                    <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                                        {master.specialization || "Специалист"}
                                    </span>
                                </span>
                                <span
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                                        selected
                                            ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-300 dark:bg-emerald-400 dark:text-[#05251d]"
                                            : "border-slate-300 text-transparent dark:border-white/15"
                                    }`}
                                >
                                    <Check className="h-4 w-4" />
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

type ConfirmStepProps = {
    clientData: { name: string; phone: string; comment: string };
    onChange: (data: { name: string; phone: string; comment: string }) => void;
};

function ConfirmStep({ clientData, onChange }: ConfirmStepProps) {
    return (
        <div>
            <StepHeading
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Осталось подтвердить запись"
                text="Оставьте контакты, чтобы салон мог связаться с вами при необходимости."
            />

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                            Ваше имя
                        </span>
                        <input
                            type="text"
                            value={clientData.name}
                            onChange={(event) => onChange({ ...clientData, name: event.target.value })}
                            placeholder="Как к вам обращаться"
                            autoComplete="name"
                            className={inputClass}
                            required
                        />
                    </label>

                    <label>
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                            Телефон
                        </span>
                        <input
                            type="tel"
                            value={clientData.phone}
                            onChange={(event) =>
                                onChange({
                                    ...clientData,
                                    phone: normalizePhoneInput(event.target.value),
                                })
                            }
                            placeholder="+996 ..."
                            autoComplete="tel"
                            className={inputClass}
                            required
                        />
                    </label>

                    <label className="sm:col-span-2">
                        <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                            <MessageSquareText className="h-3.5 w-3.5" />
                            Комментарий
                            <span className="normal-case tracking-normal text-slate-600">необязательно</span>
                        </span>
                        <textarea
                            value={clientData.comment}
                            onChange={(event) => onChange({ ...clientData, comment: event.target.value })}
                            placeholder="Например, пожелания или важная информация"
                            className={`${inputClass} min-h-28 resize-y`}
                            rows={4}
                        />
                    </label>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">
                    Нажимая «Подтвердить запись», вы передаёте салону указанные контактные данные для оформления визита.
                </p>
            </div>
        </div>
    );
}

type BookingSummaryProps = {
    selectedServices: Array<{ id: number; name: string; duration_minutes: number; base_price: number }>;
    totalDuration: number;
    totalPrice: number;
    selectedDate?: string;
    selectedTime?: string;
    selectedMasterName?: string;
};

function BookingSummary({
    selectedServices,
    totalDuration,
    totalPrice,
    selectedDate,
    selectedTime,
    selectedMasterName,
}: BookingSummaryProps) {
    return (
        <aside className="sticky top-5 hidden rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0b211d]/75 dark:shadow-2xl dark:shadow-black/20 lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300/80">
                Ваша запись
            </p>

            {selectedServices.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-500 dark:border-white/10">
                    Выбранные услуги и детали записи появятся здесь.
                </div>
            ) : (
                <>
                    <div className="mt-5 space-y-3">
                        {selectedServices.map((service) => (
                            <div key={service.id} className="flex items-start justify-between gap-3 text-sm">
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-slate-800 dark:text-slate-200">{service.name}</p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {service.duration_minutes} мин
                                    </p>
                                </div>
                                <span className="shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
                                    {formatMoney(service.base_price)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="my-5 h-px bg-slate-200 dark:bg-white/[0.08]" />

                    <SummaryRow
                        icon={<Clock3 className="h-4 w-4" />}
                        label="Длительность"
                        value={`${totalDuration} мин`}
                    />
                    <SummaryRow
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="Дата и время"
                        value={
                            selectedDate && selectedTime
                                ? `${formatBookingDateShort(selectedDate)}, ${selectedTime}`
                                : "Не выбрано"
                        }
                    />
                    <SummaryRow
                        icon={<UserRound className="h-4 w-4" />}
                        label="Специалист"
                        value={selectedMasterName || "Не выбран"}
                    />

                    <div className="mt-5 flex items-end justify-between rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-400/[0.09]">
                        <span className="text-xs text-emerald-700/70 dark:text-emerald-100/65">Итого</span>
                        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-200">
                            {formatMoney(totalPrice)}
                        </span>
                    </div>
                </>
            )}
        </aside>
    );
}

function SummaryRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="mb-3 flex items-start gap-3">
            <span className="mt-0.5 text-emerald-600 dark:text-emerald-300">{icon}</span>
            <span className="min-w-0">
                <span className="block text-xs text-slate-500">{label}</span>
                <span className="mt-0.5 block truncate text-sm font-medium text-slate-800 dark:text-slate-200">{value}</span>
            </span>
        </div>
    );
}

function StepHeading({
    icon,
    title,
    text,
}: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <div className="mb-5 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                {icon}
            </span>
            <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">{title}</h2>
                <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">{text}</p>
            </div>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 px-5 py-12 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-400">
            {text}
        </div>
    );
}

function InlineLoader({ text }: { text: string }) {
    return (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white/60 px-5 py-12 text-sm text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-300/25 border-t-emerald-300" />
            {text}
        </div>
    );
}

function BookingState({
    title,
    text,
    loading = false,
}: {
    title: string;
    text: string;
    loading?: boolean;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900 dark:bg-[#041311] dark:text-slate-100">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none">
                {loading && (
                    <span className="mx-auto mb-5 block h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/25 border-t-emerald-300" />
                )}
                <h1 className="text-xl font-bold text-slate-950 dark:text-white">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p>
            </div>
        </div>
    );
}

const formatBookingDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

const formatBookingDateShort = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
    });

export default ServiceSelectionPage;
