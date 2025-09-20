// components/utils/isWorkingSlot.ts
import { EmployeeSchedule } from "@/services/еmployeeScheduleApi";


/**
 * Проверяет, рабочий ли слот для данного сотрудника.
 * Поддерживает несколько интервалов в один день.
 *
 * @param employeeId ID сотрудника
 * @param time "HH:mm" – время слота
 * @param date Date – текущая дата
 * @param schedules массив графиков (для всех сотрудников)
 */
export function isWorkingSlot(
    employeeId: number,
    time: string,
    date: Date,
    schedules: EmployeeSchedule[]
): boolean {
    if (!schedules?.length) return true; // если нет данных — считаем рабочим

    // Находим график сотрудника
    const schedule = schedules.find(s => s.employee_id === employeeId);
    if (!schedule) return true; // нет графика — считаем рабочим

    // Определяем день недели
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();
    // en-US вернёт "mon", "tue", "wed" ... → приводим к формату API
    const dayMap: Record<string, string> = {
        sun: "sun",
        mon: "mon",
        tue: "tue",
        wed: "wed",
        thu: "thu",
        fri: "fri",
        sat: "sat",
    };
    const dayKey = dayMap[weekday] || "mon";

    // Фильтруем все интервалы для этого дня
    const dayPeriods = schedule.periods.filter(p => p[0] === dayKey);
    if (!dayPeriods.length) return false; // если вообще нет интервалов — день нерабочий

    // Проверяем, попадает ли время в один из интервалов
    return dayPeriods.some(period => {
        const [_, start, end] = period; // ["mon", "09:00", "12:00"]
        return time >= start && time < end;
    });
}

