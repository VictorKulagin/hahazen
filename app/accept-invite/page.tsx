"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function AcceptInvitePage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams?.get("token") ?? null;

    if (!token) {
        return <div>Ссылка приглашения недействительна.</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border p-6">
                <h1 className="text-xl font-semibold">
                    Принять приглашение
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                    Завершите регистрацию, чтобы получить доступ к компании.
                </p>
            </div>
        </div>
    );
}
