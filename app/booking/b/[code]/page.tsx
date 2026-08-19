"use client";

import { useParams } from "next/navigation";
import BookingWizard from "@/components/booking/BookingWizard";
import { usePublicBranchBooking } from "@/hooks/useBranches";

type ParamsType = {
    code?: string;
};

export default function PublicBranchBookingPage() {
    const params = useParams<ParamsType>();
    const code = params?.code;
    const { data, isLoading, isError } = usePublicBranchBooking(code);

    if (isLoading) {
        return (
            <PageState
                title="Загружаем онлайн-запись"
                text="Подготавливаем услуги и свободное время."
                loading
            />
        );
    }

    if (isError || !data) {
        return (
            <PageState
                title="Онлайн-запись недоступна"
                text="Проверьте ссылку или попробуйте немного позже."
            />
        );
    }

    return (
        <BookingWizard
            branchId={data.branch_id}
            publicBookingAxis={data.public_booking_axis}
            publicResourceAssignment={data.public_resource_assignment}
        />
    );
}

function PageState({
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
                <h1 className="text-xl font-bold text-slate-950 dark:text-white">
                    {title}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {text}
                </p>
            </div>
        </div>
    );
}
