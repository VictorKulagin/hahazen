// utils/date.ts

/**
 * Форматирует дату в строку YYYY-MM-DD
 * по локальному времени пользователя (без UTC-сдвига).
 */
export const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

/**
 * Форматирует время в строку HH:MM
 * по локальному времени пользователя.
 */
export const formatTimeLocal = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};
