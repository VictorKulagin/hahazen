'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
    CalendarDays,
    CalendarRange,
    MapPin,
    Menu,
    Search,
    Scissors,
    Star,
    UsersRound,
    WalletCards,
    X,
} from "lucide-react";
import { authStorage } from "@/services/authStorage";

const navItems = [
    { label: "О нас", href: "#about" },
    { label: "Салоны", href: "#catalog" },
    { label: "Контакты", href: "#contacts" },
];

const stats = [
    { value: "0 ₽", label: "Первые 6 месяцев" },
    { value: "24/7", label: "Онлайн-запись" },
    { value: "1 система", label: "Для всех филиалов" },
];

const salons = [
    {
        name: "Studio Lumen",
        location: "Москва · Хамовники",
        tags: ["Стрижки", "Окрашивание", "Уход"],
        description: "Светлая мастерская с фокусом на натуральные оттенки и здоровье волос.",
        rating: "4.9",
        reviews: "312",
        visual: "linear-gradient(140deg, #f3e7d7 0%, #eef4ed 42%, #08252b 100%)",
    },
    {
        name: "Noir Atelier",
        location: "Санкт-Петербург · Центр",
        tags: ["Барбершоп", "Бритье", "Стайлинг"],
        description: "Классический барбершоп с виски, редкими ножницами и японскими расческами.",
        rating: "4.8",
        reviews: "248",
        visual: "linear-gradient(135deg, #1b100d 0%, #6d3b23 37%, #041419 100%)",
    },
    {
        name: "Zenmara Spa",
        location: "Москва · Патриаршие",
        tags: ["Массаж", "SPA", "Ароматерапия"],
        description: "Тишина, камень и эвкалипт. Пространство, где тело учится дышать.",
        rating: "5.0",
        reviews: "187",
        visual: "linear-gradient(145deg, #3c2114 0%, #c4853c 46%, #0b2624 100%)",
    },
    {
        name: "Petal Nails",
        location: "Казань · Вахитовский",
        tags: ["Маникюр", "Педикюр", "Дизайн"],
        description: "Аккуратный маникюр и пастельная палитра в спокойном камерном салоне.",
        rating: "4.9",
        reviews: "401",
        visual: "linear-gradient(135deg, #f5c2cd 0%, #f9e7e8 45%, #123233 100%)",
    },
    {
        name: "Greenroom Barber",
        location: "Москва · Дорогомилово",
        tags: ["Мужские стрижки", "Борода", "Камуфляж"],
        description: "Теплый свет, винил и мастера, которым доверяют перед важной встречей.",
        rating: "4.7",
        reviews: "156",
        visual: "linear-gradient(145deg, #07110f 0%, #19533f 45%, #050b0e 100%)",
    },
    {
        name: "Clarte Clinic",
        location: "Санкт-Петербург · Петроградский",
        tags: ["Косметология", "Уход", "Аппаратные"],
        description: "Светлые процедуры, доказательный подход и понятные рекомендации.",
        rating: "4.9",
        reviews: "273",
        visual: "linear-gradient(135deg, #f7f8f3 0%, #dce7e5 46%, #08232a 100%)",
    },
];

const businessCards = [
    {
        title: "Записи без хаоса",
        text: "Единое расписание, повторные визиты, окна и переносы в одном спокойном экране.",
        icon: CalendarRange,
    },
    {
        title: "Клиенты и история визитов",
        text: "Карточка клиента с любимым мастером, аллергиями и заметками после каждого визита.",
        icon: UsersRound,
    },
    {
        title: "Финансы и отчеты",
        text: "Касса, зарплаты мастеров и понятные отчеты без таблиц на коленке.",
        icon: WalletCards,
    },
];

const staggerContainer: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.08,
        },
    },
};

const fadeInUp: Variants = {
    hidden: {
        opacity: 0,
        y: 22,
        filter: "blur(8px)",
    },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            duration: 0.72,
            ease: "easeOut",
        },
    },
};

const cardIn: Variants = {
    hidden: {
        opacity: 0,
        y: 26,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.56,
            ease: "easeOut",
        },
    },
};

