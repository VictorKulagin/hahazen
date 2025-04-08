'use client'; // Директива для Next.js, указывающая на клиентский рендеринг
import Link from "next/link";

export default function Home() {

    const currentYear = new Date().getFullYear();

    return (
        <>
            {/* Header */}
            <header className="bg-green-500 text-white text-center py-10 styles.header">
                <h1 className="text-4xl font-bold">Добро пожаловать в Hahazen</h1>
                <p className="text-lg mt-4">Место, где инновации и технологии создают будущее</p>
            </header>

            {/* Navigation */}
            <nav className="bg-gray-100 py-4 shadow-md sticky top-0 z-10">
                {/*<div className="container mx-auto flex justify-center gap-8 text-lg">
                    <a href="#about" className="text-gray-700 hover:text-green-500 transition">О нас</a>
                    <a href="#features" className="text-gray-700 hover:text-green-500 transition">Преимущества</a>
                    <a href="#contact" className="text-gray-700 hover:text-green-500 transition">Контакты</a>
                </div>*/}
            </nav>

            {/* Main content */}
            <main className="container mx-auto px-4 py-10">
                {/* О нас */}
                <section id="about" className="mb-16">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">О Hahazen</h2>
                    <p className="text-center text-gray-600 max-w-3xl mx-auto">
                        Мы стремимся создавать удобные, современные решения, которые меняют жизнь людей к лучшему.
                        Присоединяйтесь к нашему сообществу и вдохновляйтесь вместе с нами.
                    </p>
                </section>

                {/* Преимущества */}
                <section id="features" className="mb-16">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Наши преимущества</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
                            <h3 className="text-xl font-semibold text-green-500 mb-2">Инновации</h3>
                            <p className="text-gray-600">
                                Мы используем только передовые технологии, чтобы обеспечить максимальную производительность и удобство.
                            </p>
                        </div>
                        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
                            <h3 className="text-xl font-semibold text-green-500 mb-2">Доверие</h3>
                            <p className="text-gray-600">
                                Тысячи довольных клиентов по всему миру уже выбрали Hahazen. Мы всегда с вами.
                            </p>
                        </div>
                        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
                            <h3 className="text-xl font-semibold text-green-500 mb-2">Команда</h3>
                            <p className="text-gray-600">
                                Наши специалисты всегда готовы помочь вам достичь лучших результатов.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Контакты */}
                <section id="contact" className="mb-16">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Свяжитесь с нами</h2>
                    <p className="text-center text-gray-600">
                        Если у вас есть вопросы, напишите нам:{" "}
                        <a href="mailto:info@hahazen.com" className="text-green-500 hover:underline">
                            info@hahazen.com
                        </a>
                    </p>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white text-center py-4 fixed bottom-0 left-0 w-full">
                <p> &copy; {currentYear} Hahazen. Все права защищены.</p>
            </footer>
        </>
    );
}
