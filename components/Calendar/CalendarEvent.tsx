// components/Calendar/CalendarEvent.tsx
import { AppointmentRequest } from "@/services/appointmentsApi";

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
                className="group bg-white border border-gray-200 rounded-lg shadow-sm p-3
                       transition-all duration-200 ease-in-out cursor-pointer
                       hover:transform hover:-translate-y-0.5 hover:shadow-md"
                style={eventStyle}
                data-testid="calendar-event"
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(event);
                }}
            >
                <button
                    className="absolute top-1 right-1 bg-red-100 text-red-600 rounded-full
                         w-6 h-6 flex items-center justify-center opacity-0
                         transition-opacity duration-200 group-hover:opacity-100
                         hover:bg-red-200 hover:text-red-700"
                    onClick={handleDeleteClick}
                    aria-label="Удалить запись"
                >
                    ×
                </button>




                <div className="bg-white rounded-xl shadow-sm p-1 space-y-3">
                    {/* Заголовок события */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex flex-col">
                            <div className="font-semibold text-gray-900 text-base">
                                {event.client.name} {event.client_last_name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                📞 {event.client.phone}
                            </div>
                        </div>
                        <div className="text-sm text-blue-600 whitespace-nowrap">
                            🕒 {localStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {localEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {/* Список услуг */}
                            {event.services?.length > 0 && (
                                <div className="border-t border-gray-100 pt-1 space-y-1">
                                    {event.services.map(service => (
                                        <div key={service.id} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-900">{service.name}</span>
                                            <span className="text-green-600 font-semibold">
                        💰 {service.individual_price} ₽
                    </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Комментарий */}
                    {/*event.comment && (
                        <div className="text-xs text-gray-600 bg-gray-50 rounded-md p-2">
                            📝 {event.comment}
                        </div>
                    )*/}
                </div>
            </div>
        );
    } catch (error) {
        console.error("Ошибка отрисовки события:", error);
        return null;
    }

};

