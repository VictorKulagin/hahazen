import { useState, useEffect } from "react";

// Получение данных с сервера
export async function getServerSideProps() {
    const res = await fetch("http://localhost:3000/api/events");
    const events = await res.json();
    return { props: { initialEvents: events } };
}

export default function Calendar({ initialEvents }) {
    const [events, setEvents] = useState(initialEvents || []);
    const [modalData, setModalData] = useState(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Обработка клика по времени
    const handleTimeClick = (e, date, time) => {
        setModalData({ date, time }); // Открываем модальное окно с датой и временем
    };

    // Добавление события
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

    if (!isClient) return null;

    // Генерация временной шкалы
    const times = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

    return (
        <div>
            <h1>Календарь</h1>
            <div className="calendar">
                {["2024-06-28", "2024-06-29", "2024-06-30"].map((date) => (
                    <div key={date} className="day-column">
                        <h3>{date}</h3>
                        {times.map((time) => (
                            <div
                                key={time}
                                className="time-slot"
                                onClick={(e) => handleTimeClick(e, date, time)}
                            >
                                {events
                                    .filter((event) => event.date === date && event.time === time)
                                    .map((event, index) => (
                                        <div key={index} className="event">
                                            {event.service} ({event.name})
                                        </div>
                                    ))}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {modalData && (
                <Modal
                    data={modalData}
                    onSave={(data) => {
                        handleAddEvent(data);
                        setModalData(null);
                    }}
                    onClose={() => setModalData(null)}
                />
            )}

            <style jsx>{`
                .calendar {
                    display: flex;
                }
                .day-column {
                    border: 1px solid #ddd;
                    width: 100px;
                    padding: 10px;
                }
                .time-slot {
                    border-bottom: 1px solid #eee;
                    height: 30px;
                    cursor: pointer;
                }
                .event {
                    background-color: #b3e5fc;
                    margin: 2px;
                    padding: 5px;
                    border-radius: 5px;
                    font-size: 12px;
                }
            `}</style>
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
            <style jsx>{`
                .modal {
                    position: fixed;
                    top: 30%;
                    left: 40%;
                    background: white;
                    padding: 20px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
                    border-radius: 5px;
                }
            `}</style>
        </div>
    );
}
