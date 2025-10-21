// components/Calendar/utils.ts
import {DurationOption} from "@/hooks/useAppointments";
import {durationToDays} from "@/components/Calendar/durationToDays";

export const add30Minutes = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes + 30);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};


/**ВУ С понидельника**/
/*export const generateWeekDates = (
    baseDate: Date,
    duration: DurationOption = 'week'
): string[] => {
    const daysCount = {
        '1-day': 1,
        '2-days': 2,
        '3-days': 3,
        '4-days': 4,
        '5-days': 5,
        '6-days': 6,
        'week': 7
    }[duration];

    const startDate = new Date(baseDate);
    startDate.setHours(0, 0, 0, 0); // Нормализуем время

    // Для всех длительностей кроме недели начинаем с текущей даты
    if (duration !== 'week') {
        return Array.from({ length: daysCount }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            return date.toISOString().split('T')[0];
        });
    }

    // Для недели вычисляем понедельник
    const dayOfWeek = startDate.getDay();
    const monday = new Date(startDate);
    monday.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        return date.toISOString().split('T')[0];
    });
};*/


/*export const generateWeekDates = (
    baseDate: Date,
    duration: DurationOption
): string[] => {
    const startDate = new Date(baseDate);
    const daysCount = durationToDays(duration);

    // Сбрасываем время для точности
    startDate.setHours(0, 0, 0, 0);

    return Array.from({ length: daysCount }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return date.toISOString().split('T')[0];
    });
};*/


export const generateWeekDates = (
    baseDate: Date,
    duration: DurationOption
): string[] => {
    const daysCount = durationToDays(duration);
    const startDate = new Date(baseDate);
    startDate.setHours(0,0,0,0);

    return Array.from({ length: daysCount }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return date.toLocaleDateString('en-CA'); // '2025-04-03'
    });
};
/* Разбиение времени до получаса */
/*export const generateTimeSlots = () => {
    return Array.from({length: 48}, (_, i) => {
        const hours = Math.floor(i / 2);
        const minutes = (i % 2) * 30;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    });
};*/

// Обновленная функция generateTimeSlots
export const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
        // Добавляем только целые часы
        slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return slots;
};




export const getWeekRange = (startDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `
        ${start.toLocaleDateString('en-US', {day: 'numeric'})} -
        ${end.toLocaleDateString('en-US', {day: 'numeric', month: 'short'})}
    `;
};


// Функция для прибавления минут к времени в формате HH:MM
/*export function addMinutes(time: string, minutesToAdd: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutesToAdd;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${newH.toString().padStart(2,'0')}:${newM.toString().padStart(2,'0')}`;
}

// Функция для расчёта длительности в минутах
export function calculateDuration(start: string, end: string): number {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
}*/

// Прибавляем минуты к времени (без ограничений на сутки)
export function addMinutes(time: string, minutesToAdd: number): string {
    const [h, m] = time.split(':').map(Number);
    let totalMinutes = h * 60 + m + minutesToAdd;

    // поддержка любых значений, даже >24ч
    if (totalMinutes < 0) totalMinutes = 0;

    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${newH.toString().padStart(2,'0')}:${newM.toString().padStart(2,'0')}`;
}

// Считаем длительность (поддержка "через полночь")
/*export function calculateDuration(start: string, end: string): number {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    let startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;

    if (endTotal < startTotal) {
        // значит, событие пересекает полночь → добавляем сутки
        endTotal += 24 * 60;
    }

    return endTotal - startTotal;
}*/


export function calculateDuration(start: string, end: string): number {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    let startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;

    if (endTotal < startTotal) {
        // Event spans over midnight, add 24 hours to endTotal
        endTotal += 24 * 60;
    }

    return endTotal - startTotal; // duration in minutes
}
