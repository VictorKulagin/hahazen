'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
    ArrowRight,
    CalendarDays,
    CalendarRange,
    Check,
    ClipboardList,
    Gift,
    MapPin,
    ShieldCheck,
    Star,
    Menu,
    UsersRound,
    X,
} from "lucide-react";
import { authStorage } from "@/services/authStorage";

const navItems = [
    { label: "О нас", href: "#legend" },
    { label: "Для бизнеса", href: "#business" },
    { label: "Тарифы", href: "#pricing" },
    { label: "Контакты", href: "#contacts" },
];

const ownerFeatures = [
    {
        title: "Расписание мастеров",
        text: "Видите загрузку каждого мастера по дням и неделям. Перетаскивайте записи, избегайте пересечений.",
        icon: CalendarRange,
    },
    {
        title: "Клиентская база",
        text: "Все клиенты в одном месте: контакты, предпочтения, теги и сегменты для рассылок.",
        icon: UsersRound,
    },
    {
        title: "Онлайн-запись 24/7",
        text: "Клиенты записываются сами через каталог или вашу персональную страницу — без звонков.",
        icon: CalendarDays,
    },
    {
        title: "История визитов и карта тела",
        text: "Карточка клиента с историей услуг, отметками по телу для массажа и SPA, суммами и заметками мастера.",
        icon: ClipboardList,
    },
    {
        title: "Бонусная система",
        text: "Начисляйте бонусы после визитов, настраивайте правила и возвращайте клиентов без скидочного хаоса.",
        icon: Gift,
    },
    {
        title: "Роли и доступы",
        text: "Настраивайте права владельца, администратора и мастеров: каждый видит только нужные разделы и данные.",
        icon: ShieldCheck,
    },
];

const plans = [
    {
        name: "Solo",
        description: "Для частных мастеров и небольших студий",
        price: "2 000",
        features: ["Расписание и записи", "Клиентская база", "Онлайн-запись", "Карточка клиента"],
    },
    {
        name: "Salon",
        description: "Один филиал · неограниченное число мастеров",
        price: "3 000",
        badge: "Популярный",
        featured: true,
        features: ["Всё из Solo", "Безлимит мастеров", "Карта тела и SPA-протоколы", "Роли и доступы сотрудников"],
    },
    {
        name: "Доп. филиал",
        description: "К любому действующему тарифу",
        price: "+3 000",
        features: ["Отдельное расписание", "Свои мастера и услуги", "Общая база клиентов", "Сводная аналитика"],
    },
];

