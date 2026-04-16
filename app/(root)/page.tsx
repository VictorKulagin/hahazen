'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Home() {
    const [showContent, setShowContent] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setShowContent(true), 120);
        return () => clearTimeout(timeout);
    }, []);

    const navItems = [
        { label: "О нас", href: "#about" },
        { label: "Преимущества", href: "#features" },
        { label: "Контакты", href: "#contact" },
    ];

    const promiseCards = [
        {
            title: "Онлайн-запись 24/7",
            text: "Hahazen приветствует ваших клиентов круглосуточно. Они записываются когда удобно, а вы спокойно занимаетесь делом.",
            icon: "◔",
        },
        {
            title: "Спокойствие за данные",
            text: "Все расписания, контакты и история визитов в надёжных руках. Zen для вашего бизнеса — без бумажек и потерянных записей.",
            icon: "◈",
        },
        {
            title: "Преданный помощник",
            text: "Как верный спаниель Леди — Hahazen работает преданно и открыто. Ваш цифровой ассистент, который никогда не подведёт.",
            icon: "♡",
        },
    ];

    const featureCards = [
        {
            title: "Онлайн-запись",
            text: "Клиенты записываются сами — в любое время дня и ночи. Больше никаких «напишите мне в личку».",
            icon: "🗓️",
        },
        {
            title: "Учёт и аналитика",
            text: "Все данные о клиентах, визитах и финансах в одном месте. Чистые отчёты, без хаоса.",
            icon: "📊",
        },
        {
            title: "Уведомления",
            text: "Автоматические напоминания для клиентов и для вас. Никто ничего не забудет.",
            icon: "💬",
        },
        {
            title: "Для творческих",
            text: "Создано для мастеров красоты, тренеров, репетиторов — всех, кто работает с людьми.",
            icon: "🎨",
        },
    ];

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#07111f] text-white">
            <style jsx global>{`
                @keyframes heroGradientShift {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }

                @keyframes floatSlow {
                    0% {
                        transform: translateY(0px) translateX(0px);
                    }
                    50% {
                        transform: translateY(-12px) translateX(8px);
                    }
                    100% {
                        transform: translateY(0px) translateX(0px);
                    }
                }

                @keyframes glowPulse {
                    0% {
                        opacity: 0.45;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.8;
                        transform: scale(1.08);
                    }
                    100% {
                        opacity: 0.45;
                        transform: scale(1);
                    }
                }

                @keyframes fadeUp {
                    0% {
                        opacity: 0;
                        transform: translateY(18px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes footerGlow {
                    0% {
                        transform: translateX(0) translateY(0);
                        opacity: 0.25;
                    }
                    50% {
                        transform: translateX(30px) translateY(-10px);
                        opacity: 0.45;
                    }
                    100% {
                        transform: translateX(0) translateY(0);
                        opacity: 0.25;
                    }
                }

                .hero-gradient {
                    background: linear-gradient(
                        120deg,
                        #ec4899 0%,
                        #a855f7 18%,
                        #3b82f6 38%,
                        #22c55e 63%,
                        #eab308 82%,
                        #f97316 100%
                    );
                    background-size: 200% 200%;
                    animation: heroGradientShift 18s ease infinite;
                }

                .animate-fade-up {
                    animation: fadeUp 0.9s ease forwards;
                }

                .animate-fade-up-delay {
                    animation: fadeUp 1.2s ease forwards;
                }
            `}</style>

            <header className="relative hero-gradient overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />

                <div
                    className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/20 blur-3xl"
                    style={{ animation: "floatSlow 12s ease-in-out infinite" }}
                />
                <div
                    className="absolute right-[-60px] top-20 h-80 w-80 rounded-full bg-fuchsia-300/20 blur-3xl"
                    style={{ animation: "floatSlow 14s ease-in-out infinite" }}
                />
                <div
                    className="absolute bottom-[-60px] left-1/3 h-64 w-64 rounded-full bg-cyan-200/20 blur-3xl"
                    style={{ animation: "glowPulse 9s ease-in-out infinite" }}
                />

                <div className="relative z-10 mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <img
                                src="/logo.png"
                                alt="Hahazen"
                                className="h-14 w-14 rounded-xl object-cover shadow-lg sm:h-16 sm:w-16"
                            />
                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">
                                    Hahazen
                                </p>
                                <p className="text-xs text-white/70">
                                    Радость в порядке
                                </p>
                            </div>
                        </Link>

                        <nav className="hidden items-center gap-3 md:flex">
                            {navItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="rounded-xl px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
                                >
                                    {item.label}
                                </Link>
                            ))}

                            <Link
                                href="/signin"
                                className="rounded-2xl border border-white/25 bg-white/12 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                            >
                                Логин
                            </Link>
                        </nav>

                        <button
                            onClick={() => setIsMenuOpen((prev) => !prev)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 md:hidden"
                            aria-label="Открыть меню"
                        >
                            {isMenuOpen ? (
                                <XMarkIcon className="h-6 w-6" />
                            ) : (
                                <Bars3Icon className="h-6 w-6" />
                            )}
                        </button>
                    </div>

                    {isMenuOpen && (
                        <div className="mt-3 rounded-2xl border border-white/20 bg-black/15 p-3 backdrop-blur-md md:hidden">
                            <nav className="flex flex-col gap-2">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="rounded-xl px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                                <Link
                                    href="/signin"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="mt-1 rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                                >
                                    Логин
                                </Link>
                            </nav>
                        </div>
                    )}

                    <div className="flex min-h-[560px] flex-col items-center justify-center text-center sm:min-h-[640px]">
                        <div className="opacity-0 animate-fade-up">
                            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/85">
                                Hahazen
                            </p>
                        </div>

                        <div className="opacity-0 animate-fade-up-delay max-w-5xl">
                            <h1 className="text-5xl font-black leading-tight text-white sm:text-6xl lg:text-7xl">
                                Хаос превращается
                            </h1>
                            <p className="mt-2 text-4xl italic text-white/95 sm:text-5xl lg:text-6xl">
                                в улыбку
                            </p>

                            <p className="mx-auto mt-8 max-w-3xl text-lg font-medium leading-relaxed text-white/90 sm:text-2xl">
                                CRM для тех, кто устал от бесконечных переписок и хочет
                                сосредоточиться на любимом деле. Радость от работы и спокойствие для бизнеса.
                            </p>

                            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                <Link
                                    href="#story"
                                    className="rounded-full border border-white/30 bg-white/12 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                                >
                                    Узнать историю
                                </Link>

                                <Link
                                    href="/signin"
                                    className="rounded-full bg-[#22c55e] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-green-500/20 transition hover:bg-[#16a34a]"
                                >
                                    Логин
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#07111f]" />
            </header>

            <main
                className={`bg-[#07111f] px-4 py-20 text-gray-300 transition-opacity duration-700 ${
                    showContent ? "opacity-100" : "opacity-0"
                }`}
            >
                <section id="about" className="mx-auto max-w-6xl">
                    <div className="mb-6 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#24d17e]">
                            Что умеет Hahazen
                        </p>
                        <h2 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
                            Всё, что нужно вашему бизнесу
                        </h2>
                    </div>

                    <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                        {featureCards.map((card) => (
                            <div
                                key={card.title}
                                className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.18)] transition hover:bg-white/7"
                            >
                                <div className="mb-5 text-3xl">{card.icon}</div>
                                <h3 className="text-2xl font-bold text-white">{card.title}</h3>
                                <p className="mt-4 text-lg leading-relaxed text-gray-300">
                                    {card.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="features" className="mx-auto mt-28 max-w-6xl">
                    <div className="mb-6 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#24d17e]">
                            Три обещания
                        </p>
                        <h2 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
                            Что Hahazen делает для вас
                        </h2>
                    </div>

                    <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {promiseCards.map((card) => (
                            <div
                                key={card.title}
                                className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.18)] transition hover:bg-white/7"
                            >
                                <div className="mb-6 text-3xl text-[#24d17e]">{card.icon}</div>
                                <h3 className="text-2xl font-bold text-white">{card.title}</h3>
                                <p className="mt-4 text-lg leading-relaxed text-gray-300">
                                    {card.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="story" className="relative mx-auto mt-32 max-w-6xl overflow-hidden rounded-[40px] px-4 py-8 sm:px-8 sm:py-12">
                    <div
                        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-400/10 blur-3xl"
                        style={{ animation: "glowPulse 10s ease-in-out infinite" }}
                    />
                    <div className="relative z-10 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#24d17e]">
                            История бренда
                        </p>
                        <h2 className="mt-4 text-4xl italic text-white sm:text-5xl">
                            Легенда Hahazen: Радость в порядке
                        </h2>
                    </div>

                    <div className="relative z-10 mt-14 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-6 text-lg leading-relaxed text-gray-300">
                            <p>
                                <span className="font-semibold text-[#24d17e]">Hahazen</span> — это история о том, как хаос превращается в улыбку.
                            </p>

                            <p>
                                В основе нашего проекта лежат два принципа:
                                <span className="font-semibold text-white"> Радость (Ha-ha)</span> от любимого дела и
                                <span className="font-semibold text-white"> Спокойствие (Zen)</span> за свой бизнес.
                                Мы создали эту систему для тех, кто устал от бесконечных переписок в мессенджерах и хочет просто заниматься творчеством.
                            </p>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                    <h3 className="text-xl font-bold text-[#24d17e]">Ha-ha → Радость</h3>
                                    <p className="mt-2 text-base text-gray-300">
                                        Радость от того, что вы занимаетесь любимым делом.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                    <h3 className="text-xl font-bold text-[#24d17e]">Zen → Спокойствие</h3>
                                    <p className="mt-2 text-base text-gray-300">
                                        Спокойствие за ваш бизнес и все его процессы.
                                    </p>
                                </div>
                            </div>

                            <p>
                                Hahazen — это не просто таблицы и графики. Это ваш цифровой помощник, который:
                            </p>

                            <ul className="space-y-3 text-base text-gray-300">
                                <li>• Встречает ваших клиентов 24/7 через онлайн-запись.</li>
                                <li>• Дарит вам «дзен», бережно храня все данные и расписания.</li>
                                <li>• Работает так же преданно и открыто, как добрая собака Леди.</li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
                                <h3 className="text-2xl font-bold text-white">Почему спаниель Леди?</h3>
                                <p className="mt-4 text-base leading-relaxed text-gray-300">
                                    Леди была самой приветливой собакой на свете. Она встречала каждого гостя с искренней радостью
                                    и создавала атмосферу уюта, где бы ни находилась. Мы перенесли этот дух гостеприимства в код.
                                </p>
                            </div>

                            <div className="flex items-center justify-center">
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(34,197,94,0.12)]">
                                    <img
                                        src="/logo.png"
                                        alt="Hahazen Lady"
                                        className="h-28 w-28 rounded-2xl object-cover"
                                    />
                                </div>
                            </div>

                            <blockquote className="rounded-3xl border border-white/10 bg-white/5 p-6 text-lg italic leading-relaxed text-gray-200">
                                «Не просто таблицы и графики — а цифровой помощник, который работает так же преданно и открыто, как добрая собака Леди».
                            </blockquote>
                        </div>
                    </div>
                </section>

                <section id="contact" className="relative mx-auto mt-28 max-w-6xl overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
                    <div
                        className="pointer-events-none absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
                        style={{ animation: "footerGlow 12s ease-in-out infinite" }}
                    />
                    <div
                        className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-green-400/10 blur-3xl"
                        style={{ animation: "floatSlow 15s ease-in-out infinite" }}
                    />

                    <div className="relative z-10">
                        <div className="mx-auto flex w-fit items-center gap-4">
                            <img
                                src="/logo.png"
                                alt="Hahazen"
                                className="h-14 w-14 rounded-xl object-cover"
                            />
                            <div className="text-left">
                                <h3 className="text-3xl font-bold text-white">Hahazen</h3>
                                <p className="text-sm text-gray-400">CRM с душой</p>
                            </div>
                        </div>

                        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-300">
                            Создано с любовью и вдохновением от самой дружелюбной собаки на свете — спаниеля Леди.
                        </p>

                        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <a
                                href="mailto:info@hahazen.com"
                                className="rounded-full border border-white/15 bg-white/8 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/12"
                            >
                                info@hahazen.com
                            </a>

                            <Link
                                href="/signin"
                                className="rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#16a34a]"
                            >
                                Логин
                            </Link>
                        </div>

                        <p className="mt-10 text-sm text-gray-500">
                            © 2026 Hahazen. Радость в порядке.
                        </p>
                    </div>
                </section>
            </main>

            {/*<Footer />*/}
        </div>
    );
}







{/*'use client';
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

            <header className="sticky top-0 z-30 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white text-center py-10 shadow-lg transition-shadow duration-300">
                <h1 className="text-4xl font-bold tracking-wide">Добро пожаловать в Hahazen</h1>
                <p className="text-lg mt-4 max-w-xl mx-auto">
                    Ваш надежный помощник в развитии бизнеса и создании лучших решений для клиентов
                </p>
            </header>



            <main
                className={`w-full min-h-screen bg-gray-900 text-gray-300 px-4 py-10 transition-opacity duration-700 ${
                    showContent ? "opacity-100" : "opacity-0"
                }`}
            >

                <section id="about" className="mb-16">
                    <h2 className="text-3xl font-bold text-center text-green-400 mb-6">О Hahazen</h2>
                    <p className="text-center max-w-3xl mx-auto leading-relaxed text-gray-400">
                        Hahazen — это простые и удобные инструменты, которые помогают бизнесу расти и работать эффективнее. Мы создаём решения, которые делают вашу работу легче и приятнее.
                    </p>
                </section>


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
            <Footer />
        </>
    );
}*/}
