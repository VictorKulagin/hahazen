// components/Calendar/Calendar.ts
"use client";
import React, {useState, useEffect, useRef, useCallback, useMemo} from "react";
import {AppointmentRequest} from "@/types/appointments";
import {useAppointments, DurationOption, useCreateAppointment, useUpdateAppointment} from "@/hooks/useAppointments";
import {usePathname, useSearchParams} from 'next/navigation';
import {useDeleteAppointment} from "@/hooks/useAppointments";
import { add30Minutes, generateWeekDates, generateTimeSlots, getWeekRange } from "./utils";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";
import { CalendarEvent } from "./CalendarEvent";
import { useEmployeeSchedules } from "@/hooks/useEmployeeSchedules";
import { useQueryClient } from '@tanstack/react-query';
import {useRouter} from "next/navigation";
import {WeekNavigator} from "@/components/Calendar/WeekNavigator";
import {durationToDays} from "@/components/Calendar/durationToDays";
import {useEmployeeServices, useServices} from "@/hooks/useServices";
import {EditEventModal} from "@/components/Calendar/EditEventModal";
import { validatePhone, validateName } from '@/components/Validations';
import Spinner from "@/components/Spinner";
import { useIsFetching } from '@tanstack/react-query';
import { useEmployeeId } from "@/hooks/useEmployeeId";

// Функции остаются те же
const convertTimeToMinutes = (time?: string | null): number => {
    if (!time || typeof time !== 'string') {
        console.warn('Invalid time input:', time);
        return 0;
    }

    const timeParts = time.split(':');
    if (timeParts.length !== 2) {
        console.error('Invalid time format, expected HH:mm:', time);
        return 0;
    }

    const [hours, minutes] = timeParts.map(Number);

    if (isNaN(hours) || hours < 0 || hours > 23) {
        console.error('Invalid hours:', hours);
        return 0;
    }

    if (isNaN(minutes) || minutes < 0 || minutes > 59) {
        console.error('Invalid minutes:', minutes);
        return 0;
    }

    return hours * 60 + minutes;
};


