// app/booking/success/page.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function BookingSuccess() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
            <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full space-y-6">
                <div className="animate-[scaleUp_0.6s_ease-in-out] flex justify-center">
                    <svg
                        className="w-18 h-18 text-green-500"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="currentColor"
                            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                        />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-800 text-center">
                    Бронирование подтверждено!
                </h1>

                <p className="text-gray-600 text-center leading-relaxed mb-8">
                    Спасибо за вашу заявку. Мы ожидаем вас в указанное время.<br/>
                    Наш менеджер свяжется с вами для подтвержения деталей.
                </p>

                <button
                    onClick={() => router.push('/')}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-full transition-colors duration-300"
                >
                    Вернуться на главную
                </button>
            </div>
        </div>
    );
}
