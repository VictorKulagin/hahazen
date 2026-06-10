"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function BookingSuccess() {
    const router = useRouter();

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-emerald-50 p-5 text-slate-900 dark:bg-[#041311] dark:text-white">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-12rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-emerald-300/35 blur-[110px] dark:bg-emerald-600/20" />
                <div className="absolute bottom-[-14rem] right-[-12rem] h-[38rem] w-[38rem] rounded-full bg-teal-300/30 blur-[130px] dark:bg-teal-600/15" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(5,150,105,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(5,150,105,0.035)_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)]" />
            </div>

            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-emerald-200/80 bg-white/85 p-6 text-center shadow-[0_28px_90px_rgba(5,150,105,0.16)] backdrop-blur-xl dark:border-emerald-300/15 dark:bg-[#0b211d]/85 dark:shadow-[0_30px_90px_rgba(0,0,0,0.3)] sm:p-8">
                <div className="animate-[scaleUp_0.6s_ease-in-out] overflow-hidden rounded-2xl border border-emerald-200/60 bg-emerald-950 shadow-[0_16px_50px_rgba(5,150,105,0.18)] dark:border-emerald-300/15">
                    <Image
                        src="/spaniel_success.png"
                        alt="Запись успешно подтверждена"
                        width={1536}
                        height={1024}
                        priority
                        className="aspect-[3/2] w-full object-cover"
                    />
                </div>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
                    Запись создана
                </p>

                <h1 className="mt-3 text-center text-3xl font-bold text-emerald-950 dark:text-white">
                    Бронирование подтверждено!
                </h1>

                <p className="mt-3 text-center leading-relaxed text-emerald-950/65 dark:text-emerald-50/65">
                    Спасибо за вашу заявку. Мы ожидаем вас в указанное время.
                    <br />
                    Наш менеджер свяжется с вами для подтверждения деталей.
                </p>

                <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="mt-7 w-full rounded-2xl bg-emerald-500 px-6 py-3.5 font-semibold text-white shadow-[0_14px_40px_rgba(16,185,129,0.24)] transition duration-300 hover:bg-emerald-600 dark:bg-emerald-400 dark:text-[#05251d] dark:hover:bg-emerald-300"
                >
                    Вернуться на главную
                </button>
            </div>
        </div>
    );
}
