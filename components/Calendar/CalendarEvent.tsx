// components/Calendar/CalendarEvent.tsx
import { AppointmentRequest, AppointmentService } from "@/types/appointments";
import { formatMoney } from "@/lib/currency";
import { normalizePhoneInput } from "@/components/utils/phone";

// 1. Добавим тип для редактируемого события (в types/Appointment.ts)
export interface Appointment extends AppointmentRequest {
    id: number;
}


interface CalendarEventProps {
    event: Appointment;
    onDelete: (id: number) => void;
    onEdit: (event: Appointment) => void; // Добавьте пропс
    currencyCode?: string | null;
}

export const CalendarEvent = ({ event, onDelete, onEdit, currencyCode }: CalendarEventProps) => {

    //console.log('CalendarEvent received:', JSON.stringify(event, null, 2));
    // Проверка наличия обязательных полей
    //@ts-ignore
    if (!event.appointment_datetime) {
        console.error("Некорректные данные события:", event);
        return null;
    }
    //@ts-ignore
    const localStart = new Date(event.appointment_datetime);
    //@ts-ignore
    const localEnd = new Date(localStart.getTime() + event.total_duration * 60000);

    const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation(); // <--- Вот это остановит всплытие события
        onDelete(event.id);
    };

    try {
        //console.log("ККорректные данные события:", event.appointment_datetime);
        //@ts-ignore
        const startDate = new Date(event.appointment_datetime);
        const timezoneOffset = startDate.getTimezoneOffset() * 60000;
        const localStartDate = new Date(startDate.getTime() - timezoneOffset);

        // Рассчет времени окончания
        const endDate = new Date(
            //@ts-ignore
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
        const pxPerMinute = 1.5; // масштаб — можешь менять
        const durationMinutes = endMinutes - startMinutes;

        const eventStyle = {
            top: `${startMinutes * pxPerMinute}px`,
            height: `${durationMinutes * pxPerMinute}px`
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




                {/* 📱 Мобильная версия */}
                <div className="block sm:hidden bg-white rounded-lg shadow-sm p-2">
                    <div className="flex flex-col">
                        {/* Имя и телефон в одну строку */}
                        <div className="flex justify-between items-center">
      <span className="font-semibold text-base text-gray-900 truncate">

        {           //@ts-ignore

            event.client.name}

          {           //@ts-ignore

              event.client_last_name}
      </span>
                            <span className="text-sm text-gray-700 ml-2 truncate">
        📞 {           //@ts-ignore
                                normalizePhoneInput(event.client.phone ?? "")}
      </span>
                        </div>

                        {/* Комментарий (если есть) */}
                        {/*{event.comment && (
                            <div className="text-xs text-gray-500 mt-1 truncate">
                                💬 {event.comment}
                            </div>
                        )}*/}
                    </div>
                </div>

                {/* 🖥 Десктопная версия */}
                <div className="hidden sm:block bg-white rounded-xl shadow-sm p-0 -m-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex flex-col">
                            <div className="font-semibold text-gray-900 text-base truncate">

                                {           //@ts-ignore
                                    event.client.name} {event.client_last_name}
                            </div>
                            <div className="text-sm text-gray-700 flex items-center gap-1 truncate max-w-xs">

                                📞 {
                                //@ts-ignore
                                normalizePhoneInput(event.client.phone ?? "")}
                            </div>
                            {/*{event.comment && (
                                <div className="text-sm text-gray-500 mt-1 truncate">
                                    💬 {event.comment}
                                </div>
                            )}*/}
                        </div>
                        <div className="text-sm text-blue-600 whitespace-nowrap mt-2 sm:mt-0">
                            🕒 {localStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {localEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {event.services?.length > 0 && (
                                <div className="border-t border-gray-100 pt-1 space-y-1 max-w-xs">
                                    {event.services.map(service => (
                                        // @ts-ignore
                                        <div key={service.id} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-900 truncate max-w-[140px]">{           //@ts-ignore
                                                service.name}</span>

                                            <span className="text-green-600 font-semibold">💰

                                                {
                                                    // @ts-ignore
                                                    formatMoney(service.individual_price, currencyCode)
                                                }</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Ошибка отрисовки события:", error);
        return null;
    }

};

