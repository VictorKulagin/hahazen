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
    /*const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;*/
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


export const formatDateTimeISO = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date.replace(" ", "T")) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${mins}`;
};
