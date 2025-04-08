'use client'; // Эта директива сообщает Next.js, что компонент клиентский
import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Accordion from '../../components/Accordion';


type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];



export default function Home() {

    // Получаем текущую дату и добавляем месяц
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1); // Устанавливаем месяц вперед

    // Стейт для хранения выбранного диапазона дат
    const [selectedDates, setSelectedDates] = useState<[Date | null, Date | null]>([null, null]);

    // Обработчик изменения дат
    const handleDateChange = (dates: [Date | null, Date | null]) => {
        setSelectedDates(dates);  // Сохраняем выбранный диапазон дат
    };


    const employees = [
        { id: 1, name: 'Иван Иванов', position: 'Менеджер' },
        { id: 2, name: 'Петр Петров', position: 'Разработчик' },
        { id: 3, name: 'Анна Смирнова', position: 'Дизайнер' },
    ];

    const сlients = [
        { id: 1, name: 'Сергей Сергеев', position: 'Менеджер' },
        { id: 2, name: 'Михаил Михайлов', position: 'Разработчик' },
        { id: 3, name: 'Ксения К', position: 'Дизайнер' },
    ];

    return (
        <div className="grid grid-cols-1 h-screen md:grid-cols-12">
            <div className="bg-darkBlue col-span-1 md:col-span-1 p-4">
                <div className="bg-red-200 p-2 flex items-center">
                    <img
                        src="https://example.com/image.jpg"
                        alt="Описание картинки"
                        className="w-8 h-8 rounded-full border-2 border-blue-500"
                    />
                    <p className="ml-2">HahaZen</p>
                </div>
                <div className="bg-orange-200 p-2">
                    <div>
                        <Calendar
                            onChange={handleDateChange}        // Обработчик изменения даты
                            selectRange={true}                 // Включаем выбор диапазона
                            value={selectedDates}             // Передаем выбранные даты
                            minDate={new Date()}              // Устанавливаем минимальную дату (например, сегодня)
                            maxDate={new Date(maxDate)}  // Устанавливаем максимальную дату (например, конец 2024 года)
                        />

                        <div>
                            <p>Начальная дата: {selectedDates[0] ? selectedDates[0].toDateString() : 'Не выбрана'}</p>
                            <p>Конечная дата: {selectedDates[1] ? selectedDates[1].toDateString() : 'Не выбрана'}</p>
                        </div>
                    </div>

                </div>
                <div className="bg-yellow-200 p-2">
                    <Accordion title="Сотрудники" content={employees} />
                </div>
                <div className="bg-green-200 p-2">
                    <Accordion title="Клиенты" content={сlients} />
                </div>
                <div className="bg-blue-200 p-2">
                    <p>Онлайн-запись</p>
                </div>
                <div className="bg-blue-200 p-2">
                    <p>Настройки</p>
                </div>
                <div className="bg-purple-200 p-2 flex items-center justify-between">
                    <div className="flex flex-col">
                        <p>Имя</p>
                        <p>test@test.com</p>
                    </div>
                    <div className="icon">
                        {/* Здесь можно разместить иконку, например, с использованием Font Awesome или другой библиотеки */}
                        <i className="fas fa-star">*</i> {/* Пример с иконкой звездочки */}
                    </div>
                </div>
            </div>
            <div className="bg-backgroundBlue col-span-1 md:col-span-11 p-4">
                <p>Правая колонка (92% экрана)</p>
            </div>
        </div>
    );
}
