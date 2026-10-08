import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Реквизиты Hahazen — ИП Кулагин Виктор Викторович",
    description:
        "Официальные сведения об операторе сервиса Hahazen: ИП Кулагин Виктор Викторович, ИНН, регистрационный номер, адрес и контакты.",
    alternates: {
        canonical: "https://hahazen.com/requisites",
    },
    robots: {
        index: true,
        follow: true,
    },
};

const legalDetails = [
    ["Бренд и сервис", "Hahazen"],
    ["Зарегистрированное наименование", "Кулагин Виктор Викторович"],
    ["Статус", "Индивидуальный предприниматель"],
    ["ИНН", "20805198850058"],
    ["Регистрационный номер", "002-2026-169-4262"],
    [
        "Адрес регистрации",
        "Кыргызская Республика, г. Бишкек, Ленинский район, ул. Уметалиева, д. 81, кв. 30",
    ],
    ["Почтовый индекс", "720001"],
] as const;

const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hahazen",
    legalName: "Индивидуальный предприниматель Кулагин Виктор Викторович",
    url: "https://hahazen.com",
    taxID: "20805198850058",
    telephone: "+996880377888",
    email: "noreply@hahazen.com",
    address: {
        "@type": "PostalAddress",
        streetAddress: "ул. Уметалиева, д. 81, кв. 30",
        addressLocality: "Бишкек",
        addressRegion: "Ленинский район",
        postalCode: "720001",
        addressCountry: "KG",
    },
};

export default function RequisitesPage() {
    return (
        <main className="min-h-screen bg-[#031215] text-[#e9f8f4]">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
            />

            <header className="border-b border-[#70efd0]/15 bg-[#041619]/95 px-5 py-4">
                <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
                    <Link href="/" className="text-xl font-bold tracking-wide text-[#70efd0]">
                        Hahazen
                    </Link>
                    <Link
                        href="/"
                        className="rounded-lg border border-[#70efd0]/25 px-4 py-2 text-sm text-[#b8d7d0] transition hover:border-[#70efd0]/55 hover:text-white"
                    >
                        На главную
                    </Link>
                </div>
            </header>

            <section className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#70efd0]">
                    Официальные сведения
                </p>
                <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    Реквизиты Hahazen
                </h1>
                <p className="mt-6 max-w-3xl text-base leading-7 text-[#b8d7d0] sm:text-lg">
                    Hahazen — программный сервис для управления салонами и сервисным бизнесом.
                    Оператором сайта hahazen.com и сервиса Hahazen является индивидуальный
                    предприниматель Кулагин Виктор Викторович.
                </p>

                <div className="mt-10 overflow-hidden rounded-2xl border border-[#70efd0]/15 bg-[#082024]">
                    <dl className="divide-y divide-[#70efd0]/10">
                        {legalDetails.map(([label, value]) => (
                            <div
                                key={label}
                                className="grid gap-2 px-5 py-5 sm:grid-cols-[230px_1fr] sm:gap-8 sm:px-7"
                            >
                                <dt className="text-sm font-medium text-[#83b8ad]">{label}</dt>
                                <dd className="text-sm leading-6 text-white sm:text-base">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <section className="mt-8 rounded-2xl border border-[#70efd0]/20 bg-[#70efd0]/[0.06] p-6 sm:p-8">
                    <h2 className="text-xl font-semibold text-white">Связь бренда и юридического лица</h2>
                    <p className="mt-3 leading-7 text-[#b8d7d0]">
                        Наименование Hahazen используется как коммерческое обозначение программного
                        сервиса, оператором которого является ИП Кулагин Виктор Викторович.
                    </p>
                </section>

                <section className="mt-10">
                    <h2 className="text-2xl font-semibold text-white">Контакты</h2>
                    <div className="mt-4 flex flex-col gap-3 text-[#b8d7d0] sm:flex-row sm:flex-wrap sm:gap-6">
                        <a className="hover:text-[#70efd0] hover:underline" href="mailto:noreply@hahazen.com">
                            noreply@hahazen.com
                        </a>
                        <a className="hover:text-[#70efd0] hover:underline" href="tel:+996880377888">
                            +996 880 377 888
                        </a>
                        <a
                            className="hover:text-[#70efd0] hover:underline"
                            href="https://hahazen.com"
                        >
                            hahazen.com
                        </a>
                    </div>
                </section>

                <div className="mt-12 border-t border-[#70efd0]/15 pt-8">
                    <a
                        href="/legal/public-offer-2026-07-30.pdf"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-lg bg-[#28e0c2] px-5 py-3 text-sm font-semibold text-[#062326] transition hover:bg-[#58f4d8]"
                    >
                        Открыть публичную оферту
                    </a>
                </div>
            </section>

            <footer className="border-t border-[#70efd0]/10 px-5 py-8 text-center text-xs leading-5 text-[#83b8ad]">
                Hahazen · Индивидуальный предприниматель Кулагин Виктор Викторович · ИНН 20805198850058
            </footer>
        </main>
    );
}
