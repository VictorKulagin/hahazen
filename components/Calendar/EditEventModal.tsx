import React, { useState, useEffect } from 'react';
import { AppointmentRequest } from '@/services/appointmentsApi';
import { useServices, useEmployeeServices } from '@/hooks/useServices';
import { validatePhone, validateName } from '@/components/Validations';

interface EditEventModalProps {
    event: AppointmentRequest;
    onSave: (data: AppointmentRequest) => void;
    onClose: () => void;
    employeeId: number | null; // Добавить пропс
}

export const EditEventModal = ({ event, onSave, onClose, employeeId }: EditEventModalProps) => {
    const [form, setForm] = useState<AppointmentRequest>({} as AppointmentRequest);
    // Внутри компонента:
    const [validationErrors, setValidationErrors] = useState({
        phone: '',
        name: '',
        services: ''
    });
    const { data: services } = useServices();
    const {
        data: employeeServices,
        isLoading: isLoadingEmployeeServices
    } = useEmployeeServices(employeeId || undefined);

    console.log('EditModal props:', { event, onSave, onClose });

    useEffect(() => {
        if (event) {
            // Парсим дату и время
            const start = new Date(event.appointment_datetime);
            const end = new Date(start.getTime() + event.total_duration * 60000);

            // Извлекаем данные клиента
            // @ts-ignore
            const client = event.client || {};

            const convertedServices = event.services?.map(s => ({
                service_id: s.id ?? 0,  // если ид отсутствует, ставим 0 (или выбросьте ошибку),
                qty: s.qty || 1, // Используйте актуальное поле из данных
                individual_price: s.individual_price,
                // @ts-ignore
                duration_minutes: s.service_duration_minutes
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


        const errors = {
            phone: validatePhone(form.client_phone),
            name: validateName(form.client_name),
            services: form.services.length === 0 ? 'Добавьте хотя бы одну услугу' : ''
        };


        onSave({
            ...form,
            total_duration: duration
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                    ✖
                </button>
                <h2 className="text-xl font-bold mb-4">Редактирование записи #{// @ts-ignore
                    event.id}</h2>
                <div className="form-group">
                    <label className="block font-semibold mb-1">Клиент: Имя</label>
                    <input
                        value={form.client_name || ''}
                        onChange={e => setForm({ ...form, client_name: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label className="block font-semibold mb-1">Клиент: Фамилия</label>
                    <input
                        value={form.client_last_name || ''}
                        onChange={e => setForm({ ...form, client_last_name: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label className="block font-semibold mb-1">Телефон:</label>
                    <input
                        type="tel"
                        value={form.client_phone || ''}
                        //onChange={e => setForm({ ...form, client_phone: e.target.value })}
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
                        placeholder="+123456789012345"
                    />
                    {validationErrors.phone && (
                        <div className="text-red-500 text-sm mt-1">{validationErrors.phone}</div>
                    )}
                </div>
                <div className="form-group">
                    <label className="block font-semibold mb-1">Комментарий:</label>
                    <textarea
                        value={form.comment || ''}
                        onChange={e => setForm({ ...form, comment: e.target.value })}
                        style={{
                            border: "1px solid #ddd", // black solid border
                            borderRadius: "5px",      // rounded corners
                            padding: "8px"            // padding inside textarea
                        }}
                    />
                </div>
                <div className="time-selection">
                    <div className="form-group">
                        <label className="block font-semibold mb-1">Начало:</label>
                        <input
                            type="time"
                            value={form.time_start || ''}
                            onChange={e => setForm({ ...form, time_start: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="block font-semibold mb-1">Окончание:</label>
                        <input
                            type="time"
                            value={form.time_end || ''}
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
                                {employeeServices?.map(svc => ( // Используем employeeServices
                                    <option key={// @ts-ignore
                                        svc.service_id} value={svc.service_id}>
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
                                    setForm({ ...form, services: newServices });
                                }}
                            />
                            <button
                                className="bg-red-500 text-white rounded-full /*w-6*/ h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
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
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        Добавить услугу
                    </button>
                </div>
                <div className="modal-actions">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600"
                    >Отмена</button>
                    <button
                        type="submit"
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        onClick={handleSubmit}
                    >Сохранить</button>
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

 /* .form-group {
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
*/


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
  
  .modal-actions {
    margin-top: 1.5rem;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }


  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  button[type="button"] {
    //background: #f0f0f0;
  }

  button[type="submit"] {
   // background: #3182ce;
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


  .time-selection {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
`}</style>



        </div>
    );
};



