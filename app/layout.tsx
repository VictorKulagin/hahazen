import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";


const workSans = localFont({
  src: [
    { path: "./fonts/WorkSans-Black.ttf", weight: "900", style: "normal" },
    { path: "./fonts/WorkSans-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "./fonts/WorkSans-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/WorkSans-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/WorkSans-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/WorkSans-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/WorkSans-Thin.ttf", weight: "200", style: "normal" },
    { path: "./fonts/WorkSans-ExtraLight.ttf", weight: "100", style: "normal" },
  ],
  variable: "--font-work-sans",
});

export const metadata: Metadata = {
    title: "HahaZen — CRM для массажных и бьюти-салонов",
    description:
        "HahaZen — простая и мощная CRM-система для управления массажными и бьюти-салонами. Онлайн-запись, управление клиентами, автоматизация бизнеса.",
    keywords: [
        "CRM для массажного салона",
        "CRM для бьюти-салона",
        "CRM для салона красоты",
        "запись клиентов онлайн",
        "управление салоном",
        "автоматизация услуг",
        "HahaZen CRM",
        "расписание мастеров",
        "CRM для косметолога",
        "программа для салона"
    ],
    authors: [{ name: "HahaZen Team Victor / Boris / Jamal", url: "https://hahazen.com" }],
    metadataBase: new URL("https://hahazen.com"),
    openGraph: {
        title: "HahaZen — CRM для массажных и бьюти-салонов",
        description:
            "Упрощайте запись клиентов, следите за расписанием мастеров и развивайте бизнес с удобной и современной CRM от HahaZen.",
        url: "https://hahazen.com",
        siteName: "HahaZen",
        locale: "ru_RU",
        type: "website",
        images: [
            {
                url: "https://hahazen.com/og-image.jpg",
                width: 1200,
                height: 630,
                alt: "HahaZen — CRM для массажных и бьюти-салонов",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "HahaZen — CRM для массажных и бьюти-салонов",
        description:
            "Автоматизируйте ваш массажный или бьюти-салон с помощью HahaZen — простой CRM с онлайн-записью и управлением клиентами.",
        images: ["https://hahazen.com/og-image.jpg"],
    },
};

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en">
      <body className={`${workSans.variable} flex flex-col min-h-screen`}>

      <main className="flex-grow">{children}</main>

      </body>
      </html>
  );
}
