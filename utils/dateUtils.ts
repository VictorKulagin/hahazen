// utils/dateUtils.ts
export const generateDates = (startDate: Date, days: number): string[] => {
    return Array.from({ length: days }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        return date.toISOString().split('T')[0];
    });
};

export const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
};