interface CalendarProps {
    branchId: number | null;
}
const Calendar: React.FC<CalendarProps> = ({ branchId }) => {






    const [selection, setSelection] = useState<{
        startMinutes: number | null;
        endMinutes: number | null;
    } | null>(null);

    const pxPerMinute = 1.5; // масштаб — 1 минута = 1.5px



    //const HOUR_HEIGHT = 60;



    /*function getSlotHeight(start: string, end: string) {
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);

        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        return ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
    }*/
    /*const isValidTime = (time: string): boolean => {
        return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
    };*/

    /*const isValidTimeFormat = (time: string): boolean => {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
    };*/

    // ПРОВЕРКА BRANCHID В НАЧАЛЕ (как в рабочем варианте)
    if (branchId === null) return <div>Выберите филиал</div>;

    const queryClient = useQueryClient();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    // ИСПОЛЬЗУЕМ REACT QUERY ДЛЯ EMPLOYEEID
    const { employeeId } = useEmployeeId();


    if (employeeId === null) {
        console.log('⏳ Waiting for employeeId...');
        return <div>Загрузка сотрудника...</div>;
    }


    // ОТЛАДКА
    console.log('🔍 Calendar: employeeId from useSelectedEmployee:', employeeId);
    console.log('🔍 Calendar: branchId:', branchId);


    interface ModalData {
        date: string;
        start: string;   // "HH:mm"
        end: string;     // "HH:mm"
        duration?: number; // добавляем длительность}
    }
    // Найдем что вызывает ререндеры

    // ВСЕ useState
    const [forceUpdateKey, setForceUpdateKey] = useState(0);
    const [editingEvent, setEditingEvent] = useState<AppointmentRequest | null>(null);
    const [currentStartDate, setCurrentStartDate] = useState(new Date());
    const [selectedDuration, setSelectedDuration] = useState<DurationOption>('1-day');
    const [modalData, setModalData] = useState<{ date: string; time: string } | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<AppointmentRequest | null>(null);
    const calculateMinutes = (offsetY: number) => Math.round(offsetY / pxPerMinute);
    // ХУКИ
    const {
        mutate: createAppointment,
        isPending,
        isError
    } = useCreateAppointment();

    const { mutate: updateAppointment } = useUpdateAppointment();
    const {mutate: deleteAppointment} = useDeleteAppointment();

    const {
        data: groupedAppointments,
        refetch: refetchAppointments,
        isLoading: isLoadingAppointments,
        isError: isAppointmentsError,
        error: appointmentsError
    } = useAppointments(
        branchId || undefined,
        employeeId || undefined, // ИЗ REACT QUERY
        selectedDuration,
        currentStartDate
    );

    const dates = useMemo(() => {
        const dates = generateWeekDates(currentStartDate, selectedDuration);
        return dates;
    }, [currentStartDate, selectedDuration]);

    const { data: employeeSchedules } = useEmployeeSchedules(
        branchId || undefined,
        employeeId || undefined, // ИЗ REACT QUERY
        dates[0],
        dates[dates.length - 1]
    );

    const {
        data: employeeServices,
        isLoading: isLoadingEmployeeServices
    } = useEmployeeServices(employeeId || undefined);

    // ВСЯ БИЗНЕС-ЛОГИКА остается та же
    const scheduleMap = useMemo(() => {
        const map: Record<string, Array<{ start: string; end: string }>> = {};

        employeeSchedules?.forEach((schedule, scheduleIndex) => {
            const startDate = new Date(schedule.start_date);
            const endDate = new Date(schedule.end_date);

            for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
                const dayKey = day.toISOString().split('T')[0];
                const dayOfWeek = day.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase().slice(0, 3);

                schedule.periods.forEach(([periodDay, startTime, endTime]) => {
                    const normalizedPeriodDay = periodDay.toLowerCase().slice(0, 3);

                    if (dayOfWeek === normalizedPeriodDay) {
                        if (!map[dayKey]) {
                            map[dayKey] = [];
                        }
                        map[dayKey].push({
                            start: startTime.padStart(5, '0'),
                            end: endTime.padStart(5, '0')
                        });
                    }
                });
            }
        });
        return map;
    }, [employeeSchedules]);

    const checkIfPast = (date: string, time: string) => {
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        const slotTime = new Date(year, month - 1, day, hours, minutes);
        return slotTime < new Date();
    };

    const isTimeAvailable = (date: string, time: string) => {
        const periods = scheduleMap[date] || [];
        if (periods.length === 0) return false;

        const slotMinutes = convertTimeToMinutes(time);

        return periods.some(period => {
            const start = convertTimeToMinutes(period.start);
            const end = convertTimeToMinutes(period.end);
            return slotMinutes >= start && slotMinutes < end;
        });
    };



   /* const handleCellClick = useCallback(
        (date: string, time: string, defaultDuration = 30) => {
            const periods = scheduleMap[date] || [];
            if (periods.length === 0) {
                console.error('No schedule found for:', date);
                alert('Расписание не найдено для выбранной даты');
                return;
            }

            const isAvailable = isTimeAvailable(date, time);
            if (!isAvailable) {
                alert('Выбранное время недоступно для записи');
                return;
            }

            // Открываем модалку и передаём дату, время и длительность по умолчанию
            setModalData({ date, time, duration: defaultDuration });
        },
        [scheduleMap]
    );*/

    const handleAddEvent = useCallback((data: Omit<AppointmentRequest, 'id'>) => {
        if (!branchId || !employeeId) {
            alert('Выберите филиал и сотрудника');
            return;
        }
//@ts-ignore
        const appointmentData: AppointmentRequest = {
            //@ts-ignore
            client_name: data.client_name,
            //@ts-ignore
            client_last_name: data.client_last_name,
            //@ts-ignore
            client_phone: data.client_phone,
            branch_id: branchId,
            employee_id: employeeId, // ИЗ REACT QUERY
            date: data.date,
            time_start: data.time_start,
            time_end: data.time_end,
            //@ts-ignore
            appointment_datetime: data.appointment_datetime,
            //@ts-ignore
            total_duration: data.total_duration,
            services: data.services.map(s => ({
                service_id: s.service_id,
                qty: s.qty
            })),
            //comment: data.comment || ""
        };

        createAppointment(appointmentData, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['appointments'] });
                setModalData(null);
            }
        });
    }, [branchId, employeeId, createAppointment, queryClient]); // ДОБАВЛЯЕМ employeeId

    const handleEditEvent = (event: AppointmentRequest) => {
        setSelectedEvent(event);
        setIsEditModalOpen(true);
        setModalData(null);
    };

    const handleDeleteAppointment = (id: number) => {
        if (window.confirm('Удалить запись?')) {
            deleteAppointment(id, {
                onSuccess: () => {
                    setNotification({ message: 'Запись успешно удалена!', type: 'success' });
                    setTimeout(() => setNotification(null), 3000);
                },
                onError: (error) => {
                    console.error("Ошибка удаления:", error);
                    setNotification({ message: `Ошибка удаления: ${error.message}`, type: 'error' });
                    setTimeout(() => setNotification(null), 5000);
                }
            });
        }
    };

    const handleDurationChange = (duration: DurationOption) => {
        setSelectedDuration(duration);

        if (duration === 'week') {
            const today = new Date();
            const monday = new Date(today);
            monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
            setCurrentStartDate(monday);
        } else {
            setCurrentStartDate(new Date());
        }
    };

    const handleWeekChange = (direction: 'prev' | 'next') => {
        setCurrentStartDate(prev => {
            const newDate = new Date(prev);
            const step = durationToDays(selectedDuration);
            const offset = direction === 'prev' ? -step : step;
            newDate.setDate(prev.getDate() + offset);
            return newDate;
        });
    };

    const getDayClass = (date: string) => {
        if (!Date.parse(date)) {
            console.error('Invalid date:', date);
            return 'invalid-date';
        }
        const today = new Date().toISOString().split('T')[0];
        const isPast = date < today;
        const isToday = date === today;

        return `day-column ${isPast ? 'past-day' : ''} ${isToday ? 'current-day' : ''}`;
    };

    // МЕМОИЗИРОВАННЫЕ КОМПОНЕНТЫ
    const MemoizedCalendarEvent = React.memo(CalendarEvent);
    const MemoizedWeekNavigator = React.memo(WeekNavigator);
    const calendarRef = useRef<HTMLDivElement>(null);
    const times = generateTimeSlots();
    const isFetchingAppointments = useIsFetching({ queryKey: ['appointments'] });



    // В Calendar компоненте
    useEffect(() => {
        console.log('📊 Calendar mounted/updated:', {
            employeeId,
            branchId,
            hash: typeof window !== 'undefined' ? window.location.hash : 'SSR',
            pathname: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
        });

        // Если employeeId нет, но в URL есть hash, попробуем извлечь его
        if (!employeeId && typeof window !== 'undefined') {
            const match = window.location.hash.match(/master=(\d+)/);
            if (match) {
                // Можно принудительно обновить состояние
            }
        }
    }, [employeeId, branchId]);

    // ПРОВЕРКИ СОСТОЯНИЙ
    if (isPending) {
        return <div>Создание записи...</div>;
    }

    if (isError) {
        return <div>Ошибка: {appointmentsError?.message}</div>;
    }

    if (isLoadingAppointments) {
        return (
            <div className="fullscreen-spinner">
                <Spinner />
                <style jsx>{`
                    .fullscreen-spinner {
                        height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                `}</style>
            </div>
        );
    }

    if (isAppointmentsError) {
        return (
            <div className="error-message">
                Ошибка загрузки данных: {appointmentsError?.message}
                <button onClick={() => refetchAppointments()}>Повторить</button>
                <style jsx>{`
                    .error-message {
                        padding: 40px;
                        text-align: center;
                        font-size: 1.2rem;
                        color: #dc3545;
                    }
                    button {
                        margin-top: 20px;
                        padding: 10px 20px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                `}</style>
            </div>
        );
    }

    // ОСНОВНОЙ RENDER - ТОЛЬКО ОДИН!
    return (
        <div className="calendar-container" ref={calendarRef}>
            {/* DEBUG блок */}
            {/* <div style={{
                position: 'fixed',
                top: '10px',
                right: '10px',
                background: 'red',
                color: 'white',
                padding: '10px',
                zIndex: 9999
            }}>
                <div>DEBUG: employeeId = {employeeId || 'NULL'}</div>
                <div>Type: {typeof employeeId}</div>
                <div>BranchId: {branchId}</div>
            </div>*/}

            {/* Уведомления */}
            {notification && (
                <div className={`notification ${notification.type}`}>
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="close-notification">
                        &times;
                    </button>
                </div>
            )}

            {/* Индикатор загрузки */}
            {isFetchingAppointments > 0 && (
                <div className="loading-overlay">
                    <Spinner />
                </div>
            )}

            {/* Навигация */}
            <MemoizedWeekNavigator
                currentStartDate={currentStartDate}
                selectedDuration={selectedDuration}
                onDurationChange={handleDurationChange}
                onWeekChange={handleWeekChange}
            />

            {/* КАЛЕНДАРНАЯ СЕТКА */}
            <div className="calendar-grid">
                <div className="time-column">
                    {times.map((time) => {
                        const [hours] = time.split(':').map(Number);
                        // Форматируем часы в "HH:00"
                        const formattedHour = hours.toString().padStart(2, '0') + ":00";
                        return (
                            <div key={time} className="hour-slot">
                                <span className="hour-marker">{formattedHour}</span>
                                <div className="half-hour-line"></div>
                            </div>
                        );
                    })}
                    <CurrentTimeIndicator/>
                </div>

                {dates.map((currentDate) => {
                    //const schedule = scheduleMap[currentDate];
                    //const isWorkingDay = !!schedule;

                    const isWorkingDay = !!scheduleMap[currentDate];



                    if (!Date.parse(currentDate)) {
                        console.error('Invalid date detected:', currentDate);
                        return null;
                    }

                    return (
                        <div
                            key={currentDate}
                            className={`day-column ${getDayClass(currentDate)} ${!isWorkingDay ? 'non-working-day' : ''}`}
                        >
                            <div className="day-header">
                                {new Date(currentDate).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    day: 'numeric'
                                })}
                                {!isWorkingDay && <span className="day-off-badge">Day off (Выходной)</span>}
                            </div>

                            <div
                                className="day-content relative"
                                onMouseDown={(e) => {
                                    if ((e.target as HTMLElement).classList.contains("day-content")) {
                                        const clickY = e.nativeEvent.offsetY;

                                        setSelection({
                                            startMinutes: calculateMinutes(clickY),
                                            endMinutes: calculateMinutes(clickY),
                                        });
                                    }
                                }}
                                onMouseMove={(e) => {
                                    if (!selection) return;

                                    const moveY = e.nativeEvent.offsetY;
                                    setSelection((prev) =>
                                        prev ? { ...prev, endMinutes: calculateMinutes(moveY) } : null
                                    );
                                }}
                                onMouseUp={() => {
                                    if (!selection) return;

                                    const start = Math.min(selection.startMinutes!, selection.endMinutes!);
                                    const end = Math.max(selection.startMinutes!, selection.endMinutes!);

                                    const startH = Math.floor(start / 60);
                                    const startM = start % 60;
                                    const endH = Math.floor(end / 60);
                                    const endM = end % 60;

                                    setModalData({
                                        date: currentDate,
                                        time: `${startH.toString().padStart(2, "0")}:${startM
                                            .toString()
                                            .padStart(2, "0")}`,
                                        //@ts-ignore
                                        endTime: `${endH.toString().padStart(2, "0")}:${endM
                                            .toString()
                                            .padStart(2, "0")}`,
                                        duration: end - start,
                                        isWorkingDay: isWorkingDay, // передаем флаг
                                    });

                                    setSelection(null);
                                }}
                            >

                                {/* ⬇️ подсветка рабочего периода */}
                                {(scheduleMap[currentDate] ?? []).map((p, idx) => {
                                    const startMinutes = convertTimeToMinutes(p.start);
                                    const endMinutes = convertTimeToMinutes(p.end);
                                    const topPx = startMinutes * pxPerMinute;
                                    const heightPx = Math.max((endMinutes - startMinutes) * pxPerMinute, 2);

                                    return (
                                        <div
                                            key={`work-${currentDate}-${idx}`}
                                            className="working-period"
                                            style={{
                                                position: "absolute",
                                                top: `${topPx}px`,
                                                height: `${heightPx}px`,
                                                left: 0,
                                                right: 0,
                                                pointerEvents: "none",
                                            }}
                                        />
                                    );
                                })}

                                {/* тут дальше твои события */}

                                {/* визуальное выделение */}
                                {selection && (
                                    <div
                                        className="selection-highlight"
                                        style={{
                                            position: "absolute",
                                            top: Math.min(selection.startMinutes!, selection.endMinutes!) + "px",
                                            height:
                                                Math.abs(selection.endMinutes! - selection.startMinutes!) + "px",
                                            left: 0,
                                            right: 0,
                                            backgroundColor: "rgba(144, 238, 144, 0.5)",
                                            pointerEvents: "none",
                                        }}
                                    />
                                )}

                                {/* отрисовка событий */}
                                {Object.values(groupedAppointments?.[currentDate] || {})
                                    .flat()
                                    .map((event) => {
                                        if (!event.appointment_datetime || !event.total_duration) return null;

                                        const startDate = new Date(event.appointment_datetime);
                                        const endDate = new Date(
                                            startDate.getTime() + event.total_duration * 60000
                                        );

                                        const startMinutes =
                                            startDate.getHours() * 60 + startDate.getMinutes();
                                        const endMinutes =
                                            endDate.getHours() * 60 + endDate.getMinutes();
                                        const durationMinutes = endMinutes - startMinutes;

                                        return (
                                            <div
                                                key={event.id}
                                                style={{
                                                    position: "absolute",
                                                    top: `${startMinutes * pxPerMinute}px`,
                                                    height: `${durationMinutes * pxPerMinute}px`,
                                                    left: 0,
                                                    right: 0,
                                                }}
                                            >
                                                <MemoizedCalendarEvent
                                                    event={event}
                                                    onDelete={handleDeleteAppointment}
                                                    onEdit={() => handleEditEvent(event)}
                                                />
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Модалки */}
            {modalData && (
                <Modal
                    data={modalData}
                    employeeId={employeeId}
                    onSave={data => {
                        handleAddEvent({
                            ...data,
                            employee_id: employeeId || 0,
                            branch_id: branchId,
                            services: data.services || [],
                        });
                        setModalData(null);
                    }}
                    onClose={() => setModalData(null)}
                />
            )}

            {isEditModalOpen && selectedEvent && (
                <EditEventModal
                    event={selectedEvent}
                    onSave={(updatedEvent) => {
                        updateAppointment(updatedEvent);
                        setIsEditModalOpen(false);
                    }}
                    onClose={() => setIsEditModalOpen(false)}
                    employeeId={employeeId || null}
                />
            )}

            {/* ВСЕ СТИЛИ ИЗ РАБОЧЕГО ВАРИАНТА - ПОЛНАЯ ВЕРСИЯ */}
            <style jsx>{`


              .working-period {
                background: rgba(200, 230, 201, 0.6); /* светло-зелёный фон */
                border-left: 3px solid rgba(76, 175, 80, 0.45);
                border-radius: 4px;
                z-index: 0;
              }

              .event {
                z-index: 2;
                position: absolute;
              }
              
              
              .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                opacity: 0;
                animation: fadeIn 0.3s ease forwards;
              }

              @keyframes fadeIn {
                to { opacity: 1; }
              }

              .day-content {
                position: relative;
                /*height: 1440px;*/ /* 24 часа */
                height: 100%;
              }

              .event {
                position: absolute;
                left: 2px;
                right: 2px;
                background: #e3f2fd;
                border-left: 3px solid #2196f3;
                box-sizing: border-box;
              }

              .duration-selector {
                margin: 10px 0;
                text-align: center;
              }

              .duration-selector select {
                padding: 8px 16px;
                border-radius: 4px;
                border: 1px solid #ddd;
                background: white;
                cursor: pointer;
              }

              .calendar-container {
                height: calc(100vh - 100px);
                overflow: auto;
                padding: 20px;
                background: #f8f9fa;
              }

              .week-navigation {
                position: sticky;
                top: 0;
                background: white;
                z-index: 10;
                padding: 16px 0;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                margin-bottom: 20px;
              }

              .navigation-wrapper {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 24px;
                max-width: 800px;
                margin: 0 auto;
              }

              .nav-button {
                width: 40px;
                height: 40px;
                border: none;
                border-radius: 50%;
                background: #f0f2f5;
                color: #2d3436;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
              }

              .nav-button:hover {
                background: #007bff;
                color: white;
                transform: scale(1.1);
              }

              .month-info {
                text-align: center;
              }

              .month-title {
                margin: 0;
                font-size: 1.5em;
                color: #2d3436;
              }

              .week-range {
                color: #636e72;
                font-size: 0.9em;
                margin-top: 4px;
              }

              .week-navigation button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                background: #007bff;
                color: white;
                cursor: pointer;
                transition: opacity 0.2s;
              }

              .week-navigation button:hover {
                opacity: 0.9;
              }

              .calendar-grid {
                display: grid;
                grid-template-columns: 80px repeat(auto-fit, minmax(120px, 1fr));
              }

              .time-column {
                width: 50px;
                background: #f8f9fa;
                border-right: 1px solid #dee2e6;
              }

              .hour-slot {
                height: 90px;
                position: relative;
              }

              .time-slot {
                height: 60px;
                position: relative;
              }

              .hour-marker {
                position: absolute;
                top: -10px;
                left: 8px;
                font-size: 0.85em;
                color: #6c757d;
                background: #f8f9fa;
                padding: 0 4px;
              }

              .half-hour-line {
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                border-bottom: 1px solid #e9ecef;
                z-index: 1;
              }

              .time-text {
                position: absolute;
                right: 4px;
                bottom: 2px;
                font-size: 0.7em;
                color: #999;
              }

              .day-column {
                min-width: 150px;
                transition: all 0.2s ease-in-out;
                flex: 1;
              }

              .day-header {
                position: sticky;
                top: 0;
                background: white;
                padding: 8px;
                border-bottom: 1px solid #eee;
                z-index: 1;
                text-align: center;
                font-weight: 500;
              }

              .past-day {
                background: #f8f9fa;
              }

              .current-day {
                background: #fff3cd;
              }

              .past-slot {
                background: #f8f9fa;
                cursor: not-allowed;
              }

              .future-slot {
                cursor: pointer;
                transition: background 0.2s;
              }

              .future-slot:hover {
                background: #e9ecef;
              }

              .current-time {
                height: 2px;
                background: #dc3545;
                box-shadow: 0 0 3px rgba(220, 53, 69, 0.3);

                &::before {
                  content: '';
                  position: absolute;
                  width: 8px;
                  height: 8px;
                  background: #dc3545;
                  border-radius: 50%;
                  left: -4px;
                  top: -3px;
                }
              }

              .current-time .circle {
                width: 8px;
                height: 8px;
                background: #ff4444;
                border-radius: 50%;
                position: absolute;
                left: -4px;
                top: -3px;
              }

              .event {
                position: absolute;
                left: 2px;
                right: 2px;
                background: #e3f2fd;
                border: 1px solid #90caf9;
                border-radius: 4px;
                overflow: hidden;
                z-index: 2;
              }

              .event-content {
                padding: 4px;
                font-size: 0.8em;
              }

              .event-title {
                font-weight: 500;
                display: block;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .event-time {
                color: #1976d2;
                font-size: 0.75em;
              }

              .event-services {
                color: #666;
                font-size: 0.7em;
                margin-top: 2px;
              }

              .calendar-container {
                height: 100vh;
                display: flex;
                flex-direction: column;
                padding-top: 60px;
                padding-bottom: 80px;
                box-sizing: border-box;
              }

              .no-schedule {
                background: repeating-linear-gradient(
                        45deg,
                        #f8f9fa,
                        #f8f9fa 10px,
                        #ffd6d6 10px,
                        #ffd6d6 20px
                );
                cursor: not-allowed;
              }

              .non-working-day {
                background: repeating-linear-gradient(
                        45deg,
                        #f8f9fa,
                        #f8f9fa 10px,
                        #ffe0e0 10px,
                        #ffe0e0 20px
                );
              }

              .day-column.non-working-day {
                background-color: rgba(248, 249, 250, 0.4) !important;
                position: relative;
              }

              .day-column.non-working-day .day-header {
                opacity: 0.7;
              }

              .day-column.non-working-day .time-slot {
                background-color: transparent !important;
                cursor: default !important;
              }

              .day-column.non-working-day::after {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 3px,
                        rgba(0, 0, 0, 0.05) 3px,
                        rgba(0, 0, 0, 0.05) 6px
                );
                pointer-events: none;
                z-index: 1;
              }

              .day-off-badge {
                background: rgba(220, 53, 69, 0.1);
                color: #dc3545;
                border: 1px solid rgba(220, 53, 69, 0.2);
                font-size: 0.75em;
                padding: 2px 6px;
                border-radius: 4px;
              }

              .available {
                background-color: #e8f5e9 !important;
                cursor: pointer;
              }

              .unavailable {
                background-color: transparent !important;
                cursor: default;
              }

              .past-slot {
                background-color: #f8f9fa !important;
              }

              .event {
                position: relative;
              }

              .delete-btn {
                position: absolute;
                top: 2px;
                right: 2px;
                background: rgba(255, 50, 50, 0.1);
                border: none;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #ff3232;
                transition: all 0.2s;

                &:hover {
                  background: #ff3232;
                  color: white;
                  transform: scale(1.1);
                }
              }

              .notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translateX(-50%);
                padding: 10px 20px;
                border-radius: 5px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                z-index: 1010;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 250px;
              }

              .notification.success {
                background-color: #dff0d8;
                color: #3c763d;
                border: 1px solid #d6e9c6;
              }

              .notification.error {
                background-color: #f2dede;
                color: #a94442;
                border: 1px solid #ebccd1;
              }

              .close-notification {
                background: none;
                border: none;
                font-size: 1.5em;
                line-height: 1;
                cursor: pointer;
                color: inherit;
                margin-left: 15px;
                padding: 0;
              }

              @media (max-width: 768px) {
                .calendar-grid {
                  display: flex !important;
                  overflow-x: auto;
                  width: 100%;
                  scroll-snap-type: x mandatory;
                  -webkit-overflow-scrolling: touch;
                }

                .time-column {
                  position: sticky;
                  left: 0;
                  z-index: 10; /* выше остальных, чтобы не перекрывалось */
                  background: #f8f9fa; /* такой же фон, чтобы не было перекрытий */
                  flex: 0 0 60px;
                  min-width: 60px;
                  max-width: 60px;
                  scroll-snap-align: start;
                }

                .day-column {
                  flex: 0 0 70vw;
                  min-width: 70vw;
                  max-width: 70vw;
                  scroll-snap-align: start;
                  transition: width 0.3s ease;
                }

                /* По желанию — скрыть полосы прокрутки на определенных устройствах */
                .calendar-grid::-webkit-scrollbar {
                  display: none;
                }
                .calendar-grid {
                  -ms-overflow-style: none;  /* IE и Edge */
                  scrollbar-width: none;  /* Firefox */
                }

                .container {
                  padding-left: 0 !important;
                  padding-right: 0 !important;
                  margin-left: 0 !important;
                  margin-right: 0 !important;
                  max-width: 100% !important;
                }
              }

              /* Мобильная версия */
              @media (max-width: 768px) {
                .calendar-container {
                  display: block;
                  height: auto;
                  min-height: 100vh;
                }

                .header {
                  position: sticky;
                  top: 0;
                }

                .week-navigation {
                  position: sticky;
                  top: 5px;
                  background: white;
                  z-index: 3;
                  padding: 12px 16px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .calendar-grid {
                  grid-template-columns: 50px repeat(auto-fit, minmax(120px, 1fr));
                }
              }

              /* Основные изменения для мобильной версии */
              @media (max-width: 480px) {
                .calendar-container {
                  padding: 8px 0px;
                }

                .calendar-grid {
                  grid-template-columns: 36px repeat(auto-fit, minmax(90px, 1fr));
                  gap: 2px;
                }

                .day-column {
                  min-width: 90px;
                }

                .day-header {
                  padding: 6px 2px;
                  font-size: 0.9em;
                }

                .hour-marker {
                  font-size: 1.2em;
                  font-weight: 500;
                  left: 2px;
                }

                .half-hour-line {
                  display: none;
                }

                .time-slot {
                  height: 50px;
                }
              }

              /* Дополнительные оптимизации для самых маленьких экранов */
              @media (max-width: 360px) {
                .calendar-container {
                  padding: 8px 2px;
                }

                .calendar-grid {
                  grid-template-columns: 30px repeat(auto-fit, minmax(80px, 1fr));
                }

                .day-column {
                  min-width: 80px;
                }

                .hour-marker {
                  font-size: 0.9em;
                }
              }

              /* Улучшения для текущей временной линии */
              .current-time {
                height: 3px;
              }
            `}</style>
        </div>
    );
}


/*interface ModalProps {
    data: { date: string; time: string };
    employeeId: number | null; // Добавляем пропс
    editingEvent?: AppointmentRequest | null;
    onSave: (data: AppointmentRequest | Omit<AppointmentRequest, 'id'>) => void;
    onClose: () => void;
}*/


interface ModalProps {
    data: { date: string; time: string };
    employeeId: number | null | undefined; // Добавляем undefined
    editingEvent?: AppointmentRequest | null;
    onSave: (data: AppointmentRequest | Omit<AppointmentRequest, 'id'>) => void;
    onClose: () => void;
}

const Modal = ({ data, employeeId, editingEvent, onSave, onClose }: ModalProps) => {

    // Внутри компонента:
    const [validationErrors, setValidationErrors] = useState({
        phone: '',
        name: '',
        services: ''
    });


    /*const [form, setForm] = useState<AppointmentRequest | Omit<AppointmentRequest, 'id'>>(
        editingEvent || {
            client_name: "",
            client_last_name: "",
            client_phone: "",
            employee_id: 0,
            branch_id: 0,
            date: data.date,
            time_start: data.time,
            time_end: add30Minutes(data.time),
            services: [],
            comment: "",
            // @ts-ignore
            total_duration: 30
        });*/
    const [form, setForm] = useState<AppointmentRequest>(// @ts-ignore
        editingEvent || {
            //@ts-ignore
            client_name: "",
            client_last_name: "",
            client_phone: "",
            employee_id: 0,
            branch_id: 0,
            date: data.date,
            time_start: data.time,
            time_end: add30Minutes(data.time),
            appointment_datetime: `${data.date}T${data.time}`,
            total_duration: 30,
            //total_duration: data.date || 30, // берем рассчитанную длительность
            services: [],
            //comment: ""
        }
    );



    const {
        data: services,
        isLoading: isLoadingServices, // Переименовано
        isError: isServicesError
    } = useServices();


    const {
        data: employeeServices,
        isLoading: isLoadingEmployeeServices
    } = useEmployeeServices(employeeId || undefined);
    const handleAddService = () => {
        setForm(prev => ({
            ...prev,
            services: [...prev.services, {
                service_id: 0,
                qty: 1,
                individual_price: 0,
                duration_minutes: 0
            }]
        }));
    };



// В компоненте Modal
    const handleSubmit = () => {
        // Рассчет длительности
        const start = new Date(`${data.date}T${form.time_start}`);
        const end = new Date(`${data.date}T${form.time_end}`);
        const duration = (end.getTime() - start.getTime()) / 60000;
        //const duration = (new Date(`${date}T${end}`)).getTime() - (new Date(`${date}T${start}`)).getTime();

        const errors = {
            //@ts-ignore
            phone: validatePhone(form.client_phone),
            //@ts-ignore
            name: validateName(form.client_name),
            services: form.services.length === 0 ? 'Добавьте хотя бы одну услугу' : ''
        };

        if (duration <= 0) {
            // Можно показать ошибку - время окончания должно быть позже начала
            alert('Время окончания должно быть позже времени начала');
            return;
        }

        setValidationErrors(errors);

        if (Object.values(errors).some(error => error)) return;

        onSave({
            ...form,
            // @ts-ignore
            total_duration: duration
        });
    };


    interface ServiceItem {
        service_id: number;
        qty: number;
    }

    return (
        <div className="modal-overlay">
            <div className="modal relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                    ✖
                </button>
                <h2 className="text-xl font-bold mb-4">Новое назначение</h2>

                <div className="form-group">
                    <label className="block font-semibold mb-1">Клиент: Имя</label>
                    <input
                        //@ts-ignore
                        value={form.client_name}
                        //@ts-ignore
                        onChange={e => setForm({...form, client_name: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label className="block font-semibold mb-1">Клиент: Фамилия</label>
                    <input
                        //@ts-ignore
                        value={form.client_last_name}
                        //@ts-ignore
                        onChange={e => setForm({...form, client_last_name: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label className="block font-semibold mb-1">Телефон:</label>
                    <input
                        type="tel"
                        //@ts-ignore
                        value={form.client_phone}
                        onChange={(e) => {
                            const inputValue = e.target.value;
                            // Форматирование
                            let filteredValue = inputValue
                                .replace(/[^\d+]/g, '')
                                .replace(/^\+?/, '+')
                                .slice(0, 16);
                            //@ts-ignore
                            setForm({ ...form, client_phone: filteredValue });
                            setValidationErrors(prev => ({
                                ...prev,
                                phone: validatePhone(filteredValue)
                            }));
                        }}
                        className={`w-full p-2 border rounded ${
                            validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="+71234567890"
                    />
                    {validationErrors.phone && (
                        <div className="text-red-500 text-sm mt-1">{validationErrors.phone}</div>
                    )}
                </div>

                {/*<div className="form-group">
                    <label className="block font-semibold mb-1">Комментарий:</label>
                    <textarea
                        value={form.comment}
                        onChange={e => setForm({...form, comment: e.target.value})}
                        style={{
                            border: "1px solid #ddd", // black solid border
                            borderRadius: "5px",      // rounded corners
                            padding: "8px"            // padding inside textarea
                        }}
                    />
                </div>*/}

                <div className="time-selection">
                    <div className="form-group">
                        <label className="block font-semibold mb-1">Начало:</label>
                        <input
                            type="time"
                            value={form.time_start}
                            onChange={e => setForm({...form, time_start: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label className="block font-semibold mb-1">Окончание:</label>
                        <input
                            type="time"
                            value={form.time_end}
                            onChange={e => setForm({...form, time_end: e.target.value})}
                        />
                    </div>
                </div>

                <div className="services-section">
                    <h4>Услуги:</h4>
                    {form.services.map((service: ServiceItem, index: number) => (
                        <div key={index} className="service-item">
                            <select
                                value={service.service_id}
                                onChange={e => {
                                    // @ts-ignore
                                    const selectedService = employeeServices?.find(s => s.service_id === Number(e.target.value));
                                    const newServices = [...form.services];
                                    newServices[index] = {
                                        ...service,
                                        // @ts-ignore
                                        service_id: selectedService?.service_id || 0,
                                        // @ts-ignore
                                        individual_price: selectedService?.individual_price || 0,
                                        // @ts-ignore
                                        duration_minutes: selectedService?.duration_minutes || 0
                                    };
                                    setForm({...form, services: newServices});
                                }}
                            >
                                <option value={0}>Выберите услугу</option>
                                {employeeServices?.map(svc => (
                                    // @ts-ignore
                                    <option key={svc.id} value={svc.service_id}>
                                        {// @ts-ignore
                                            svc.service.name} ({svc.individual_price} руб.)
                                    </option>
                                ))}
                            </select>

                            <input
                                type="number"
                                min="1"
                                value={service.qty}
                                onChange={e => {
                                    const newServices = [...form.services];
                                    newServices[index].qty = Math.max(1, Number(e.target.value));
                                    setForm({...form, services: newServices});
                                }}
                            />

                            <button
                                className="bg-red-500 text-white rounded-full /*w-6*/ h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                onClick={() => {
                                    const newServices = form.services.filter((_, i) => i !== index);
                                    setForm({...form, services: newServices});
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button
                        type="submit"
                        onClick={handleAddService}
                        disabled={!employeeServices?.length || isLoadingEmployeeServices}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        {isLoadingEmployeeServices ? 'Загрузка услуг...' : 'Добавить услугу'}
                    </button>
                </div>

                <div className="modal-actions">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600"
                    >Отмена
                    </button>
                    <button
                        type="submit"
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        onClick={handleSubmit}
                    >Сохранить
                    </button>
                </div>
            </div>


            <style jsx>{`
              .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
              }

              .modal {
                background: white;
                padding: 24px;
                border-radius: 8px;
                width: 500px;
                max-width: 90%;
              }

              .form-group {
                margin-bottom: 16px;
              }

              .form-group label {
                display: block;
                margin-bottom: 4px;
              }

              .form-group input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
              }

              .time-selection {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
              }

              .services-section {
                margin-top: 16px;
                border-top: 1px solid #eee;
                padding-top: 16px;
              }

              .service-item {
                display: flex;
                gap: 8px;
                margin-bottom: 8px;
              }

              .modal-actions {
                margin-top: 24px;
                display: flex;
                justify-content: flex-end;
                gap: 8px;
              }
              
              button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
              }

              button:last-child {
                //background: #007bff;
                color: white;
              }

              // В блоке стилей модального окна
              .service-item {
                display: grid;
                grid-template-columns: 1fr 80px;
                gap: 8px;
                margin-bottom: 8px;
              }

              select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
              }

              input[type="number"] {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                text-align: right;
              }

             /* .delete-service {
                background: transparent;
                border: none;
                color: #ff4444;
                cursor: pointer;
                padding: 0 8px;
              }*/

              .create-modal {
                z-index: 1002;
              }

            `}</style>
        </div>
    );
};


export default Calendar;
