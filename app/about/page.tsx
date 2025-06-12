'use client'; // Указывает на использование клиентского рендеринга

import Head from 'next/head';
import Nav from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useEffect, useState } from 'react';

export default function About() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <>
            <Head>
                <title>О нас — CRM для массажных и бьюти-салонов</title>
                <meta
                    name="description"
                    content="Мы создаём CRM-систему для массажных и бьюти-салонов. Автоматизация рутины, удобство и надёжность."
                />
            </Head>
            <Nav />
            <main className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 flex justify-center items-center p-6">
                <section
                    className={`max-w-3xl bg-gray-800/70 backdrop-blur-md rounded-2xl p-10 shadow-xl transition-opacity duration-1000 ${
                        visible ? 'opacity-100' : 'opacity-0 translate-y-6'
                    }`}
                >
                    <h1 className="text-5xl font-extrabold mb-8 text-cyan-400 drop-shadow-md">
                        🧾 О нас
                    </h1>
                    <p className="text-lg leading-relaxed text-gray-200 max-w-prose mx-auto">
                        Мы создаём CRM-систему специально для массажных и бьюти-салонов. Наша цель — автоматизировать рутину и освободить ваше время для клиентов. Удобно. Надёжно. По делу.
                    </p>
                </section>
            </main>
            <Footer />
        </>
    );
}
