'use client'; // Указывает на использование клиентского рендеринга

import Head from 'next/head';
import Nav from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useEffect, useState } from 'react';

export default function Benefits() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <>
            <Head>
                <title>Преимущества — CRM для массажных и бьюти-салонов</title>
                <meta
                    name="description"
                    content="Гибкое расписание, быстрый ввод клиентов, поддержка расширений и простой интерфейс — всё для удобства вашего салона."
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
                        ⭐ Преимущества
                    </h1>
                    <ul className="list-disc list-inside space-y-4 text-lg text-gray-200 max-w-prose mx-auto">
                        <li>Гибкое расписание и удобный календарь</li>
                        <li>Быстрое добавление клиентов и сотрудников</li>
                        <li>Поддержка расширений и Web3 в будущем</li>
                        <li>Простота интерфейса даже на телефоне</li>
                    </ul>
                </section>
            </main>
            <Footer />
        </>
    );
}