const partnerSalons = [
    {
        label: "Пилотный партнёр",
        name: "Партнёрский салон",
        location: "Бишкек",
        services: "Стрижки · Окрашивание · Маникюр",
        rating: "4.9",
        visual: "radial-gradient(circle at 24% 20%, rgba(72, 231, 191, 0.22), transparent 34%), linear-gradient(135deg, #21463f, #17312e 54%, #102320)",
    },
    {
        label: "Демо-карточка",
        name: "Массажная студия",
        location: "Бишкек",
        services: "Массаж · SPA · Уход",
        rating: "—",
        visual: "radial-gradient(circle at 78% 28%, rgba(70, 210, 179, 0.16), transparent 30%), linear-gradient(145deg, #1c3b36, #142d2a 58%, #0f211f)",
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

                @keyframes heroCardFloat {
                    0%, 100% {
                        transform: translate3d(0, 0, 0);
                    }
                    50% {
                        transform: translate3d(0, var(--float-distance, -6px), 0);
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
                        radial-gradient(ellipse 54rem 44rem at 72% 53%, rgba(23, 127, 101, 0.2), transparent 72%),
                        radial-gradient(ellipse 70rem 60rem at 94% 48%, rgba(11, 106, 83, 0.26), transparent 74%),
                        linear-gradient(90deg, #061515 0%, #08201e 48%, #0b3c34 100%);
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
                    margin-top: 0;
                    padding-top: 0;
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

                .hero-reference-shell {
                    min-height: 790px;
                    padding-top: 72px;
                }

                .hero-reference-title {
                    letter-spacing: -0.035em;
                    text-wrap: balance;
                }

                .hero-product-visual {
                    position: relative;
                    width: 660px;
                    height: 650px;
                    margin-left: 25px;
                    flex: none;
                }

                .hero-schedule-panel {
                    position: absolute;
                    top: 31px;
                    left: 53px;
                    width: 584px;
                    height: 480px;
                    border: 1px solid rgba(133, 176, 164, 0.16);
                    border-radius: 16px;
                    background: rgba(15, 42, 39, 0.88);
                    box-shadow:
                        0 20px 80px rgba(0, 0, 0, 0.18),
                        inset 0 1px 0 rgba(255, 255, 255, 0.035);
                    overflow: hidden;
                }

                .hero-calendar-grid {
                    position: relative;
                    display: grid;
                    grid-template-columns: 68px repeat(3, 1fr);
                    grid-template-rows: 38px repeat(6, 48px);
                    height: 326px;
                    overflow: hidden;
                    border: 1px solid rgba(122, 167, 157, 0.13);
                    border-radius: 11px 11px 0 0;
                    background: rgba(16, 43, 40, 0.72);
                }

                .hero-calendar-grid > div {
                    border-right: 1px solid rgba(122, 167, 157, 0.1);
                    border-bottom: 1px solid rgba(122, 167, 157, 0.1);
                }

                .hero-calendar-event {
                    position: absolute;
                    z-index: 2;
                    border: 1px solid rgba(45, 224, 185, 0.54);
                    border-radius: 11px;
                    background: rgba(32, 105, 86, 0.7);
                    padding: 10px 9px;
                    font-size: 11px;
                    line-height: 1.2;
                    color: #4be7c6;
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
                }

                .hero-calendar-event-muted {
                    border-color: rgba(110, 168, 156, 0.18);
                    background: rgba(27, 65, 61, 0.68);
                    color: #c4d9d5;
                }

                .hero-float-card {
                    position: absolute;
                    z-index: 4;
                    border: 1px solid rgba(121, 164, 154, 0.13);
                    background: rgba(24, 51, 48, 0.96);
                    box-shadow:
                        0 20px 60px rgba(0, 0, 0, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.04);
                    backdrop-filter: blur(18px);
                    will-change: transform;
                    animation: heroCardFloat 7.6s ease-in-out infinite;
                }

                .hero-float-tool {
                    --float-distance: -5px;
                    animation-duration: 6.8s;
                    animation-delay: -1.2s;
                }

                .hero-float-client {
                    --float-distance: -7px;
                    animation-duration: 8.2s;
                    animation-delay: -4.4s;
                }

                .hero-float-permissions {
                    --float-distance: -6px;
                    animation-duration: 7.4s;
                    animation-delay: -2.8s;
                }

                @media (max-width: 1279px) {
                    .hero-product-visual {
                        transform: scale(0.82);
                        transform-origin: center;
                        margin-inline: -60px;
                    }
                }

                @media (max-width: 1023px) {
                    .hero-reference-shell {
                        min-height: auto;
                        padding-top: 0;
                    }

                    .hero-product-visual {
                        transform: scale(0.9);
                        transform-origin: top center;
                        margin: -20px auto -55px;
                    }
                }

                @media (max-width: 700px) {
                    .hero-product-visual {
                        left: 50%;
                        transform: scale(0.55);
                        margin: -15px -330px -270px;
                    }
                }

                .legend-section {
                    margin-top: 1rem;
                    overflow: visible;
                    background: transparent;
                }

                .legend-showcase {
                    position: relative;
                    min-height: 410px;
                    overflow: hidden;
                    border: 1px solid rgba(46, 230, 207, 0.24);
                    border-radius: 24px;
                    background:
                        radial-gradient(ellipse 60% 90% at 82% 50%, rgba(34, 162, 132, 0.18), transparent 72%),
                        linear-gradient(110deg, rgba(7, 29, 28, 0.98), rgba(12, 51, 45, 0.92));
                    box-shadow:
                        0 30px 100px rgba(0, 0, 0, 0.24),
                        inset 0 1px 0 rgba(255, 255, 255, 0.05);
                }

                .legend-showcase::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    z-index: 2;
                    pointer-events: none;
                    background:
                        linear-gradient(90deg, rgba(7, 29, 28, 1) 0%, rgba(7, 29, 28, 0.94) 36%, rgba(7, 29, 28, 0.2) 68%, rgba(7, 29, 28, 0.04) 100%),
                        radial-gradient(circle at 78% 50%, rgba(38, 224, 194, 0.12), transparent 42%);
                }

                .legend-showcase-image {
                    position: absolute;
                    inset: 0 0 0 38%;
                }

                @media (max-width: 767px) {
                    .legend-showcase {
                        min-height: 650px;
                    }

                    .legend-showcase::before {
                        background:
                            linear-gradient(180deg, rgba(7, 29, 28, 1) 0%, rgba(7, 29, 28, 0.96) 42%, rgba(7, 29, 28, 0.28) 70%, rgba(7, 29, 28, 0.08) 100%),
                            radial-gradient(circle at 62% 76%, rgba(38, 224, 194, 0.12), transparent 42%);
                    }

                    .legend-showcase-image {
                        inset: 36% -28% 0 -8%;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .landing-surface::before,
                    .hero-water::before,
                    .water-ripple,
                    .hero-float-card,
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
                <section id="about" className="landing-section hero-section relative min-h-[790px] overflow-hidden px-4 pt-28 lg:pt-0">
                    <div className="hero-water" aria-hidden="true">
                        <span className="water-ripple" />
                        <span className="water-ripple" />
                        <span className="water-ripple" />
                        <span className="water-ripple" />
                    </div>
                    <div className="hero-transition" aria-hidden="true" />
                    <motion.div
                        className="hero-reference-shell relative z-10 mx-auto grid max-w-[1230px] items-center gap-3 lg:grid-cols-[560px_1fr]"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="relative z-10 pt-7 lg:pt-0">
                            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full border border-[#2ee6cf]/25 bg-[#123d36]/75 px-3 py-1.5 text-[11px] font-medium text-[#43e6c1]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#43e6c1]/70" />
                                CRM для салонов и массажных студий
                            </motion.div>

                            <motion.h1 variants={fadeInUp} className="hero-reference-title display-serif mt-7 max-w-[555px] text-[43px] font-bold leading-[1.04] text-[var(--hz-text-strong)] sm:text-[56px] lg:text-[61px]">
                                Все записи,
                                <span className="block">клиенты и мастера</span>
                                <span className="block">
                                    — <span className="text-[#4de7bd]">в одном спокойном интерфейсе.</span>
                                </span>
                            </motion.h1>

                            <motion.p variants={fadeInUp} className="mt-6 max-w-[550px] text-[16px] leading-[1.75] text-[#b9cfca] sm:text-[17px]">
                                Hahazen помогает салонам убрать хаос из WhatsApp,
                                <span className="block">тетрадей и Excel: расписание, онлайн-запись, клиентская база</span>
                                <span className="block">и история визитов в одной системе.</span>
                            </motion.p>

                            <motion.div variants={fadeInUp} className="mt-7 flex max-w-[580px] flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/signup"
                                    className="hero-button-primary relative flex h-12 items-center justify-center overflow-hidden rounded-full bg-[#39e2b4] px-6 text-[14px] font-semibold text-[#062c26] shadow-[0_0_34px_rgba(40,224,194,0.16)] transition hover:bg-[#58f4d8]"
                                >
                                    <span className="relative z-10">Попробовать 6 месяцев бесплатно</span>
                                    <span className="absolute inset-y-0 left-0 w-10 bg-white/35 blur-md" />
                                </Link>
                                <Link
                                    href="/signin"
                                    className="flex h-12 items-center justify-center gap-3 rounded-full border border-[#9bbcb5]/20 bg-[#102724]/70 px-6 text-[14px] font-semibold text-white transition hover:border-[#39e2b4]/40"
                                >
                                    Посмотреть интерфейс
                                    <ArrowRight className="h-4 w-4 text-[#d7e8e4]" />
                                </Link>
                            </motion.div>

                            <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[12px] text-[#b7ccc7]">
                                {["без оплаты за каждого мастера", "3000 сом за салон", "онлайн-запись 24/7"].map((benefit) => (
                                    <span key={benefit} className="flex items-center gap-2">
                                        <Check className="h-4 w-4 stroke-[2.5] text-[#42e4bb]" />
                                        {benefit}
                                    </span>
                                ))}
                            </motion.div>
                        </div>

                        <motion.div variants={cardIn} className="hero-product-visual" aria-label="Интерфейс Hahazen">
                            <div className="hero-schedule-panel">
                                <div className="flex items-center justify-between px-6 pt-6">
                                    <div className="flex gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#cf4b4b]" />
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#d9a637]" />
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#52e0ba]" />
                                    </div>
                                    <span className="text-[10px] tracking-[0.08em] text-[#8eb0a9]">hahazen.app&nbsp; / &nbsp;расписание</span>
                                    <span className="w-8" />
                                </div>

                                <div className="px-6 pt-5">
                                    <p className="text-[10px] uppercase tracking-[0.08em] text-[#75aaa1]">Филиал · Центр</p>
                                    <div className="mt-1 flex items-center justify-between">
                                        <h2 className="text-[16px] font-semibold text-white">Расписание мастеров</h2>
                                        <span className="rounded-full bg-[#37d9ad] px-4 py-1.5 text-[10px] font-semibold text-[#073229]">+ Новая запись</span>
                                    </div>

                                    <div className="hero-calendar-grid mt-6">
                                        <div />
                                        {["Айгуль", "Тимур", "Алия"].map((master) => (
                                            <div key={master} className="flex items-center justify-center text-[10px] font-medium text-[#a8c9c2]">
                                                {master}
                                            </div>
                                        ))}
                                        {["10:00", "11:00", "12:00", "13:00", "14:00", "15:00"].map((time) => (
                                            <div key={time} className="contents">
                                                <div className="pl-2 pt-3 font-mono text-[9px] text-[#78b9ad]">{time}</div>
                                                <div />
                                                <div />
                                                <div />
                                            </div>
                                        ))}

                                        <div className="hero-calendar-event" style={{ left: 68, top: 42, width: 146, height: 88 }}>Массаж · Анна</div>
                                        <div className="hero-calendar-event hero-calendar-event-muted" style={{ left: 223, top: 90, width: 146, height: 41 }}>Стрижка · Артём</div>
                                        <div className="hero-calendar-event hero-calendar-event-muted" style={{ left: 378, top: 42, width: 146, height: 41 }}>Маникюр</div>
                                        <div className="hero-calendar-event" style={{ left: 223, top: 138, width: 146, height: 88 }}>Окрашивание</div>
                                        <div className="hero-calendar-event" style={{ left: 68, top: 186, width: 146, height: 88 }}>SPA · Камила</div>
                                        <div className="hero-calendar-event" style={{ left: 378, top: 234, width: 146, height: 88 }}>Массаж · Лейла</div>
                                    </div>
                                </div>
                            </div>

                            <div className="hero-float-card hero-float-tool right-0 top-[42px] flex h-[64px] w-[288px] items-center gap-3 rounded-[16px] px-4">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#176c5e] text-[#49e2bf]">
                                    <Gift className="h-4 w-4" />
                                </span>
                                <span>
                                    <span className="block text-[9px] uppercase tracking-[0.08em] text-[#789991]">Инструмент</span>
                                    <span className="mt-0.5 block text-[14px] font-semibold text-[#e6f0ed]">Карта тела для массажистов</span>
                                </span>
                            </div>

                            <div className="hero-float-card hero-float-client bottom-[54px] left-0 h-[162px] w-[262px] rounded-[16px] p-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#216858] text-[15px] font-semibold text-[#4be3bd]">АК</span>
                                    <span>
                                        <span className="block text-[13px] font-semibold text-white">Анна К.</span>
                                        <span className="mt-0.5 block text-[10px] text-[#819f98]">+996 555 12-34-56</span>
                                    </span>
                                </div>
                                <div className="mt-3 border-t border-white/[0.035] pt-3 text-[11px] text-[#8caaa3]">
                                    <div className="flex justify-between"><span>Визитов</span><strong className="text-white">12</strong></div>
                                    <div className="mt-1.5 flex justify-between"><span>Последний</span><span>3 дня назад</span></div>
                                    <div className="mt-1.5 flex justify-between"><span>Любимая услуга</span><strong className="text-[#d9e7e3]">Массаж спины</strong></div>
                                </div>
                            </div>

                            <div className="hero-float-card hero-float-permissions bottom-0 right-[-8px] h-[198px] w-[272px] rounded-[16px] p-4">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1597d1] text-white">
                                        <ShieldCheck className="h-4 w-4" />
                                    </span>
                                    <span className="text-[13px] font-semibold text-[#e9f1ef]">Права сотрудников</span>
                                </div>
                                <div className="mt-3 rounded-[12px] bg-[#25443f] p-3 text-[10px] leading-[1.55] text-[#a8c0ba]">
                                    <strong className="block text-[11px] text-[#dce9e5]">Мастер · индивидуальные разрешения</strong>
                                    <span className="mt-1 block">Расписание: просмотр разрешён</span>
                                    <span className="block">Клиенты: доступ по роли</span>
                                </div>
                                <div className="mt-2 flex gap-2">
                                    <span className="flex h-7 flex-1 items-center justify-center rounded-full bg-[#236756] text-[9px] font-semibold text-[#4adbb9]">Наследовать</span>
                                    <span className="flex h-7 flex-1 items-center justify-center rounded-full border border-[#90aaa5]/20 text-[9px] font-semibold text-[#b9cbc7]">Разрешить</span>
                                    <span className="flex h-7 flex-1 items-center justify-center rounded-full border border-[#90aaa5]/20 text-[9px] font-semibold text-[#b9cbc7]">Запретить</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </section>

                <div className="lower-flow">
                <section id="business" className="landing-section soft-section scroll-mt-28 px-4 pb-24 pt-20 sm:pt-24">
                    <div className="relative z-10 mx-auto max-w-[1120px]">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#28e0c2]/76">Для бизнеса</p>
                        <h2 className="mt-4 max-w-[740px] text-[34px] font-bold leading-tight text-[var(--hz-text-strong)] sm:text-[44px]">
                            Что видит владелец салона
                        </h2>
                        <p className="mt-4 max-w-[660px] text-base leading-7 text-[var(--hz-muted)]">
                            Один экран — и понятно, что происходит сегодня, кто пришёл, кто записан и сколько заработали мастера.
                        </p>

                        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {ownerFeatures.map((feature) => {
                                const Icon = feature.icon;

                                return (
                                    <article key={feature.title} className="haze-card min-h-[180px] rounded-[14px] border border-white/[0.08] bg-[#102824]/72 p-6 backdrop-blur">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#1b5548] text-[#4be1bc]">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <h3 className="mt-5 text-[16px] font-semibold text-[var(--hz-text-strong)]">{feature.title}</h3>
                                        <p className="mt-3 text-[13px] leading-6 text-[var(--hz-muted)]">{feature.text}</p>
                                    </article>
                                );
                            })}
                        </div>

                        <div id="pricing" className="scroll-mt-28 mt-24 border-t border-white/[0.06] pt-20">
                            <h2 className="max-w-[620px] text-[34px] font-bold leading-[1.05] text-[var(--hz-text-strong)] sm:text-[44px]">
                                Простые тарифы без оплаты за каждого мастера
                            </h2>
                            <p className="mt-4 max-w-[680px] text-base leading-7 text-[var(--hz-muted)]">
                                Фиксированная цена за салон. Сколько мастеров — столько и работайте.
                            </p>

                            <div className="mt-10 grid gap-4 lg:grid-cols-3">
                                {plans.map((plan) => (
                                    <article
                                        key={plan.name}
                                        className={`haze-card relative flex min-h-[330px] flex-col rounded-[18px] border p-6 backdrop-blur ${
                                            plan.featured
                                                ? "border-[#45dfb9]/60 bg-[#123129]/88 shadow-[0_28px_80px_rgba(34,217,172,0.14)]"
                                                : "border-white/[0.08] bg-[#0b211e]/76"
                                        }`}
                                    >
                                        {plan.badge && (
                                            <span className="absolute -top-3 left-6 rounded-full bg-[#45dfb9] px-3 py-1 text-[10px] font-semibold text-[#073229]">
                                                {plan.badge}
                                            </span>
                                        )}

                                        <h3 className="text-[19px] font-semibold text-white">{plan.name}</h3>
                                        <p className="mt-1 min-h-10 text-[12px] leading-5 text-[var(--hz-muted)]">{plan.description}</p>

                                        <div className="mt-4 flex items-end gap-1.5">
                                            <span className="text-[34px] font-semibold leading-none tracking-tight text-white">{plan.price}</span>
                                            <span className="pb-1 text-[12px] text-[var(--hz-muted)]">сом / мес</span>
                                        </div>

                                        <div className="mt-6 space-y-3">
                                            {plan.features.map((feature) => (
                                                <div key={feature} className="flex items-center gap-2 text-[12px] text-[#d4e3df]">
                                                    <Check className="h-4 w-4 shrink-0 text-[#45dfb9]" />
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            disabled
                                            className={`mt-auto flex h-11 cursor-not-allowed items-center justify-center rounded-[10px] border text-[12px] font-semibold ${
                                                plan.featured
                                                    ? "border-[#45dfb9]/20 bg-[#45dfb9]/18 text-[#7ce9ce]"
                                                    : "border-white/[0.06] bg-white/[0.05] text-[#91aaa4]"
                                            }`}
                                        >
                                            Подключение скоро
                                        </button>
                                    </article>
                                ))}
                            </div>

                            <div className="relative mt-12 overflow-hidden rounded-[22px] border border-[#45dfb9]/60 bg-[#0d2926]/92 px-6 py-14 text-center shadow-[0_0_70px_rgba(38,224,194,0.18),inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-12 sm:py-16">
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(53,226,185,0.28),transparent_34%),radial-gradient(circle_at_76%_86%,rgba(26,155,128,0.2),transparent_36%),linear-gradient(130deg,rgba(50,225,183,0.12),transparent_48%)]" />
                                <div className="pointer-events-none absolute -left-20 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-[#28e0c2]/20 blur-[70px]" />
                                <div className="pointer-events-none absolute -right-16 bottom-0 h-44 w-44 rounded-full bg-[#28e0c2]/16 blur-[64px]" />

                                <div className="relative z-10 mx-auto max-w-[720px]">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4be7c6]">
                                        Пилотная программа
                                    </span>
                                    <h3 className="mt-4 text-[32px] font-bold leading-[1.08] text-white sm:text-[42px]">
                                        6 месяцев бесплатно — в обмен на обратную связь
                                    </h3>
                                    <p className="mx-auto mt-5 max-w-[620px] text-[14px] leading-6 text-[#c1d7d1]">
                                        Подключаем первые салоны бесплатно. Помогаем настроить систему и развиваем продукт вместе с вами.
                                    </p>
                                    <a
                                        href="https://t.me/hahazencrm"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="hero-button-primary relative mx-auto mt-7 flex h-12 w-fit items-center justify-center overflow-hidden rounded-full bg-[#46e8c4] px-7 text-[13px] font-semibold text-[#073229] shadow-[0_0_34px_rgba(70,232,196,0.3)] transition hover:bg-[#70f3d6]"
                                    >
                                        <span className="relative z-10">Стать пилотным салоном</span>
                                        <span className="absolute inset-y-0 left-0 w-10 bg-white/35 blur-md" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="landing-section soft-section px-4 py-24">
                    <div className="relative z-10 mx-auto max-w-[1120px]">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#28e0c2]/76">Каталог</p>
                                <h2 className="mt-4 text-[34px] font-bold leading-tight text-[var(--hz-text-strong)] sm:text-[44px]">
                                    Каталог салонов
                                </h2>
                                <p className="mt-3 max-w-[650px] text-[14px] leading-6 text-[var(--hz-muted)]">
                                    Мы только запускаемся, поэтому показываем честно: пилотные партнёры и демо-карточки. Скоро здесь появятся реальные салоны вашего города.
                                </p>
                            </div>
                            <a
                                href="https://t.me/hahazencrm"
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 text-[13px] font-semibold text-[#45dfb9] transition hover:text-[#72f0d2]"
                            >
                                Стать партнёром →
                            </a>
                        </div>

                        <div className="mt-9 grid gap-4 lg:grid-cols-3">
                            {partnerSalons.map((salon) => (
                                <article key={salon.name} className="haze-card overflow-hidden rounded-[16px] border border-white/[0.08] bg-[#0c221f]/82">
                                    <div className="relative h-[150px]" style={{ background: salon.visual }}>
                                        <span className="absolute left-3 top-3 rounded-full border border-[#45dfb9]/32 bg-[#16483d]/88 px-3 py-1 text-[9px] font-medium text-[#5ce5c3]">
                                            {salon.label}
                                        </span>
                                        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-[#09201c]/80 px-2.5 py-1 text-[10px] font-semibold text-[#cce0db]">
                                            <Star className="h-3 w-3 fill-[#45dfb9] text-[#45dfb9]" />
                                            {salon.rating}
                                        </span>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-[16px] font-semibold text-white">{salon.name}</h3>
                                        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#91aaa4]">
                                            <MapPin className="h-3.5 w-3.5 text-[#45dfb9]" />
                                            {salon.location}
                                        </p>
                                        <p className="mt-4 text-[12px] text-[#9fc2ba]">{salon.services}</p>
                                    </div>
                                </article>
                            ))}

                            <article className="haze-card group overflow-hidden rounded-[16px] border border-dashed border-[#45dfb9]/32 bg-[#0c221f]/64 transition hover:border-[#45dfb9]/60">
                                <div className="relative flex h-[150px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(69,223,185,0.16),transparent_50%),linear-gradient(135deg,rgba(31,78,67,0.55),rgba(12,34,31,0.78))]">
                                    <span className="rounded-full border border-[#45dfb9]/28 bg-[#0c2823]/84 px-3 py-1 text-[9px] font-medium text-[#62dfc1]">
                                        Скоро в каталоге
                                    </span>
                                </div>
                                <div className="p-5">
                                    <h3 className="text-[16px] font-semibold text-white">Ваш салон может быть здесь</h3>
                                    <p className="mt-2 text-[11px] leading-5 text-[#91aaa4]">
                                        Подключитесь к Hahazen и получите карточку салона для онлайн-записи клиентов.
                                    </p>
                                    <a
                                        href="https://t.me/hahazencrm"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-4 inline-flex text-[12px] font-semibold text-[#45dfb9] transition group-hover:text-[#72f0d2]"
                                    >
                                        Стать партнёром →
                                    </a>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>

                <section id="legend" className="landing-section legend-section scroll-mt-28 px-4 py-24">
                    <div className="legend-showcase relative z-10 mx-auto max-w-[1120px]">
                        <div className="legend-showcase-image">
                            <div className="relative h-full w-full">
                                <Image
                                    src="/legend.png"
                                    alt="Леди — спаниель и символ Hahazen"
                                    fill
                                    sizes="(max-width: 768px) 120vw, 700px"
                                    className="object-cover"
                                    priority={false}
                                />
                            </div>
                        </div>

                        <div className="relative z-10 max-w-[570px] px-7 py-12 sm:px-12 sm:py-14">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#45e4be]">Легенда Hahazen</p>
                            <h2 className="mt-5 text-[38px] font-bold leading-[1.02] text-[var(--hz-text-strong)] sm:text-[52px]">
                                Хаос превращается
                                <span className="block text-[#49e3bd]">в улыбку</span>
                            </h2>

                            <p className="mt-6 max-w-[460px] text-[14px] leading-7 text-[#abc7c0]">
                                Hahazen появился из простой мысли: порядок в салоне должен ощущаться не как контроль, а как забота. Спокойное расписание, довольные мастера и клиенты — это и есть радость в порядке.
                            </p>

                            <div className="mt-7 flex flex-wrap gap-2">
                                <span className="rounded-full border border-[#45dfb9]/22 bg-[#45dfb9]/8 px-3 py-1.5 text-[10px] font-medium text-[#75dfc6]">Ha-ha · радость</span>
                                <span className="rounded-full border border-[#45dfb9]/22 bg-[#45dfb9]/8 px-3 py-1.5 text-[10px] font-medium text-[#75dfc6]">Zen · спокойствие</span>
                                <span className="rounded-full border border-[#45dfb9]/22 bg-[#45dfb9]/8 px-3 py-1.5 text-[10px] font-medium text-[#75dfc6]">Леди · забота</span>
                            </div>
                        </div>
                    </div>
                </section>
                </div>
            </main>

            <footer id="contacts" className="relative scroll-mt-28 bg-transparent px-4 py-14">
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

                    <div className="flex flex-col gap-2 text-sm md:items-center md:text-center">
                        <a href="mailto:info@hahazen.com" className="transition hover:text-[var(--hz-text-strong)]">
                            info@hahazen.com
                        </a>
                        <a
                            href="https://t.me/hahazencrm"
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-[#45dfb9] transition hover:text-[#72f0d2]"
                        >
                            Telegram · @hahazencrm
                        </a>
                    </div>

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
