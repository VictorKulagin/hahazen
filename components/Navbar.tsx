'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white px-5 py-3 shadow-lg">
            <nav className="max-w-7xl mx-auto flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3">
                    <Image src="/logo.png" width={100} height={21} alt="logo" />
                    <span className="text-lg font-bold hidden md:block tracking-[2px]">Hahazen</span>
                </Link>

                <div className="hidden md:flex gap-6 items-center">
                    <Link href="/about" className="hover:text-gray-200 transition">О нас</Link>
                    <Link href="/benefits" className="hover:text-gray-200 transition">Преимущества</Link>
                    <Link href="/contacts" className="hover:text-gray-200 transition">Контакты</Link>
                    <Link href="/signin">
                        <button className="bg-white text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition">Логин</button>
                    </Link>
                </div>

                <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </nav>

            {menuOpen && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="md:hidden bg-white text-gray-900 mt-2 p-4 rounded shadow-lg space-y-2"
                    >
                <div className="md:hidden bg-white text-gray-900 mt-2 p-4 rounded shadow-lg space-y-2">
                    <Link href="/about" onClick={() => setMenuOpen(false)} className="block hover:bg-green-100 rounded px-2 py-1">О нас</Link>
                    <Link href="/benefits" onClick={() => setMenuOpen(false)} className="block hover:bg-green-100 rounded px-2 py-1">Преимущества</Link>
                    <Link href="/contacts" onClick={() => setMenuOpen(false)} className="block hover:bg-green-100 rounded px-2 py-1">Контакты</Link>
                    <Link href="/signin" onClick={() => setMenuOpen(false)}>
                        <button className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">Логин</button>
                    </Link>
                </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </header>
    );
};

export default Navbar;
