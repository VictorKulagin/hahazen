//components/Calendar.ts
"use client";
import {useState, useEffect, useRef, useCallback} from "react";
import {createAppointment, Appointment, Service} from "@/services/appointmentsApi";
import {useAppointments, DurationOption, useCreateAppointment} from "@/hooks/useAppointments"; // Добавляем импорт
import {usePathname, useSearchParams} from 'next/navigation';
import {useDeleteAppointment} from "@/hooks/useAppointments";
import {useMutation, useQueryClient} from '@tanstack/react-query';

import {useRouter} from "next/navigation"; // Импортируем useRouter


const add30Minutes = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes + 30);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};


const getWeekRange = (startDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `
        ${start.toLocaleDateString('en-US', {day: 'numeric'})} - 
        ${end.toLocaleDateString('en-US', {day: 'numeric', month: 'short'})}
    `;
};

const generateTimeSlots = () => {
    return Array.from({length: 48}, (_, i) => {
        const hours = Math.floor(i / 2);
        const minutes = (i % 2) * 30;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    });
};

const generateWeekDates = (startDate: Date): string[] => {
    return Array.from({length: 7}).map((_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        return date.toISOString().split("T")[0];
    });
};

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

const CurrentTimeIndicator = () => {
    const [top, setTop] = useState(0);

    useEffect(() => {
        const updatePosition = () => {
            const now = new Date();
            const minutes = now.getHours() * 60 + now.getMinutes();
            setTop(minutes * 1.333);
        };

        updatePosition();
        const interval = setInterval(updatePosition, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="current-time" style={{top: `${top}px`}}>
            <div className="line"/>
            <div className="circle"/>
        </div>
    );
};




const CalendarEvent = ({
                           event,
                           onDelete
                       }: {
    event: Appointment;
    onDelete: (id: number) => void;
}) => {
    // Проверка наличия обязательных полей
    if (!event.appointment_datetime) {
        console.error("Некорректные данные события:", event);
        return null;
    }
    try {
        // Коррекция часового пояса (UTC → локальное время)
        //console.log("ККорректные данные события:", event.appointment_datetime);




        const startDate = new Date(event.appointment_datetime);
        const timezoneOffset = startDate.getTimezoneOffset() * 60000;
        const localStartDate = new Date(startDate.getTime() - timezoneOffset);

        // Рассчет времени окончания
        const endDate = new Date(
            localStartDate.getTime() + event.total_duration * 60000
        );

        // Конвертация времени в минуты для позиционирования
        const startMinutes =
            localStartDate.getHours() * 60 +
            localStartDate.getMinutes();

        const endMinutes =
            endDate.getHours() * 60 +
            endDate.getMinutes();

        // Стили для позиционирования
        const eventStyle = {
            top: `${startMinutes * 1.333}px`,
            height: `${(endMinutes - startMinutes) * 1.333}px`
        };

        return (
            <div
                className="event"
                style={eventStyle}
                data-testid="calendar-event"
            >
                <div className="event-content">
                    <button
                        className="delete-btn"
                        onClick={() => onDelete(event.id)}
                        aria-label="Удалить запись"
                    >
                        ×
                    </button>
                    <div className="event-header">
                        <span className="event-title">
                            {event.client.name}
                        </span>
                        <span className="event-time">
                            {localStartDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                            })} –{" "}
                            {endDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                            })}
                        </span>
                    </div>
                    {event.services?.length > 0 && (
                        <div className="event-services">
                            {event.services.map(service => (
                                <div
                                    key={service.id}
                                    className="service-badge"
                                >
                                    {service.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error("Ошибка отрисовки события:", error);
        return null;
    }
};


    interface CalendarProps {
        branchId: number | null;
        // employeeId?: number; // Опциональный параметр, если потребуется
    }

const Calendar: React.FC<CalendarProps> = ({ branchId }) => {


    if (branchId === null) return <div>Выберите филиал</div>;// Остальная логика с branchId как number}

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
    const [selectedDuration, setSelectedDuration] = useState<DurationOption>('week');
// Обновите вызов хука useAppointments
    const {
        data: groupedAppointments,
        refetch,
        isLoading,
        isError: isAppointmentsError,
        error: appointmentsError
    } = useAppointments(
        branchId || undefined,
        employeeId || undefined,
        selectedDuration // Добавляем параметр длительности
    );

    console.log('Данные из API:', groupedAppointments);

    const [modalData, setModalData] = useState<{ date: string; time: string } | null>(null);
    const [currentStartDate, setCurrentStartDate] = useState<Date>(() => {
        const date = new Date();
        date.setDate(date.getDate() - date.getDay() + 1);
        return date;
    });

    const [dates, setDates] = useState<string[]>([]);
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

    useEffect(() => {
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
        /*const localStart = new Date(event.appointment_datetime.replace(' ', 'T'));
        if (isNaN(localStart.getTime())) {
            console.error('[Calendar] Ошибка: некорректная дата у события', event);
            return null; // или поставить значение по умолчанию
        }*/
    }, []);

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

    useEffect(() => {
        setDates(generateWeekDates(currentStartDate));
        setTimeout(scrollToCurrentTime, 100);
    }, [currentStartDate]);


    // Основной эффект для отслеживания изменений
    const scrollToCurrentTime = () => {
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        const scrollPosition = minutes * 1.333 - 200;
        calendarRef.current?.scrollTo(0, scrollPosition);
    };

    const handleWeekChange = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentStartDate);
        newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
        setCurrentStartDate(newDate);
    };


// Внутри компонента Calendar
    const handleAddEvent = useCallback((data: Omit<Appointment, 'id'>) => {
        if (isPending) return;

        createAppointment(data, {
            onSuccess: () => {
                setModalData(null);
                refetch();
            }
        });
    }, [isPending, createAppointment]);

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
                },
                onError: (error) => {
                    console.error("Ошибка удаления:", error);
                    alert(`Ошибка удаления: ${error.message}`);
                }
            });
        }
    };

    return (
        <div className="calendar-container" ref={calendarRef}>
            <div className="week-navigation">
                <div className="navigation-wrapper">
                    <button
                        className="nav-button prev"
                        onClick={() => handleWeekChange('prev')}
                    >
                        ←
                    </button>

                    <div className="month-info">
                        <h2 className="month-title">
                            {currentStartDate.toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric'
                            })}
                        </h2>
                        <div className="week-range">
                            {getWeekRange(currentStartDate)}
                        </div>
                    </div>


                    {/* Добавьте селектор для выбора периода*/}
                    <div className="duration-selector">
                        <select
                            value={selectedDuration}
                            onChange={(e) => setSelectedDuration(e.target.value as DurationOption)}
                        >
                            <option value="1-day">1 день</option>
                            <option value="2-days">2 дня</option>
                            <option value="3-days">3 дня</option>
                            <option value="4-days">4 дня</option>
                            <option value="5-days">5 дней</option>
                            <option value="6-days">6 дней</option>
                            <option value="week">Неделя</option>
                        </select>
                    </div>

                    <button
                        className="nav-button next"
                        onClick={() => handleWeekChange('next')}
                    >
                        →
                    </button>
                </div>
            </div>

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

                                // Новый код: проверка на прошедшее время
                                const now = new Date();
                                const slotDate = new Date(date);
                                const isPast = slotDate < new Date() ||
                                    (slotDate.toDateString() === now.toDateString() &&
                                        (hours < now.getHours() ||
                                            (hours === now.getHours() && minutes < now.getMinutes())));

                                return (
                                    <div
                                        key={`${date}-${formattedTime}`}
                                        className={`time-slot ${isPast ? 'past-slot' : 'future-slot'}`}
                                        onClick={() => !isPast && setModalData({date, time})}
                                    >
                                        {currentEvents.map(event => (
                                            <CalendarEvent
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

              .calendar-grid {
                display: grid;
                grid-template-columns: 100px repeat(7, 1fr);
                gap: 1px;
                background: #e0e0e0;
                border: 1px solid #e0e0e0;
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

              .day-column {
                background: white;
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

                .calendar-grid {
                  height: calc(100vh - 120px); /* 100vh - header - navigation */
                  margin-top: 0;
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
        employee_id: 1,
        company_id: 1,
        date: data.date,
        time_start: data.time,
        time_end: add30Minutes(data.time),
        services: []
    });

    const handleAddService = () => {
        setForm(prev => ({
            ...prev,
            services: [...prev.services, {service_id: 0, qty: 1}]
        }));
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
                    <label>Phone:</label>
                    <input
                        value={form.client_phone}
                        onChange={e => setForm({...form, client_phone: e.target.value})}
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
                    <button onClick={() => onSave(form)}>Save</button>
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
