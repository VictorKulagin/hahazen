'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";

export default function Home() {
    const currentYear = new Date().getFullYear();
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Плавное появление страницы
        const timeout = setTimeout(() => setShowContent(true), 100);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-30 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white text-center py-10 shadow-lg transition-shadow duration-300">
                <h1 className="text-4xl font-bold tracking-wide">Добро пожаловать в Hahazen</h1>
                <p className="text-lg mt-4 max-w-xl mx-auto">
                    Ваш надежный помощник в развитии бизнеса и создании лучших решений для клиентов
                </p>
            </header>


            {/* Main content с анимацией появления */}
            <main
                className={`w-full min-h-screen bg-gray-900 text-gray-300 px-4 py-10 transition-opacity duration-700 ${
                    showContent ? "opacity-100" : "opacity-0"
                }`}
            >
                {/* О нас */}
                <section id="about" className="mb-16">
                    <h2 className="text-3xl font-bold text-center text-green-400 mb-6">О Hahazen</h2>
                    <p className="text-center max-w-3xl mx-auto leading-relaxed text-gray-400">
                        Hahazen — это простые и удобные инструменты, которые помогают бизнесу расти и работать эффективнее. Мы создаём решения, которые делают вашу работу легче и приятнее.
                    </p>
                </section>

                {/* Преимущества */}
                <section id="features" className="mb-16">
                    <h2 className="text-3xl font-bold text-center text-green-400 mb-10">Наши преимущества</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[
                            {
                                title: "Современные технологии",
                                text: "Мы постоянно обновляем наши инструменты, чтобы вы всегда имели доступ к самым передовым решениям.",
                            },
                            {
                                title: "Надёжность",
                                text: "Наши клиенты доверяют нам, ведь мы заботимся о безопасности и стабильности каждого проекта.",
                            },
                            {
                                title: "Профессиональная поддержка",
                                text: "Команда экспертов всегда готова помочь вам и ответить на любые вопросы.",
                            },
                        ].map(({ title, text }) => (
                            <div
                                key={title}
                                className="bg-gray-800 rounded-lg p-8 text-center hover:bg-green-900 transition-colors shadow-md"
                            >
                                <h3 className="text-xl font-semibold text-green-400 mb-4">{title}</h3>
                                <p className="text-gray-400 leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Контакты */}
                <section id="contact" className="mb-16">
                    <h2 className="text-3xl font-bold text-center text-green-400 mb-6">Свяжитесь с нами</h2>
                    <p className="text-center text-gray-400">
                        Если у вас есть вопросы, напишите нам:{" "}
                        <a href="mailto:info@hahazen.com" className="text-green-500 hover:underline">
                            info@hahazen.com
                        </a>
                    </p>
                </section>
            </main>

            {/* Footer */}
            {/*<footer className="bg-gradient-to-r from-green-600 via-green-500 to-green-400 text-white text-center py-6 shadow-inner sticky bottom-0">
                <p className="select-none text-sm">
                    &copy; {currentYear} Hahazen. Все права защищены.
                </p>
            </footer>*/}
            <Footer />
        </>
    );
}
