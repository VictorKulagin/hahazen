import React, { useState } from 'react';

const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface CustomCalendarProps {
    year: number;
    month: number; // 1-12
    daysWithAppointments: number[];
    onDateSelect?: (date: Date) => void;
    onPrevMonth?: () => void;
    onNextMonth?: () => void;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
                                                           year,
                                                           month,
                                                           daysWithAppointments,
                                                           onDateSelect,
                                                           onPrevMonth,
                                                           onNextMonth,
                                                       }) => {
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    /*const [year, setYear] = useState(initialYear);
    const [month, setMonth] = useState(initialMonth); // 1-12
    const [selectedDay, setSelectedDay] = useState<number | null>(null);*/

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayWeek = new Date(year, month - 1, 1).getDay();
    const shift = firstDayWeek === 0 ? 6 : firstDayWeek - 1;

    const calendarCells = [];
    for (let i = 0; i < shift; i++) calendarCells.push(null);
    for (let day = 1; day <= daysInMonth; day++) calendarCells.push(day);

    const handleDayClick = (day: number | null) => {
        if (!day) return;
        setSelectedDay(day);
        onDateSelect?.(new Date(year, month - 1, day));
    };


    /*const prevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
        setSelectedDay(null);
    };

    const nextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
        setSelectedDay(null);
    };*/

    return (
        <div style={{ width: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <button onClick={onPrevMonth}>← Назад</button>
                <div>
                    {year} - {month.toString().padStart(2, '0')}
                </div>
                <button onClick={onNextMonth}>Вперёд →</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {DAYS_OF_WEEK.map((d) => (
                    <div key={d} style={{ width: 40, textAlign: 'center', fontWeight: 'bold' }}>
                        {d}
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {calendarCells.map((day, idx) => {
                    const isHighlighted = day !== null && daysWithAppointments.includes(day);
                    const isSelected = day === selectedDay;
                    return (
                        <div
                            key={idx}
                            onClick={() => handleDayClick(day)}
                            style={{
                                width: 40,
                                height: 40,
                                lineHeight: '40px',
                                textAlign: 'center',
                                margin: 1,
                                cursor: day ? 'pointer' : 'default',
                                backgroundColor: isSelected ? '#2563eb' : isHighlighted ? '#93c5fd' : 'transparent',
                                borderRadius: isSelected ? '50%' : '0',
                                color: isSelected ? 'white' : 'black',
                                userSelect: 'none',
                            }}
                        >
                            {day || ''}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CustomCalendar;
