import { useState, useEffect } from 'react';
import { AppointmentRequest } from '@/services/appointmentsApi';
import { useServices } from '@/hooks/useServices';

interface EditEventModalProps {
    event: AppointmentRequest;
    onSave: (data: AppointmentRequest) => void;
    onClose: () => void;
}

export const EditEventModal = ({ event, onSave, onClose }: EditEventModalProps) => {
    const [form, setForm] = useState<AppointmentRequest>({} as AppointmentRequest);
    const { data: services } = useServices();

    console.log('EditModal props:', { event, onSave, onClose });

    useEffect(() => {
        if (event) {
            // Парсим дату и время
            const start = new Date(event.appointment_datetime);
            const end = new Date(start.getTime() + event.total_duration * 60000);

            // Извлекаем данные клиента
            const client = event.client || {};

            // Преобразуем услуги
            const convertedServices = event.services?.map(s => ({
                service_id: s.id,
                qty: 1 // Замените на фактическое количество, если оно есть в данных
            })) || [];

            setForm({
                ...event,
                // Распаковываем данные клиента
                client_name: client.name || '',
                client_last_name: client.last_name || '',
                client_phone: client.phone || '',
                services: convertedServices,
                // Форматируем время
                date: start.toISOString().split('T')[0],
                time_start: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
                time_end: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
            });

            console.log('Processed form data:', {
                client_name: client.name,
                client_phone: client.phone,
                time_start: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
                time_end: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
            });
        }

    }, [event]);

    const handleSubmit = () => {
        const start = new Date(`${form.date}T${form.time_start}`);
        const end = new Date(`${form.date}T${form.time_end}`);
        const duration = (end.getTime() - start.getTime()) / 60000;

        onSave({
            ...form,
            total_duration: duration
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3>Редактирование записи #{event.id}</h3>
                <div className="form-group">
                    <label>Имя клиента:</label>
                    <input
                        value={form.client_name || ''}
                        onChange={e => setForm({ ...form, client_name: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Фамилия клиента:</label>
                    <input
                        value={form.client_last_name || ''}
                        onChange={e => setForm({ ...form, client_last_name: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Телефон:</label>
                    <input
                        value={form.client_phone || ''}
                        onChange={e => setForm({ ...form, client_phone: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Комментарий:</label>
                    <textarea
                        value={form.comment || ''}
                        onChange={e => setForm({ ...form, comment: e.target.value })}
                    />
                </div>
                <div className="time-selection">
                    <div className="form-group">
                        <label>Начало:</label>
                        <input
                            type="time"
                            value={form.time_start}
                            onChange={e => setForm({ ...form, time_start: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Окончание:</label>
                        <input
                            type="time"
                            value={form.time_end}
                            onChange={e => setForm({ ...form, time_end: e.target.value })}
                        />
                    </div>
                </div>
                <div className="services-section">
                    <h4>Услуги:</h4>
                    {form.services && form.services.map((service, index) => (
                        <div key={index} className="service-item">
                            <select
                                value={service.service_id}
                                onChange={e => {
                                    const newServices = [...form.services];
                                    newServices[index].service_id = Number(e.target.value);
                                    setForm({ ...form, services: newServices });
                                }}
                            >
                                <option value={0}>Выберите услугу</option>
                                {services?.map(svc => (
                                    <option key={svc.id} value={svc.id}>{svc.name}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min="1"
                                value={service.qty}
                                onChange={e => {
                                    const newServices = [...form.services];
                                    newServices[index].qty = Math.max(1, Number(e.target.value));
                                    setForm({ ...form, services: newServices });
                                }}
                            />
                            <button
                                className="delete-service"
                                onClick={() => {
                                    const newServices = form.services.filter((_, i) => i !== index);
                                    setForm({ ...form, services: newServices });
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => setForm(prev => ({
                            ...prev,
                            services: [...prev.services, { service_id: 0, qty: 1 }]
                        }))}
                    >
                        Добавить услугу
                    </button>
                </div>
                <div className="modal-actions">
                    <button onClick={onClose}>Отмена</button>
                    <button onClick={handleSubmit}>Сохранить</button>
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
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
  }

  .modal-actions {
    margin-top: 1.5rem;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  button[type="button"] {
    background: #f0f0f0;
  }

  button[type="submit"] {
    background: #3182ce;
    color: white;
  }

  .service-item {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .edit-modal {
    z-index: 1001;
  }
`}</style>



        </div>
    );
};



