//components/Calendar/Calendar.ts
"use client";
import React, {useState, useEffect, useRef, useCallback, useMemo} from "react";
import {createAppointment, Appointment, Service, AppointmentRequest} from "@/services/appointmentsApi";
import {useAppointments, DurationOption, useCreateAppointment} from "@/hooks/useAppointments"; // Добавляем импорт
import {usePathname, useSearchParams} from 'next/navigation';
import {useDeleteAppointment} from "@/hooks/useAppointments";
import {useMutation} from '@tanstack/react-query';
import { add30Minutes, generateWeekDates, generateTimeSlots, getWeekRange } from "./utils";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";
import { CalendarEvent } from "./CalendarEvent";


import { useQueryClient } from '@tanstack/react-query';


import {useRouter} from "next/navigation";
import {WeekNavigator} from "@/components/Calendar/WeekNavigator";
import {durationToDays} from "@/components/Calendar/durationToDays"; // Импортируем useRouter


const convertTimeToMinutes = (time: string): number => {
    if (!time || typeof time !== 'string') {
        console.error('Invalid time input:', time);
        return 0;
    }

    const [hours, minutes] = time.split(':').map(Number);

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


    if (branchId === null) return <div>Выберите филиал</div>;// Остальная логика с branchId как number}

    const queryClient = useQueryClient();

    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    // 1. Получение masterId из хэша
    const getEmployeeIdFromHash = useCallback((): number | null => {
        const hash = window.location.hash;
        const match = hash.match(/(?:#|&)master=(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    }, []);

    // 2. Состояние для принудительного обновления
    const [forceUpdateKey, setForceUpdateKey] = useState(0);
    const employeeId = getEmployeeIdFromHash();


    //const {mutate: createAppointment, isPending, isError, error} = useCreateAppointment();


    const {
        mutate: createAppointment,
        isPending,
        isError
    } = useCreateAppointment();


    // Внутри компонента Calendar:
    const {mutate: deleteAppointment} = useDeleteAppointment(/*id*/);

    // 6. Обработка создания записи
    // 3. Запрос данных
// Внутри компонента Calendar:
    const [selectedDuration, setSelectedDuration] = useState<DurationOption>('1-day');
// Обновите вызов хука useAppointments
    const {
        data: groupedAppointments,
        refetch,
        isLoading,
        isError: isAppointmentsError,
        error // Добавляем получение ошибки
    } = useAppointments(
        branchId || undefined,
        employeeId || undefined,
        selectedDuration // Добавляем параметр длительности
    );

    console.log('Данные из API:', groupedAppointments);




    useEffect(() => {
        console.log('Current request params:', {
            branchId: branchId ?? 'undefined',
            employeeId: employeeId ?? 'undefined',
            duration: selectedDuration
        });
    }, [branchId, employeeId, selectedDuration]);


    useEffect(() => {
        if (!isLoading && groupedAppointments) {
            console.log('Grouped Appointments Data:', groupedAppointments);
            console.log('Dates:', Object.keys(groupedAppointments));
            console.log('Count:', Object.values(groupedAppointments).flat().length);
        }
    }, [groupedAppointments, isLoading]);

    const [modalData, setModalData] = useState<{ date: string; time: string } | null>(null);

    const [currentStartDate, setCurrentStartDate] = useState(new Date());

    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const dates = useMemo(
        () => generateWeekDates(currentStartDate, selectedDuration),
        [currentStartDate, selectedDuration]
    );
    const MemoizedCalendarEvent = React.memo(CalendarEvent);
    const MemoizedWeekNavigator = React.memo(WeekNavigator);



    const calendarRef = useRef<HTMLDivElement>(null);

    const times = generateTimeSlots();

    const handleCellClick = useCallback((date: string, time: string) => {
        if (!modalData) { // Проверяем, не открыто ли уже модальное окно
            setModalData({ date, time });
        }
    }, [modalData]);

    console.log(branchId + " Branch ID");
    console.log(employeeId + " EmployeeId ID");

    // 4. Обработчик изменений хэша
    const handleHashChange = useCallback(() => {
        const newId = getEmployeeIdFromHash();
        setForceUpdateKey(prev => prev + 1); // Принудительное обновление
        refetch();
    }, [refetch, getEmployeeIdFromHash]);

    useEffect(() => {
        console.log('Current dates:', dates);
        console.log('generateWeekDates input:', {
            baseDate: currentStartDate,
            duration: selectedDuration
        });
    }, [dates]);

    useEffect(() => {
        console.log('Полученные данные:',
            Object.entries(groupedAppointments || {}).map(([date, events]) => ({
                date,
                count: events?.length
            }))
        );
    }, [groupedAppointments]);


    useEffect(() => {
        console.log('[Calendar] State updated:', modalData);
    }, [modalData]);


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

    /*useEffect(() => {
        const start = new Date(event.appointment_datetime);
        const end = new Date(start.getTime() + event.total_duration * 60000);

        console.log("Расчет позиции для события:", {
            eventId: event.id,
            serverTime: event.appointment_datetime,
            localStart: start.toString(),
            localEnd: end.toString(),
            calculatedTop: start.getHours() * 80 + (start.getMinutes() / 60 * 80),
            //cssTop: startMinutes * 1.333
        });
    }, []);*/



    // 5. Эффекты для отслеживания изменений
    useEffect(() => {
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
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
    /*ВУ*/
    /*useEffect(() => {
        setDates(generateWeekDates(currentStartDate));
        setTimeout(scrollToCurrentTime, 100);
    }, [currentStartDate]);*/


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


    const handleWeekChange = (direction: 'prev' | 'next') => {
        setCurrentStartDate(prev => {
            const newDate = new Date(prev);
            const days = durationToDays(selectedDuration);
            newDate.setDate(prev.getDate() + (direction === 'prev' ? -1 : days));
            refetch(); // Добавляем обновление данных
            return newDate;
        });
    };


// В компоненте Calendar.tsx обновляем handleAddEvent
// 1. Исправляем обработчик создания события
    const handleAddEvent = useCallback((data: Omit<Appointment, 'id'>) => {
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
            services: data.services.map(s => ({
                service_id: s.service_id,
                qty: s.qty
            })),
            comment: data.comment || ""
        };

        createAppointment(appointmentData, {
            onSuccess: () => {
                // Инвалидация кэша и принудительный перезапрос
                queryClient.invalidateQueries(['appointments']);
                setModalData(null);
            }
        });
    }, [branchId, employeeId, createAppointment, queryClient]);

    // Добавляем обработку состояний
    if (isPending) {
        return <div>Создание записи...</div>;
    }

    if (isError) {
        return <div>Ошибка: {error?.message}</div>;
    }

    const getDayClass = (date: string) => {
        const today = new Date().toISOString().split('T')[0];
        const isPast = date < today;
        const isToday = date === today;

        return `
      day-column
      ${isPast ? 'past-day' : ''}
      ${isToday ? 'current-day' : ''}
    `;
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

    return (
        <div className="calendar-container" ref={calendarRef}>

            {/* === Блок уведомления === */}
            {notification && (
                <div className={`notification ${notification.type}`}>
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="close-notification">&times;</button>
                </div>
            )}
            {/* === Конец блока уведомления === */}


            <MemoizedWeekNavigator
                currentStartDate={currentStartDate}
                selectedDuration={selectedDuration}
                onDurationChange={handleDurationChange}
                onWeekChange={handleWeekChange}
            />

            <div className="calendar-grid">
                <div className="time-column">
                    {times.map((time, index) => (
                        <div key={time} className="time-slot">
                            {index % 2 === 0 && (
                                <span className="hour-marker">
                  {time.split(':')[0]}
                </span>
                            )}
                            <span className="time-text">{time}</span>
                        </div>
                    ))}
                    <CurrentTimeIndicator/>
                </div>

                {dates.map(date => (

                    <div key={date} className={getDayClass(date)}>
                        <div className="day-header">
                            {new Date(date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                day: 'numeric'
                            })}
                        </div>
                        <div className="day-content">
                            {times.map(time => {
                                const [hours, minutes] = time.split(':').map(Number);
                                const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                                const currentEvents = groupedAppointments?.[date]?.[formattedTime] || [];

                                // Исправленная логика проверки времени
                                const now = new Date();
                                const [year, month, day] = date.split('-').map(Number);

                                // Создаём полную дату слота с учётом локального времени
                                const slotDateTime = new Date(year, month - 1, day, hours, minutes);

                                // Правильное сравнение с текущим моментом
                                const isPast = slotDateTime < now;

                                return (
                                    <div
                                        key={`${date}-${formattedTime}`}
                                        className={`time-slot ${isPast ? 'past-slot' : 'future-slot'}`}
                                        onClick={() => !isPast && setModalData({ date, time })}
                                    >
                                        {currentEvents.map(event => (
                                            <MemoizedCalendarEvent
                                                key={event.id}
                                                event={event}
                                                onDelete={handleDeleteAppointment}
                                            />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {modalData && (
                <Modal
                    data={modalData}
                    onSave={data => {
                        handleAddEvent({
                            ...data,
                            client_last_name: "",
                            employee_id: employeeId,
                            branch_id: branchId,
                            services: data.services || [],
                        });
                        setModalData(null);
                    }}
                    onClose={() => setModalData(null)}
                />
            )}

            <style jsx>{`
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

              .time-column {
                position: sticky;
                left: 0;
                background: white;
                z-index: 2;
              }

              .time-slot {
                height: 40px;
                position: relative;
                background: white;
                border-bottom: 1px solid #eee;
                padding: 2px;
              }

              .hour-marker {
                position: absolute;
                left: 4px;
                top: 2px;
                font-size: 0.8em;
                color: #666;
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
                position: absolute;
                left: 0;
                right: 0;
                height: 2px;
                background: #ff4444;
                z-index: 3;
                pointer-events: none;
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
                .calendar-grid {
                  display: flex;
                  overflow-x: auto;
                  min-height: 80vh;
                }
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


            `}</style>
        </div>
    );
}

const Modal = ({data, onSave, onClose}: {
    data: { date: string; time: string };
    onSave: (data: Omit<Appointment, 'id'>) => void;
    onClose: () => void;
}) => {
    const [form, setForm] = useState<Omit<Appointment, 'id'>>({
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
        total_duration: 30
    });

    const handleAddService = () => {
        setForm(prev => ({
            ...prev,
            services: [...prev.services, {service_id: 0, qty: 1}]
        }));
    };

// В компоненте Modal
    const handleSubmit = () => {
        // Рассчет длительности
        const start = new Date(`${data.date}T${form.time_start}`);
        const end = new Date(`${data.date}T${form.time_end}`);
        const duration = (end.getTime() - start.getTime()) / 60000;

        onSave({
            ...form,
            total_duration: duration
        });
    };


    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3>New Appointment</h3>

                <div className="form-group">
                    <label>Client Name:</label>
                    <input
                        value={form.client_name}
                        onChange={e => setForm({...form, client_name: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label>Client Last Name:</label>
                    <input
                        value={form.client_last_name}
                        onChange={e => setForm({...form, client_last_name: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label>Phone:</label>
                    <input
                        value={form.client_phone}
                        onChange={e => setForm({...form, client_phone: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label>Comment:</label>
                    <textarea
                        value={form.comment}
                        onChange={e => setForm({...form, comment: e.target.value})}
                    />
                </div>

                <div className="time-selection">
                    <div className="form-group">
                        <label>Start Time:</label>
                        <input
                            type="time"
                            value={form.time_start}
                            onChange={e => setForm({...form, time_start: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>End Time:</label>
                        <input
                            type="time"
                            value={form.time_end}
                            onChange={e => setForm({...form, time_end: e.target.value})}
                        />
                    </div>
                </div>

                <div className="services-section">
                    <h4>Services:</h4>
                    {form.services.map((service, index) => (
                        <div key={index} className="service-item">
                            <input
                                type="number"
                                placeholder="Service ID"
                                value={service.service_id}
                                onChange={e => {
                                    const newServices = [...form.services];
                                    newServices[index].service_id = Number(e.target.value);
                                    setForm({...form, services: newServices});
                                }}
                            />
                            <input
                                type="number"
                                placeholder="Qty"
                                value={service.qty}
                                onChange={e => {
                                    const newServices = [...form.services];
                                    newServices[index].qty = Number(e.target.value);
                                    setForm({...form, services: newServices});
                                }}
                            />
                        </div>
                    ))}
                    <button onClick={handleAddService}>Add Service</button>
                </div>

                <div className="modal-actions">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={handleSubmit}>Save</button>
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
              }

              button:last-child {
                background: #007bff;
                color: white;
              }

            `}</style>
        </div>
    );
};



    export default Calendar;
