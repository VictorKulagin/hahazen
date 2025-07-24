//components/Calendar/Calendar.ts
"use client";
import React, {useState, useEffect, useRef, useCallback, useMemo} from "react";
import {AppointmentRequest} from "@/services/appointmentsApi";
import {useAppointments, DurationOption, useCreateAppointment, useUpdateAppointment} from "@/hooks/useAppointments"; // Добавляем импорт
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




// 1. Модифицируем функцию конвертации времени
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
        // employeeId?: number; // Опциональный параметр, если потребуется
    }

const Calendar: React.FC<CalendarProps> = ({ branchId }) => {

// В начале компонента Calendar, после импортов
    const isValidTime = (time: string): boolean => {
        return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
    };

    // 1. Добавляем функцию-валидатор
    const isValidTimeFormat = (time: string): boolean => {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
    };

    if (branchId === null) return <div>Выберите филиал</div>;// Остальная логика с branchId как number}

    const queryClient = useQueryClient();

    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    // 1. Получение masterId из хэша
    /*const getEmployeeIdFromHash = useCallback((): number | null => {
        const hash = window.location.hash;
        const match = hash.match(/(?:#|&)master=(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    }, []);*/

    // 2. Состояние для принудительного обновления
    const [forceUpdateKey, setForceUpdateKey] = useState(0);
   // const employeeId = getEmployeeIdFromHash();

    const [employeeId, setEmployeeId] = useState<number | null>(null);

    const getEmployeeIdFromHash = useCallback((): number | null => {
        const hash = window.location.hash;
        const match = hash.match(/(?:#|&)master=(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    }, []);


    useEffect(() => {
        setEmployeeId(getEmployeeIdFromHash());
    }, []);


    //const {mutate: createAppointment, isPending, isError, error} = useCreateAppointment();


    const {
        mutate: createAppointment,
        isPending,
        isError
    } = useCreateAppointment();


    const [editingEvent, setEditingEvent] = useState<AppointmentRequest | null>(null);

    const { mutate: updateAppointment } = useUpdateAppointment();

   /* const {
        data: services,
        isLoading, // <-- Добавьте эту строку
        isError
    } = useServices();*/


    const {mutate: deleteAppointment} = useDeleteAppointment(/*id*/);
    const [currentStartDate, setCurrentStartDate] = useState(new Date());

    // 3. Запрос данных
// Внутри компонента Calendar:
    const [selectedDuration, setSelectedDuration] = useState<DurationOption>('1-day');


// Обновите вызов хука useAppointments
    const {
        data: groupedAppointments,
        refetch,
        isLoading: isLoadingAppointments,
        isError: isAppointmentsError,
        error // Добавляем получение ошибки
    } = useAppointments(
        branchId || undefined,
        employeeId || undefined,
        selectedDuration, // Добавляем параметр длительности
        currentStartDate // Передаем актуальную дату
    );

    console.log('Данные из API:', groupedAppointments);




    useEffect(() => {
        console.log('Current request params:', {
            branchId: branchId ?? 'undefined',
            employeeId: employeeId ?? 'undefined',
            duration: selectedDuration
        });
    }, [branchId, employeeId, selectedDuration]);


// Обновляем useEffect с новым именем
    useEffect(() => {
        if (!isLoadingAppointments && groupedAppointments) {
            console.log('Grouped Appointments Data:', groupedAppointments);
            console.log('Dates:', Object.keys(groupedAppointments));
            console.log('Count:', Object.values(groupedAppointments).flat().length);
        }
    }, [groupedAppointments, isLoadingAppointments]); // Используем переименованную переменную


    const [modalData, setModalData] = useState<{ date: string; time: string } | null>(null);



    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [selectedEvent, setSelectedEvent] = useState<AppointmentRequest | null>(null);
// @ts-ignore
    const isFetchingAppointments = useIsFetching(['appointments']);




    const dates = useMemo(() => {
        const dates = generateWeekDates(currentStartDate, selectedDuration);
        console.log("Generated dates-:", dates);
        return dates;
    }, [currentStartDate, selectedDuration]);

    // 3. Получаем данные о рабочих часах сотрудника
    const { data: employeeSchedules } = useEmployeeSchedules(
        branchId || undefined,
        employeeId || undefined,
        dates[0], // startDate (первая дата в диапазоне)
        dates[dates.length - 1] // endDate (последняя дата в диапазоне)
    );


// 1. Модифицируем структуру scheduleMap для хранения массивов периодов
    const scheduleMap = useMemo(() => {
        const map: Record<string, Array<{ start: string; end: string }>> = {};

        //console.log("Raw employee schedules data JSON:", JSON.stringify(employeeSchedules, null, 4));

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

        console.log('ScheduleMap with periods:', map);
        return map;
    }, [employeeSchedules]);


    // Проверка, прошло ли время
    const checkIfPast = (date: string, time: string) => {
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        const slotTime = new Date(year, month - 1, day, hours, minutes);
        return slotTime < new Date();
    };

// 1. Модифицируем проверку времени
// 2. Обновляем проверку доступности времени
    const isTimeAvailable = (date: string, time: string) => {
        const periods = scheduleMap[date] || [];
        //if (!periods.length) return false;
        if (periods.length === 0) return false; // Важная проверка

        const slotMinutes = convertTimeToMinutes(time);

        return periods.some(period => {
            const start = convertTimeToMinutes(period.start);
            const end = convertTimeToMinutes(period.end);
            //debugger;
            return slotMinutes >= start && slotMinutes < end;
        });
    };

    const MemoizedCalendarEvent = React.memo(CalendarEvent);
    const MemoizedWeekNavigator = React.memo(WeekNavigator);



    const calendarRef = useRef<HTMLDivElement>(null);

    const times = generateTimeSlots();

    /*const handleCellClick = useCallback((date: string, time: string) => {
        if (!modalData) { // Проверяем, не открыто ли уже модальное окно
            setModalData({ date, time });
        }
    }, [modalData]);*/


// 1. Обновляем обработчик клика
    const handleCellClick = useCallback((date: string, time: string) => {
        //setSelectedEvent(null); // Сбрасываем редактирование
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

        setModalData({ date, time });
    }, [scheduleMap]);

    console.log(branchId + " Branch ID");
    console.log(employeeId + " EmployeeId ID");

    // 4. Обработчик изменений хэша
    /*const handleHashChange = useCallback(() => {
        const newId = getEmployeeIdFromHash();
        setForceUpdateKey(prev => prev + 1); // Принудительное обновление
        refetch();
    }, [refetch, getEmployeeIdFromHash]);*/
    const handleHashChange = useCallback(() => {
        const newId = getEmployeeIdFromHash();
        setEmployeeId(newId);
        setForceUpdateKey(prev => prev + 1);
        refetch();
    }, [getEmployeeIdFromHash, refetch]);


    /*useEffect(() => {
        console.log("currentStartDate updated:", currentStartDate.toISOString().split('T')[0]);
    }, [currentStartDate]);*/


    useEffect(() => {
        console.log("Employee Schedules RAW Data:", JSON.stringify(employeeSchedules, null, 2));
    }, [employeeSchedules]);

    useEffect(() => {
        console.log('Полученные данные:',
            Object.entries(groupedAppointments || {}).map(([date, events]) => ({
                date,
                count: events?.length
            }))
        );
    }, [groupedAppointments]);




    useEffect(() => {
        console.log('Отладочная информация:', {
            dates,
            appointments: groupedAppointments ? Object.values(groupedAppointments).flat() : [],
            times: generateTimeSlots()
        });
    }, [groupedAppointments, dates]);
    /*Важная отладочная информация не удалять*/
    useEffect(() => {
        if (isError && error) {
            console.error('Ошибка загрузки данных:', error);
            // showNotification('Ошибка загрузки расписания', 'error');
            alert(`Ошибка: ${error.message}`);
        }
    }, [isError, error]); // Добавляем зависимости

    // 5. Эффекты для отслеживания изменений
    /*useEffect(() => {
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, [handleHashChange]);*/

    useEffect(() => {
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [handleHashChange]);

    useEffect(() => {
        handleHashChange();
    }, [pathname, searchParams, handleHashChange]);

    useEffect(() => {
        if (groupedAppointments) {
            console.log("Группированные данные:", groupedAppointments);
            console.log("Даты с событиями:", Object.keys(groupedAppointments));
        }
    }, [groupedAppointments]);

    // Основной эффект для отслеживания изменений
    const scrollToCurrentTime = () => {
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        const scrollPosition = minutes * 1.333 - 200;
        calendarRef.current?.scrollTo(0, scrollPosition);
    };

    const handleDurationChange = (duration: DurationOption) => {
        // При смене длительности сразу запрашиваем данные
        setSelectedDuration(duration);

        if (duration === 'week') {
            // Для недели переходим к текущему понедельнику
            const today = new Date();
            const monday = new Date(today);
            monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
            setCurrentStartDate(monday);
        } else {
            // Для других периодов начинаем с сегодняшнего дня
            setCurrentStartDate(new Date());
        }
    };


    /*const handleWeekChange = (direction: 'prev' | 'next') => {
        setCurrentStartDate(prev => {
            const newDate = new Date(prev);
            const days = durationToDays(selectedDuration);
            newDate.setDate(prev.getDate() + (direction === 'prev' ? -1 : days));
            refetch(); // Добавляем обновление данных
            return newDate;
        });
    };*/

    const handleWeekChange = (direction: 'prev' | 'next') => {
        setCurrentStartDate(prev => {
            const newDate = new Date(prev);
            const step = durationToDays(selectedDuration); // Используем длительность как шаг
            const offset = direction === 'prev' ? -step : step;
            newDate.setDate(prev.getDate() + offset);
            return newDate;
        });
    };


// В компоненте Calendar.tsx обновляем handleAddEvent
// 1. Исправляем обработчик создания события
    const handleAddEvent = useCallback((data: Omit<AppointmentRequest, 'id'>) => {
        if (!branchId || !employeeId) {
            alert('Выберите филиал и сотрудника');
            return;
        }

        const appointmentData: AppointmentRequest = {
            client_name: data.client_name,
            client_last_name: data.client_last_name,
            client_phone: data.client_phone,
            branch_id: branchId,
            employee_id: employeeId,
            date: data.date,
            time_start: data.time_start,
            time_end: data.time_end,
            appointment_datetime: data.appointment_datetime,
            total_duration: data.total_duration,
            services: data.services.map(s => ({
                service_id: s.service_id,
                qty: s.qty
            })),
            comment: data.comment || ""
        };

        createAppointment(appointmentData, {
            onSuccess: () => {
                // Инвалидация кэша и принудительный перезапрос
                // @ts-ignore
                queryClient.invalidateQueries(['appointments']);
                setModalData(null);
            }
        });

        console.log("branchId handleAddEvent:", branchId, "employeeId handleAddEvent:", employeeId);

    }, [branchId, employeeId, createAppointment, queryClient]);

    // Добавляем обработку состояний
    if (isPending) {
        return <div>Создание записи...</div>;
    }

    if (isError) {
        return <div>Ошибка: {error?.message}</div>;
    }

// Обновим обработчик открытия модалки
    /*const handleEditEvent = (event: Appointment) => {
        setModalData({
            date: event.date,
            time: event.time_start
        });
        setEditingEvent(event);
    };*/


    const handleEditEvent = (event: AppointmentRequest) => {
        // @ts-ignore
        console.log('Opening edit modal for event:', event.id, 'Data:', event);
        setSelectedEvent(event);
        setIsEditModalOpen(true); // Добавляем это!
        setModalData(null); // Закрываем модалку создания
    };


    const getDayClass = (date: string) => {
        if (!Date.parse(date)) { // Исправлено здесь
            console.error('Invalid date:', date); // И здесь
            return 'invalid-date';
        }
        const today = new Date().toISOString().split('T')[0];
        const isPast = date < today;
        const isToday = date === today;

        return `day-column ${isPast ? 'past-day' : ''} ${isToday ? 'current-day' : ''}`;
    };


    // Функция для обработки удаления
    const handleDeleteAppointment = (id: number) => {
        if (window.confirm('Удалить запись?')) {
            deleteAppointment(id, {
                onSuccess: () => {
                    console.log("Запись успешно удалена");
                    setNotification({ message: 'Запись успешно удалена!', type: 'success' });
                    // Скрываем уведомление через 3 секунды
                    setTimeout(() => setNotification(null), 3000);
                    // refetch(); // Убедитесь, что данные перезапрашиваются, если react-query не настроен на это автоматически после мутации
                },
                onError: (error) => {
                    console.error("Ошибка удаления:", error);
                    setNotification({ message: `Ошибка удаления: ${error.message}`, type: 'error' });
                    // Скрываем уведомление об ошибке через 5 секунд
                    setTimeout(() => setNotification(null), 5000);
                }
            });
        }
    };


    // ===== ДОБАВЛЯЕМ ЭТОТ БЛОК =====
// Обработка состояния загрузки
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

// Обработка ошибок
    if (isAppointmentsError) {
        return (
            <div className="error-message">
                Ошибка загрузки данных: {error?.message}
                <button onClick={() => refetch()}>Повторить</button>
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
// ===== КОНЕЦ ДОБАВЛЕННОГО БЛОКА =====


    return (
        <div className="calendar-container" ref={calendarRef}>

            {/* Уведомления */}
            {notification && (
                <div className={`notification ${notification.type}`}>
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="close-notification">
                        &times;
                    </button>
                </div>
            )}
            {/* === Конец блока уведомления === */}

            {/* В рендере заменяем индикатор */}
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

            <div className="calendar-grid">
                <div className="time-column">
                    {/*
                        times.map((time, index) => (
                        <div key={time} className="time-slot">
                            {index % 2 === 0 && (
                                <span className="hour-marker">
                  {time.split(':')[0]}
                </span>
                            )}
                            <span className="time-text">{time}</span>
                        </div>
                    ))
                    */}
                    {times.map((time) => {
                        const [hours] = time.split(':').map(Number);
                        return (
                            <div key={time} className="hour-slot">
                                <span className="hour-marker">{hours}</span>
                                <div className="half-hour-line"></div>
                            </div>
                        );
                    })}
                    <CurrentTimeIndicator/>
                </div>

                {dates.map((currentDate) => {
                    // 1. Проверяем наличие расписания для текущей даты
                    const schedule = scheduleMap[currentDate];
                    const isWorkingDay = !!schedule; // Простая проверка наличия расписания

                    // 2. Проверяем валидность даты
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
                                {!isWorkingDay && <span className="day-off-badge">Day off</span>}
                            </div>
                            <div className="day-content">
                                {times.map(time => {
                                    const [hours, minutes] = time.split(':').map(Number);
                                    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                                    const currentEvents = groupedAppointments?.[currentDate]?.[formattedTime] || [];
                                    const isAvailable = isTimeAvailable(currentDate, time);
                                    const isPast = checkIfPast(currentDate, time);

                                    return (
                                        <div
                                            key={`${currentDate}-${time}`}
                                            className={`time-slot 
                                ${isPast ? 'past-slot' : 'future-slot'} 
                                ${isAvailable ? 'available' : 'unavailable'}`}
                                            onClick={() => isAvailable && handleCellClick(currentDate, time)}
                                        >
                                            {currentEvents.map(event => (
                                                <MemoizedCalendarEvent
                                                    key={event.id}
                                                    event={event}
                                                    onDelete={handleDeleteAppointment}
                                                    onEdit={handleEditEvent}
                                                />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* 3. Модалка создания */}
            {modalData && (
                <Modal
                    data={modalData}
                    employeeId={employeeId} // Передаем employeeId
                    onSave={data => {
                        handleAddEvent({
                            ...data,
                            // @ts-ignore
                            employee_id: employeeId,
                            branch_id: branchId,
                            services: data.services || [],
                        });
                        setModalData(null);
                    }}
                    onClose={() => setModalData(null)}
                />
            )}

            {/* 4. Модалка редактирования */}
            {isEditModalOpen && selectedEvent && (
                <EditEventModal
                    event={selectedEvent}
                    onSave={(updatedEvent) => {
                        updateAppointment(updatedEvent);
                        setIsEditModalOpen(false);
                    }}
                    onClose={() => setIsEditModalOpen(false)}
                    employeeId={employeeId} // Передаем employeeId
                />
            )}

            <style jsx>{`
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
                height: 1440px; /* 24 часа */
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

              /*.calendar-grid {
                display: grid;
                grid-template-columns: 100px repeat(7, 1fr);
                gap: 1px;
                background: #e0e0e0;
                border: 1px solid #e0e0e0;
              }*/

              .calendar-grid {
                display: grid;
                grid-template-columns: 80px repeat(auto-fit, minmax(120px, 1fr));
              }

             /* {
                position: sticky;
                left: 0;
                background: white;
                z-index: 2;
              }*/

              .time-column {
                width: 50px;
                background: #f8f9fa;
                border-right: 1px solid #dee2e6;
              }

              .hour-slot {
                height: 60px;
                position: relative;
              }

              /*.time-slot {
                height: 40px;
                position: relative;
                background: white;
                border-bottom: 1px solid #eee;
                padding: 2px;
              }*/

              .time-slot {
                height: 60px; // Высота слота = 1 час
                position: relative;
              }

              /*.hour-marker {
                position: absolute;
                left: 4px;
                top: 2px;
                font-size: 0.8em;
                color: #666;
              }*/


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

             /* .day-column {
                background: white;
              }*/

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

              /*.current-time {
                position: absolute;
                left: 0;
                right: 0;
                height: 2px;
                background: #ff4444;
                z-index: 3;
                pointer-events: none;
              }*/

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
                /* Добавляем отступ сверху для header'а */
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


              /* Стили для нерабочих дней */
              /*.non-working-day {
                background-color: rgba(248, 249, 250, 0.4);
                position: relative;
              }*/



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

              /*.non-working-day .day-header {
                opacity: 0.7; 
              }

              .non-working-day .time-slot {
                background-color: transparent !important;
                cursor: default !important;
              }*/



              /* Индикатор в заголовке */
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
                background-color: transparent !important; /* Сбрасываем цвет */
                cursor: default;
              }

              .past-slot {
                background-color: #f8f9fa !important;
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
                  top: 5px; /* Высота header'а */
                  background: white;
                  z-index: 3;
                  padding: 12px 16px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

               /* .calendar-grid {
                  height: calc(100vh - 120px); 
                  margin-top: 0;
                }*/
                /*.calendar-grid {
                  display: flex;
                  overflow-x: auto;
                  min-height: 80vh;
                }*/

                .calendar-grid {
                  grid-template-columns: 50px repeat(auto-fit, minmax(120px, 1fr));
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

                /*.non-working-day {
                  background: repeating-linear-gradient(
                          45deg,
                          #f8f9fa,
                          #f8f9fa 10px,
                          #ffe0e0 10px,
                          #ffe0e0 20px
                  );
                }

                .day-off-badge {
                  font-size: 0.7em;
                  background: #dc3545;
                  color: white;
                  padding: 2px 5px;
                  border-radius: 3px;
                  margin-left: 5px;
                }*/

  

              .notification {
                position: fixed; /* Или absolute, если контейнер позиционирован */
                top: 50%; /* Расположите по своему усмотрению */
                left: 50%;
                transform: translateX(-50%);
                padding: 10px 20px;
                border-radius: 5px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                z-index: 1010; /* Выше модального окна и других элементов */
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
              }


              /* Основные изменения для мобильной версии */
              @media (max-width: 480px) {
                .calendar-container {
                  padding: 8px 4px; /* Уменьшаем боковые отступы */
                }

                .calendar-grid {
                  grid-template-columns: 36px repeat(auto-fit, minmax(90px, 1fr)); /* Более узкая сетка */
                  gap: 2px; /* Уменьшаем промежутки */
                }

                .day-column {
                  min-width: 90px; /* Узкие колонки дней */
                }

                .day-header {
                  padding: 6px 2px; /* Меньше отступы в заголовке */
                  font-size: 0.9em; /* Меньший размер шрифта */
                }

                .hour-marker {
                  font-size: 1em; /* Увеличиваем цифры часов */
                  font-weight: 500; /* Делаем более жирными */
                  left: 2px; /* Сдвигаем ближе к краю */
                }

                .half-hour-line {
                  display: none; /* Скрываем на очень маленьких экранах */
                }

                .time-slot {
                  height: 50px; /* Уменьшаем высоту слотов */
                }
              }

              /* Дополнительные оптимизации для самых маленьких экранов */
              @media (max-width: 360px) {
                .calendar-container {
                  padding: 8px 2px; /* Минимальные отступы */
                }

                .calendar-grid {
                  grid-template-columns: 30px repeat(auto-fit, minmax(80px, 1fr));
                }

                .day-column {
                  min-width: 80px;
                }

                .hour-marker {
                  font-size: 0.9em; /* Оптимальный размер для 360px */
                }
              }

              /* Улучшения для текущей временной линии */
              .current-time {
                height: 3px; /* Делаем более заметной */
              }


            `}</style>
        </div>
    );
}


interface ModalProps {
    data: { date: string; time: string };
    employeeId: number | null; // Добавляем пропс
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
    const [form, setForm] = useState<AppointmentRequest>(
        editingEvent || {
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
            services: [],
            comment: ""
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

        const errors = {
            phone: validatePhone(form.client_phone),
            name: validateName(form.client_name),
            services: form.services.length === 0 ? 'Добавьте хотя бы одну услугу' : ''
        };

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
                        value={form.client_name}
                        onChange={e => setForm({...form, client_name: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label className="block font-semibold mb-1">Клиент: Фамилия</label>
                    <input
                        value={form.client_last_name}
                        onChange={e => setForm({...form, client_last_name: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label className="block font-semibold mb-1">Телефон:</label>
                    <input
                        type="tel"
                        value={form.client_phone}
                        onChange={(e) => {
                            const inputValue = e.target.value;
                            // Форматирование
                            let filteredValue = inputValue
                                .replace(/[^\d+]/g, '')
                                .replace(/^\+?/, '+')
                                .slice(0, 16);

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

                <div className="form-group">
                    <label className="block font-semibold mb-1">Комментарий:</label>
                    <textarea
                        value={form.comment}
                        onChange={e => setForm({...form, comment: e.target.value})}
                    />
                </div>

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
