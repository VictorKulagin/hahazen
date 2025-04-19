// components/Calendar/CalendarEvent.tsx
import {Appointment, AppointmentRequest} from "@/services/appointmentsApi";

// 1. Добавим тип для редактируемого события (в types/Appointment.ts)
export interface Appointment extends AppointmentRequest {
    id: number;
}


interface CalendarEventProps {
    event: Appointment;
    onDelete: (id: number) => void;
    onEdit: (event: Appointment) => void; // Добавьте пропс
}

export const CalendarEvent = ({ event, onDelete, onEdit }: CalendarEventProps) => {

    console.log('CalendarEvent received:', JSON.stringify(event, null, 2));
    // Проверка наличия обязательных полей
    if (!event.appointment_datetime) {
        console.error("Некорректные данные события:", event);
        return null;
    }

    const localStart = new Date(event.appointment_datetime);
    const localEnd = new Date(localStart.getTime() + event.total_duration * 60000);

    const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation(); // <--- Вот это остановит всплытие события
        onDelete(event.id);
    };

    try {
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
                //onClick={() => onEdit(event)} // Добавьте обработчик
                onClick={(e) => {
                    console.log('Edit button clicked for event:', event.id);
                    e.stopPropagation(); // Блокируем всплытие события
                    onEdit(event);
                }}
            >
                <div className="event-time">
                    {localStart.toLocaleTimeString()} - {localEnd.toLocaleTimeString()}
                </div>
                <div className="event-content" onClick={() => onEdit(event)}>
                    {/* ... */}
                </div>
                <div className="event-content">
                    <button
                        className="delete-btn"
                        onClick={handleDeleteClick}
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
