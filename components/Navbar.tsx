'use client'; // Указывает, что компонент рендерится на клиенте

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
        <header className="px-5 py-3 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 shadow-lg font-sans text-white">
            <nav className="flex space-around items-center">
                {/* Логотип */}
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/logo.png"
                        width={100}
                        height={21}
                        alt="logo"
                        className="hover:scale-105 transition-transform duration-300"
                    />
                    <span className="text-lg font-bold hidden md:block tracking-[2px] mr-4 lg:mr-8">
                        Hahazen
                    </span>
                </Link>

                {/* Блок кнопок */}
                <div className="hidden md:flex items-center gap-5">
                    <Link href="/about" className="hover:text-gray-200 transition-all duration-300">
                        О нас
                    </Link>
                    <Link href="/features" className="hover:text-gray-200 transition-all duration-300">
                        Преимущества
                    </Link>
                    <Link href="/contact" className="hover:text-gray-200 transition-all duration-300">
                        Контакты
                    </Link>
                    <Link href="/signin">
                    <button
                        type="button"
                        className="px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-200 transition-all duration-300"
                    >
                        Логин
                    </button>
                </Link>
                </div>

                {/* Гамбургер меню */}
                <div className="md:hidden">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-white focus:outline-none"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h16M4 18h16"
                            ></path>
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Мобильное меню */}
            {menuOpen && (
                <div className="flex flex-col items-start mt-3 md:hidden space-y-2">
                    <Link
                        href="/about"
                        className="hover:bg-gray-100 px-4 py-2 rounded-md transition-all duration-300 w-full"
                    >
                        О нас
                    </Link>
                    <Link
                        href="/features"
                        className="hover:bg-gray-100 px-4 py-2 rounded-md transition-all duration-300 w-full"
                    >
                        Преимущества
                    </Link>
                    <Link
                        href="/contact"
                        className="hover:bg-gray-100 px-4 py-2 rounded-md transition-all duration-300 w-full"
                    >
                        Контакты
                    </Link>
                    <Link href="/signin" className="w-full">
                        <button
                            type="button"
                            onClick={() => setMenuOpen(false)}
                            className="w-full px-4 py-2 bg-gray-50 text-gray-900 rounded-md border hover:bg-gray-100 shadow-sm transition-all duration-300"
                        >
                            Логин
                        </button>
                    </Link>
                </div>
            )}
        </header>
            {/* Локальные стили */}
            <style jsx>{`
              
              body {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                color: var(--dark-gray);
                background-color: var(--gray);
              }

              header {
                background: linear-gradient(to right, var(--primary-green), var(--secondary-green));
                color: var(--white);
                padding: 50px 10px;
                text-align: center;
              }

              header h1 {
                font-size: 3rem;
                margin: 0;
                font-weight: bold;
              }

              header p {
                font-size: 1.2rem;
                margin-top: 10px;
              }

              nav {
                background: var(--dark-green);
                display: flex;
                justify-content: center;
                padding: 10px 0;
              }

              nav a {
                color: var(--white);
                text-decoration: none;
                margin: 0 15px;
                font-size: 1rem;
                font-weight: bold;
                transition: color 0.3s ease;
              }

              nav a:hover {
                color: var(--light-green);
              }

              .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
              }

              .section {
                margin: 40px 0;
                text-align: center;
              }

              .section h2 {
                color: var(--primary-green);
                font-size: 2.5rem;
              }

              .section p {
                font-size: 1.2rem;
                margin: 15px auto;
                line-height: 1.6;
                color: var(--dark-gray);
                max-width: 800px;
              }

              /* Карточки преимуществ */
              .features {
                display: flex;
                justify-content: center;
                gap: 20px;
                flex-wrap: wrap;
              }

              .feature-card {
                background: var(--white);
                border: 1px solid var(--light-green);
                border-radius: 10px;
                padding: 20px;
                width: 300px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
              }

              .feature-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
              }

              .feature-card h3 {
                color: var(--secondary-green);
                font-size: 1.5rem;
                margin-bottom: 10px;
              }

              .feature-card p {
                font-size: 1rem;
                line-height: 1.4;
                color: var(--dark-gray);
              }

              /* Футер */
              footer {
                background: var(--dark-green);
                color: var(--white);
                text-align: center;
                padding: 15px 10px;
                margin-top: 40px;
              }

              footer p {
                margin: 0;
                font-size: 0.9rem;
              }

            `}</style>
       </>
    );
};

export default Navbar;