export default function Home() {
    const [showContent, setShowContent] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = authStorage.getToken();
        if (token) {
            router.replace(authStorage.getContext() ? "/cabinet" : "/context/select");
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsAuthChecked(true);
        const timeout = setTimeout(() => setShowContent(true), 120);
        return () => clearTimeout(timeout);
    }, [router]);

    if (!isAuthChecked) return null;

    return (
        <div className="landing-surface min-h-screen overflow-x-hidden bg-[#041012] text-[var(--hz-text)]">
            <style jsx global>{`
                html {
                    scroll-behavior: smooth;
                }

                @keyframes hahazenSheen {
                    from {
                        transform: translateX(-120%) skewX(-16deg);
                    }
                    to {
                        transform: translateX(220%) skewX(-16deg);
                    }
                }

                @keyframes waterRipple {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.18);
                    }
                    16% {
                        opacity: 0.32;
                    }
                    50% {
                        opacity: 0.08;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    61% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(1.04);
                    }
                    72% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(1.04);
                    }
                    84% {
                        opacity: 0.16;
                        transform: translate(-50%, -50%) scale(0.58);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.18);
                    }
                }

                @keyframes waterBreath {
                    0%, 100% {
                        opacity: 0.46;
                        transform: translate3d(0, 0, 0) scale(1);
                    }
                    50% {
                        opacity: 0.68;
                        transform: translate3d(0, -10px, 0) scale(1.04);
                    }
                }

                @keyframes surfaceDrift {
                    0%, 100% {
                        opacity: 0.72;
                        transform: translate3d(-1.5%, -1%, 0) scale(1.02);
                    }
                    50% {
                        opacity: 0.9;
                        transform: translate3d(1.5%, 1%, 0) scale(1.06);
                    }
                }

                .landing-surface {
                    --hz-text-strong: #eef6f1;
                    --hz-text: #d8e5e1;
                    --hz-muted: #9fb7b4;
                    --hz-soft: #78918e;
                    --hz-panel: rgba(7, 26, 30, 0.76);
                    --hz-panel-deep: rgba(4, 17, 21, 0.72);
                    --hz-line: rgba(46, 230, 207, 0.16);
                    position: relative;
                    isolation: isolate;
                    background:
                        radial-gradient(ellipse 78rem 58rem at 18% 18%, rgba(22, 115, 126, 0.52), transparent 72%),
                        radial-gradient(ellipse 78rem 54rem at 64% 58%, rgba(6, 92, 63, 0.38), transparent 72%),
                        linear-gradient(112deg, #0a3e46 0%, #07272d 22%, #041416 52%, #031010 100%);
                }

                .landing-surface::before {
                    content: "";
                    position: fixed;
                    inset: -12%;
                    z-index: 0;
                    pointer-events: none;
                    background:
                        radial-gradient(ellipse 54rem 68rem at 10% 22%, rgba(24, 135, 146, 0.34), transparent 72%),
                        radial-gradient(ellipse 42rem 32rem at 54% 28%, rgba(39, 226, 194, 0.08), transparent 74%),
                        radial-gradient(ellipse 76rem 48rem at 82% 88%, rgba(6, 101, 68, 0.36), transparent 78%),
                        linear-gradient(90deg, rgba(10, 74, 82, 0.24), rgba(2, 11, 12, 0.34) 68%);
                    filter: blur(22px);
                    animation: surfaceDrift 18s ease-in-out infinite;
                }

                .landing-surface > main,
                .landing-surface > footer {
                    position: relative;
                    z-index: 1;
                }

                .landing-section {
                    position: relative;
                }

                .hero-section {
                    background:
                        radial-gradient(ellipse 58rem 42rem at 50% 50%, rgba(40, 224, 194, 0.12), transparent 72%),
                        radial-gradient(ellipse 92rem 64rem at 18% 18%, rgba(12, 89, 98, 0.24), transparent 74%),
                        linear-gradient(180deg, #02090b 0%, #030d0f 56%, #031112 100%);
                    box-shadow:
                        inset 0 -120px 220px rgba(1, 8, 10, 0.2);
                }

                .soft-section {
                    overflow: visible;
                    background: transparent;
                }

                .lower-flow {
                    position: relative;
                    z-index: 1;
                    isolation: isolate;
                    margin-top: -220px;
                    padding-top: 220px;
                    background:
                        radial-gradient(ellipse 86rem 58rem at 18% 10%, rgba(22, 112, 124, 0.22), transparent 74%),
                        radial-gradient(ellipse 92rem 68rem at 88% 46%, rgba(6, 88, 58, 0.3), transparent 82%),
                        radial-gradient(ellipse 70rem 42rem at 42% 100%, rgba(39, 226, 194, 0.08), transparent 76%),
                        linear-gradient(180deg, rgba(3, 17, 18, 0) 0%, rgba(6, 55, 61, 0.34) 18rem, rgba(10, 67, 75, 0.72) 24rem, rgba(4, 20, 22, 0.86) 62%, rgba(4, 70, 48, 0.58) 100%);
                }

                .lower-flow::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    z-index: -1;
                    pointer-events: none;
                    background:
                        linear-gradient(180deg, rgba(3, 12, 14, 0) 0%, rgba(8, 61, 67, 0.28) 22rem, rgba(5, 39, 36, 0.18) 100%),
                        radial-gradient(ellipse 72rem 30rem at 50% 0%, rgba(37, 214, 190, 0.1), transparent 72%);
                    filter: blur(0.2px);
                }

                .hero-transition {
                    position: absolute;
                    right: 0;
                    bottom: -260px;
                    left: 0;
                    height: 520px;
                    pointer-events: none;
                    background:
                        radial-gradient(ellipse at 50% 18%, rgba(38, 224, 194, 0.09), transparent 36rem),
                        linear-gradient(180deg, rgba(3, 17, 18, 0) 0%, rgba(3, 17, 18, 0.08) 44%, rgba(6, 47, 48, 0.18) 100%);
                    filter: blur(22px);
                }

                .hero-transition::before {
                    content: "";
                    position: absolute;
                    right: 0;
                    bottom: 150px;
                    left: 0;
                    height: 220px;
                    background: radial-gradient(ellipse at center, rgba(18, 116, 112, 0.12), transparent 66%);
                    filter: blur(38px);
                }

                .hero-water {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    overflow: hidden;
                }

                .hero-water::before {
                    content: "";
                    position: absolute;
                    left: 50%;
                    top: 49%;
                    width: min(70vw, 820px);
                    height: min(70vw, 820px);
                    border-radius: 9999px;
                    background:
                        radial-gradient(circle, rgba(40, 224, 194, 0.16), rgba(25, 143, 126, 0.08) 30%, transparent 68%);
                    filter: blur(48px);
                    transform: translate(-50%, -50%);
                    animation: waterBreath 8s ease-in-out infinite;
                }

                .water-ripple {
                    position: absolute;
                    left: 50%;
                    top: 49%;
                    width: min(74vw, 760px);
                    aspect-ratio: 1;
                    border-radius: 9999px;
                    border: 1px solid rgba(50, 242, 210, 0.18);
                    box-shadow:
                        0 0 34px rgba(40, 224, 194, 0.08),
                        inset 0 0 34px rgba(40, 224, 194, 0.04);
                    transform: translate(-50%, -50%) scale(0.18);
                    animation: waterRipple 9.4s ease-in-out infinite;
                }

                .water-ripple:nth-child(2) {
                    width: min(82vw, 900px);
                    animation-delay: 2.35s;
                    border-color: rgba(50, 242, 210, 0.14);
                }

                .water-ripple:nth-child(3) {
                    width: min(92vw, 1040px);
                    animation-delay: 4.7s;
                    border-color: rgba(255, 255, 255, 0.08);
                }

                .water-ripple:nth-child(4) {
                    width: min(64vw, 680px);
                    animation-delay: 7.05s;
                    border-color: rgba(40, 224, 194, 0.12);
                }

                .legend-section {
                    margin-top: 1rem;
                    overflow: visible;
                    background: transparent;
                }

                @media (prefers-reduced-motion: reduce) {
                    .landing-surface::before,
                    .hero-water::before,
                    .water-ripple,
                    .hero-button-primary::after {
                        animation: none;
                    }
                }

                .display-serif {
                    font-family: Georgia, "Times New Roman", serif;
                }

                .nav-shell {
                    border: 1px solid var(--hz-line);
                    background:
                        linear-gradient(180deg, rgba(10, 37, 42, 0.84), rgba(5, 20, 24, 0.72)),
                        radial-gradient(ellipse at 12% 0%, rgba(46, 230, 207, 0.08), transparent 42%);
                    box-shadow:
                        0 20px 80px rgba(0, 0, 0, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.08),
                        inset 0 -1px 0 rgba(46, 230, 207, 0.05);
                }

                .brand-mark {
                    border-color: rgba(46, 230, 207, 0.44);
                    box-shadow:
                        0 0 0 1px rgba(46, 230, 207, 0.12),
                        0 0 20px rgba(46, 230, 207, 0.28),
                        inset 0 0 18px rgba(46, 230, 207, 0.1);
                }

                .brand-mark::after {
                    content: "";
                    position: absolute;
                    inset: 2px;
                    border-radius: 6px;
                    border: 1px solid rgba(46, 230, 207, 0.1);
                    pointer-events: none;
                }

                .haze-card {
                    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.06);
                }

                .legend-portrait-card {
                    position: relative;
                    background:
                        radial-gradient(ellipse 82% 74% at 50% 48%, rgba(40, 224, 194, 0.18), transparent 68%),
                        linear-gradient(180deg, rgba(8, 40, 40, 0.84), rgba(4, 17, 20, 0.76));
                    box-shadow:
                        0 30px 110px rgba(12, 120, 92, 0.2),
                        0 24px 70px rgba(0, 0, 0, 0.3),
                        inset 0 0 0 1px rgba(46, 230, 207, 0.12),
                        inset 0 1px 0 rgba(255, 255, 255, 0.08);
                }

                .legend-portrait-card::before {
                    content: "";
                    position: absolute;
                    inset: 10px;
                    border-radius: 8px;
                    background: radial-gradient(circle at 50% 48%, rgba(40, 224, 194, 0.18), transparent 58%);
                    filter: blur(18px);
                    pointer-events: none;
                }

                .legend-quote {
                    background:
                        radial-gradient(ellipse at 18% 0%, rgba(40, 224, 194, 0.13), transparent 58%),
                        linear-gradient(120deg, rgba(9, 64, 52, 0.82), rgba(5, 22, 24, 0.74));
                    box-shadow:
                        0 22px 70px rgba(6, 84, 56, 0.2),
                        inset 0 0 0 1px rgba(46, 230, 207, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.08);
                }

                .hero-button-primary::after {
                    animation: hahazenSheen 4s ease-in-out infinite;
                }
            `}</style>

            <motion.header
                className="fixed left-0 right-0 top-4 z-50 px-4"
                initial={{ opacity: 0, y: -18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.58, ease: "easeOut" }}
            >
                <div className="nav-shell mx-auto flex h-[58px] max-w-[1120px] items-center justify-between rounded-[8px] px-3 backdrop-blur-2xl sm:h-[64px] sm:px-5">
                    <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Hahazen">
                        <span className="brand-mark relative h-11 w-11 shrink-0 overflow-hidden rounded-[8px] border bg-[#041012] sm:h-12 sm:w-12">
                            <Image
                                src="/logo.png"
                                alt=""
                                fill
                                sizes="48px"
                                className="object-cover"
                            />
                        </span>
                        <span className="min-w-0 leading-none">
                            <span className="display-serif block truncate text-xl font-bold text-[var(--hz-text-strong)]">
                                Hahazen
                            </span>
                            <span className="mt-1 block truncate text-[11px] font-medium text-[var(--hz-muted)]">
                                Радость в порядке
                            </span>
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-9 text-sm font-medium text-[var(--hz-muted)] md:flex">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href} className="transition hover:text-[var(--hz-text-strong)]">
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <Link
                        href="/signin"
                        className="hidden h-10 items-center rounded-[8px] bg-[#28e0c2] px-5 text-sm font-semibold text-[#062326] shadow-[0_0_24px_rgba(40,224,194,0.28)] transition hover:bg-[#58f4d8] md:flex"
                    >
                        Логин
                    </Link>

                    <button
                        type="button"
                        onClick={() => setIsMenuOpen((value) => !value)}
                        className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-white/10 bg-white/[0.04] text-white md:hidden"
                        aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
                    >
                        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="mx-auto mt-2 max-w-[1120px] rounded-[8px] border border-white/10 bg-[#08181d]/95 p-3 backdrop-blur-2xl md:hidden">
                        <nav className="grid gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="rounded-[8px] px-3 py-3 text-sm text-[var(--hz-muted)] transition hover:bg-white/[0.06] hover:text-[var(--hz-text-strong)]"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <Link
                                href="/signin"
                                onClick={() => setIsMenuOpen(false)}
                                className="mt-1 rounded-[8px] bg-[#28e0c2] px-3 py-3 text-center text-sm font-semibold text-[#062326]"
                            >
                                Логин
                            </Link>
                        </nav>
                    </div>
                )}
            </motion.header>

            <main
                className={`transition-opacity duration-700 ${showContent ? "opacity-100" : "opacity-0"}`}
            >
                <section id="about" className="landing-section hero-section relative min-h-[720px] overflow-hidden px-4 pt-28 sm:min-h-[760px] lg:min-h-[780px]">
                    <div className="hero-water" aria-hidden="true">
                        <span className="water-ripple" />
                        <span className="water-ripple" />
                        <span className="water-ripple" />
                        <span className="water-ripple" />
                    </div>
                    <div className="hero-transition" aria-hidden="true" />
                    <motion.div
                        className="relative z-10 mx-auto flex min-h-[590px] max-w-[1120px] flex-col items-center justify-center pb-14 text-center sm:min-h-[630px] lg:min-h-[650px]"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div variants={fadeInUp} className="rounded-full border border-[#2ee6cf]/10 bg-white/[0.035] px-4 py-2 text-xs font-medium text-[var(--hz-muted)] backdrop-blur">
                            CRM с душой · Радость в порядке
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="display-serif mt-8 max-w-[1040px] text-[46px] font-bold leading-[0.98] text-[var(--hz-text-strong)] sm:text-[74px] lg:text-[88px]">
                            Хаос превращается
                            <span className="block">
                                в <em className="font-normal text-[#28e0c2]">улыбку</em>
                            </span>
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="mt-7 max-w-[620px] text-base leading-7 text-[var(--hz-muted)] sm:text-lg">
                            CRM и каталог салонов для тех, кто хочет порядка в записях, клиентах и расписании.
                        </motion.p>

                        <motion.div variants={fadeInUp} className="mt-10 flex w-full max-w-[340px] flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
                            <Link
                                href="#catalog"
                                className="hero-button-primary relative flex h-12 items-center justify-center overflow-hidden rounded-[8px] bg-[#28e0c2] px-7 text-sm font-semibold text-[#062326] shadow-[0_0_34px_rgba(40,224,194,0.32)] transition hover:bg-[#58f4d8]"
                            >
                                <span className="relative z-10">Найти салон</span>
                                <span className="absolute inset-y-0 left-0 w-10 bg-white/35 blur-md" />
                            </Link>
                            <Link
                                href="#legend"
                                className="flex h-12 items-center justify-center rounded-[8px] border border-[#2ee6cf]/10 bg-[#0a171c] px-7 text-sm font-semibold text-[var(--hz-muted)] transition hover:border-[#28e0c2]/30 hover:text-[var(--hz-text-strong)]"
                            >
                                Узнать историю
                            </Link>
                        </motion.div>

                        <motion.div variants={staggerContainer} className="mt-14 grid w-full max-w-[360px] grid-cols-3 gap-2 sm:mt-16 sm:max-w-[620px] sm:gap-3">
                            {stats.map((stat) => (
                                <motion.div
                                    key={stat.label}
                                    variants={cardIn}
                                    whileHover={{ y: -4 }}
                                    className="haze-card flex min-h-[74px] flex-col items-center justify-center rounded-[8px] border border-white/10 bg-[#07191d]/64 px-2 py-3 text-center backdrop-blur sm:min-h-0 sm:px-6 sm:py-5"
                                >
                                    <div className="display-serif text-xl font-bold leading-none text-[#28e0c2] sm:text-3xl">{stat.value}</div>
                                    <div className="mt-1 text-[10px] leading-tight text-[var(--hz-muted)] sm:text-sm">{stat.label}</div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                </section>

                <div className="lower-flow">
                <section id="catalog" className="landing-section soft-section scroll-mt-28 px-4 pb-24 pt-20 sm:pt-24">
                    <div className="relative z-10 mx-auto max-w-[1120px]">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#28e0c2]/76">Каталог</p>
                        <h2 className="display-serif mt-4 max-w-[740px] text-[38px] font-bold leading-tight text-[var(--hz-text-strong)] sm:text-[56px]">
                            Салоны, которые уже можно найти в <em className="font-normal text-[#28e0c2]">Hahazen</em>
                        </h2>
                        <p className="mt-5 max-w-[620px] text-base leading-7 text-[var(--hz-muted)]">
                            Выберите салон, услугу и удобное время без лишних переписок.
                        </p>

                        <form className="haze-card mt-10 grid gap-2 rounded-[8px] border border-white/10 bg-[#07191d]/72 p-3 backdrop-blur lg:grid-cols-[1.3fr_1.25fr_0.65fr_auto]">
                            <label className="flex h-12 items-center gap-3 rounded-[8px] bg-[#041015] px-4 text-[var(--hz-soft)]">
                                <Scissors className="h-4 w-4 shrink-0" />
                                <span className="truncate text-sm">Услуга: стрижка, маникюр, массаж...</span>
                            </label>
                            <label className="flex h-12 items-center gap-3 rounded-[8px] bg-[#041015] px-4 text-[var(--hz-soft)]">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span className="truncate text-sm">Район или город</span>
                            </label>
                            <label className="flex h-12 items-center gap-3 rounded-[8px] bg-[#041015] px-4 text-[var(--hz-soft)]">
                                <CalendarDays className="h-4 w-4 shrink-0" />
                                <span className="truncate text-sm">дд.мм.гггг</span>
                            </label>
                            <button type="button" className="flex h-12 items-center justify-center gap-2 rounded-[8px] bg-[#28e0c2] px-6 text-sm font-semibold text-[#062326] transition hover:bg-[#58f4d8]">
                                <Search className="h-4 w-4" />
                                Найти
                            </button>
                        </form>

                        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {salons.map((salon) => (
                                <article key={salon.name} className="haze-card overflow-hidden rounded-[8px] border border-white/10 bg-[#082224]/78">
                                    <div className="relative h-[180px]" style={{ background: salon.visual }}>
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(180deg,transparent_42%,rgba(0,0,0,0.72))]" />
                                        <div className="absolute right-3 top-3 flex h-8 items-center gap-1 rounded-full bg-[#071014]/78 px-3 text-xs text-[var(--hz-text)] backdrop-blur">
                                            <Star className="h-3.5 w-3.5 fill-[#28e0c2] text-[#28e0c2]" />
                                            {salon.rating} · {salon.reviews}
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="display-serif text-2xl font-bold text-[var(--hz-text-strong)]">{salon.name}</h3>
                                        <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--hz-soft)]">
                                            <MapPin className="h-4 w-4" />
                                            {salon.location}
                                        </p>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {salon.tags.map((tag) => (
                                                <span key={tag} className="rounded-full border border-[#28e0c2]/24 bg-[#28e0c2]/8 px-2.5 py-1 text-[11px] font-semibold uppercase text-[#28e0c2]/86">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <p className="mt-5 min-h-[72px] text-sm leading-6 text-[var(--hz-muted)]">{salon.description}</p>

                                        <div className="mt-5 grid grid-cols-2 gap-2">
                                            <Link href="/signin" className="flex h-10 items-center justify-center rounded-[8px] bg-[#28e0c2] text-sm font-semibold text-[#062326] transition hover:bg-[#58f4d8]">
                                                Записаться
                                            </Link>
                                            <Link href="#legend" className="flex h-10 items-center justify-center rounded-[8px] border border-white/10 bg-[#071014] text-sm font-semibold text-[var(--hz-muted)] transition hover:text-[var(--hz-text-strong)]">
                                                Подробнее
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="landing-section soft-section px-4 py-24">
                    <div className="relative z-10 mx-auto max-w-[1120px]">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#28e0c2]/76">Для бизнеса</p>
                        <h2 className="display-serif mt-4 max-w-[620px] text-[38px] font-bold leading-tight text-[var(--hz-text-strong)] sm:text-[56px]">
                            Что Hahazen делает для <em className="font-normal text-[#28e0c2]">бизнеса</em>
                        </h2>

                        <div className="mt-14 grid gap-4 lg:grid-cols-3">
                            {businessCards.map((card) => {
                                const Icon = card.icon;

                                return (
                                    <article key={card.title} className="haze-card min-h-[170px] rounded-[8px] border border-white/10 bg-[#07191d]/58 p-7 backdrop-blur">
                                        <Icon className="h-6 w-6 text-[#28e0c2]" />
                                        <h3 className="display-serif mt-6 text-xl font-bold text-[var(--hz-text-strong)]">{card.title}</h3>
                                        <p className="mt-3 text-sm leading-6 text-[var(--hz-muted)]">{card.text}</p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section id="legend" className="landing-section legend-section scroll-mt-28 px-4 py-24">
                    <div className="relative z-10 mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-[0.9fr_1fr] lg:items-center">
                        <div className="haze-card legend-portrait-card overflow-hidden rounded-[8px] border border-[#2ee6cf]/14 p-3">
                            <div className="relative aspect-square overflow-hidden rounded-[8px] bg-[#061418]">
                                <Image
                                    src="/legend.png"
                                    alt="Hahazen"
                                    fill
                                    sizes="(max-width: 1024px) 92vw, 500px"
                                    className="object-cover"
                                    priority={false}
                                />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(40,224,194,0.12),transparent_58%),linear-gradient(180deg,rgba(4,16,18,0.02),rgba(4,16,18,0.18))]" />
                                <div className="absolute bottom-5 left-5 right-5 rounded-[8px] border border-[#2ee6cf]/14 bg-[#041012]/58 px-4 py-3 backdrop-blur-md">
                                    <p className="display-serif text-xl font-bold text-[var(--hz-text-strong)]">Леди</p>
                                    <p className="mt-1 text-xs leading-5 text-[var(--hz-muted)]">
                                        тихий символ заботы и гостеприимства Hahazen
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#28e0c2]/76">Легенда</p>
                            <h2 className="display-serif mt-4 max-w-[640px] text-[38px] font-bold leading-tight text-[var(--hz-text-strong)] sm:text-[56px]">
                                Легенда Hahazen: <em className="font-normal text-[#28e0c2]">Радость в порядке</em>
                            </h2>

                            <div className="mt-8 space-y-5 text-base leading-7 text-[var(--hz-muted)]">
                                <p>
                                    <strong className="font-semibold text-[var(--hz-text-strong)]">Ha-ha</strong> это радость, которую слышно в коридоре. Смех мастера,
                                    довольный клиент, теплое «до встречи».
                                </p>
                                <p>
                                    <strong className="font-semibold text-[var(--hz-text-strong)]">Zen</strong> это спокойствие за стойкой. Когда расписание не подводит,
                                    касса сходится, а уведомления приходят сами.
                                </p>
                                <p>
                                    И где-то рядом Леди, кокер-спаниель и наш тихий символ гостеприимства. Она встречает каждого, кто заходит в Hahazen,
                                    и напоминает: порядок это форма заботы.
                                </p>
                            </div>

                            <blockquote className="haze-card legend-quote mt-9 rounded-[8px] border border-[#2ee6cf]/12 p-6">
                                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#28e0c2]/82">
                                    Радость в порядке
                                </span>
                                <p className="display-serif mt-3 text-xl italic leading-8 text-[var(--hz-text-strong)]">
                                    «Радость в порядке» наш способ сказать, что бизнес может быть теплым.
                                </p>
                            </blockquote>
                        </div>
                    </div>
                </section>
                </div>
            </main>

            <footer id="contacts" className="relative bg-transparent px-4 py-14">
                <div className="mx-auto grid max-w-[1120px] gap-8 text-[var(--hz-muted)] md:grid-cols-3 md:items-center">
                    <div>
                        <Link href="/" className="flex items-center gap-3">
                            <span className="brand-mark relative h-11 w-11 overflow-hidden rounded-[8px] border bg-[#041012]">
                                <Image
                                    src="/logo.png"
                                    alt=""
                                    fill
                                    sizes="44px"
                                    className="object-cover"
                                />
                            </span>
                            <span className="leading-none">
                                <span className="display-serif block text-xl font-bold text-[var(--hz-text-strong)]">Hahazen</span>
                                <span className="mt-1 block text-[11px] font-medium text-[var(--hz-muted)]">
                                    Радость в порядке
                                </span>
                            </span>
                        </Link>
                        <p className="mt-3 text-sm">CRM с душой</p>
                        <p className="mt-8 text-xs">© 2026 Hahazen. Радость в порядке.</p>
                    </div>

                    <a href="mailto:info@hahazen.com" className="text-sm transition hover:text-[var(--hz-text-strong)] md:text-center">
                        info@hahazen.com
                    </a>

                    <div className="md:text-right">
                        <Link
                            href="/signin"
                            className="inline-flex h-11 items-center rounded-[8px] bg-[#28e0c2] px-6 text-sm font-semibold text-[#062326] transition hover:bg-[#58f4d8]"
                        >
                            Логин
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
