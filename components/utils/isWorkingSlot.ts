// components/utils/isWorkingSlot.ts
import { formatDateLocal } from "@/components/utils/date";
import type { EmployeeSchedule } from "@/services/еmployeeScheduleApi";

/**
 * Универсальная проверка: является ли указанный слот рабочим.
 * Поддерживает 2 формы ответа бэка:
 * 1) Дневные интервалы: { date: 'YYYY-MM-DD', start_time: 'HH:mm', end_time: 'HH:mm' }
 * 2) Недельный шаблон: { schedule_type: 'weekly', periods: [ ['mon','09:00','18:00'], ... ] }
 *
 * ВАЖНО: Функция получает ВСЕ графики (по всем сотрудникам) и сама фильтрует по employeeId.
 */
export function isWorkingSlot(
    employeeId: number,
    timeStr: string,            // 'HH:mm'
    selectedDate: Date,
    schedules: EmployeeSchedule[]
): boolean {
    const dayStr = formatDateLocal(selectedDate); // 'YYYY-MM-DD'
    const minutes = toMinutes(timeStr);
    console.log("▶️ isWorkingSlot:", { employeeId, timeStr, dayStr, schedules });
    // 1) Пробуем сначала «дневной» формат (explicit intervals)
    const daily = schedules.filter(
        (s: any) =>
            s.employee_id === employeeId &&
            s.date && s.start_time && s.end_time && s.date === dayStr
    );
    if (daily.length > 0) {
        return daily.some((s: any) => inRange(minutes, s.start_time, s.end_time));
    }

    // 2) Если дневных интервалов нет — поддержим weekly-шаблон
    const weekly = schedules.filter(
        (s: any) => s.employee_id === employeeId && s.schedule_type === "weekly" && Array.isArray(s.periods)
    );
    if (weekly.length > 0) {
        const dayKey = getWeekKey(selectedDate); // 'mon'..'sun'
        // periods: [ [ 'mon','09:00','18:00' ], ... ] и/или несколько интервалов в один день
        const dayIntervals = weekly.flatMap((s: any) =>
            (s.periods || []).filter((p: any) => p?.[0] === dayKey)
        );
        if (dayIntervals.length === 0) return false; // выходной
        return dayIntervals.some((p: any) => inRange(minutes, p[1], p[2]));
    }

    // 3) Если по сотруднику вообще нет записей — считаем нерабочим временем
    return false;
}

function toMinutes(hhmm: string): number {
    const [h, m] = (hhmm || "0:0").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
}

function inRange(min: number, start: string, end: string) {
    const s = toMinutes(start);
    const e = toMinutes(end);
    return min >= s && min < e;
}

// Mon..Sun -> 'mon'..'sun'
function getWeekKey(d: Date): "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun" {
    // getDay(): 0=Sunday..6=Saturday
    const idx = d.getDay();
    const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
    const key = map[idx];
    // нам нужна 'mon'..'sun'
    return key === "sun" ? "sun" : key;
}
