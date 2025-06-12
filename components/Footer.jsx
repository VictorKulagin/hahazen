
"use client";

import { motion } from "framer-motion";
const Footer = () => (
    <motion.footer
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-green-600 via-green-500 to-green-400 text-white py-8 px-5 mt-0"
    >
    <footer className="bg-gradient-to-r from-green-600 via-green-500 to-green-400 text-white py-8 px-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
                <h3 className="font-bold text-xl mb-2">Hahazen</h3>
                <p className="text-green-100 max-w-sm">
                    CRM-система для массажных и бьюти-салонов. Автоматизация рутины и улучшение сервиса.
                </p>
            </div>
            <div className="flex space-x-6 text-green-100">
                {/* иконки соцсетей */}
                <a href="#"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3L3 10.5l6.5 2.5 1.5 6.5L21 3z" /></svg></a>
                <a href="#"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2C4.8 2 3 3.8 3 6v12c0 2.2 1.8 4 4 4h10c2.2 0 4-1.8 4-4V6c0-2.2-1.8-4-4-4H7zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm4.5-1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" /></svg></a>
            </div>
        </div>
        <p className="mt-6 text-center text-green-100 text-sm">
            &copy; {new Date().getFullYear()} Hahazen. Все права защищены.
        </p>
    </footer>
    </motion.footer>
);

export default Footer;


