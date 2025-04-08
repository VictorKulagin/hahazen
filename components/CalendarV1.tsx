import { useState, useEffect } from "react";

// Получение данных с сервера при рендере
export async function getServerSideProps() {
    const res = await fetch("http://localhost:3000/api/events");
    const events = await res.json();
    return { props: { initialEvents: events } };
}

export default function Calendar({ initialEvents }) {
    const [events, setEvents] = useState(initialEvents || []);
    const [modalData, setModalData] = useState(null);
    const [isClient, setIsClient] = useState(false); // Флаг для проверки, что мы на клиенте

    // Используем useEffect, чтобы обновить флаг после монтирования компонента на клиенте
    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleAddEvent = async (eventData) => {
        const res = await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventData),
        });

        if (res.ok) {
            const newEvent = await res.json();
            setEvents([...events, newEvent]);
        }
    };

    const handleDeleteEvent = async (eventData) => {
        const res = await fetch("/api/events", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventData),
        });

        if (res.ok) {
            setEvents(events.filter((e) => !(e.date === eventData.date && e.time === eventData.time)));
        }
    };

    const handleEditEvent = async (eventData) => {
        const res = await fetch("/api/events", {
            method: "PUT", // Используем PUT для редактирования
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventData),
        });

        if (res.ok) {
            const updatedEvent = await res.json();
            setEvents(events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))); // Обновляем список
        }
    };

    if (!isClient) {
        return null;
    }

    return (
        <div>
            <h1>Календарь</h1>
            <div>
                {events?.length > 0 ? (
                    events.map((event, index) => (
                        <div key={index}>
                            {event.date} {event.time} - {event.service} ({event.name})
                            <button onClick={() => handleDeleteEvent(event)}>Удалить</button>
                            <button onClick={() => setModalData(event)}>Редактировать</button>
                        </div>
                    ))
                ) : (
                    <p>Нет событий</p>
                )}
                <button onClick={() => setModalData({})}>Добавить событие</button>
            </div>

            {modalData && (
                <Modal
                    data={modalData}
                    onSave={(data) => {
                        if (data.id) {
                            // Если у события есть id, значит это редактирование
                            handleEditEvent(data);
                        } else {
                            // Если id нет, то это добавление нового события
                            handleAddEvent(data);
                        }
                        setModalData(null);
                    }}
                    onClose={() => setModalData(null)}
                />
            )}
        </div>
    );
}

function Modal({ data, onSave, onClose }) {
    const [form, setForm] = useState(data);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="modal">
            <input name="name" placeholder="Имя" onChange={handleChange} value={form.name || ""} />
            <input name="service" placeholder="Услуга" onChange={handleChange} value={form.service || ""} />
            <input name="date" type="date" onChange={handleChange} value={form.date || ""} />
            <input name="time" type="time" onChange={handleChange} value={form.time || ""} />
            <button onClick={() => onSave(form)}>Сохранить</button>
            <button onClick={onClose}>Отмена</button>
        </div>
    );
}
