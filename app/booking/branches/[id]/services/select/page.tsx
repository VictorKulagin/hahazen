'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useServices, useAvailability, useAvailableEmployees } from "@/hooks/useBranches";
import { Service, Employee } from "@/services/branchApi";
import { useCreateAppointment } from "@/hooks/useBranches";


type ParamsType = {
    id?: string;
}

type Step = 'services' | 'time' | 'master' | 'confirm';

const ServiceSelectionPage = () => {
    const params = useParams<ParamsType>();
    const branchId = params?.id ? Number(params.id) : null;
    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentStep, setCurrentStep] = useState<Step>('services');
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [selectedMaster, setSelectedMaster] = useState<number | null>(null);
    const [groupedSlots, setGroupedSlots] = useState<{ [date: string]: string[] }>({});

    const { data: services, isLoading, isError, error } = useServices(branchId!);
    const { data: timeSlots } = useAvailability(branchId!, selectedServices);

    const [clientData, setClientData] = useState({
        name: '',
        phone: '',
        comment: ''
    });

    const [selectedDate, selectedTime] = selectedSlot?.split('T') || [];
    const { data: masters } = useAvailableEmployees(
        branchId!,
        selectedDate,
        selectedTime,
        selectedServices
    );

    const { mutate: createAppointment, isPending, isError: isSubmitError, error: submitError } = useCreateAppointment();

    useEffect(() => {
        if (timeSlots) {
            const grouped = timeSlots.reduce((acc: { [date: string]: string[] }, slot) => {
                acc[slot.date] = acc[slot.date] || [];
                if (!acc[slot.date].includes(slot.time)) {
                    acc[slot.date].push(slot.time);
                }
                return acc;
            }, {});
            setGroupedSlots(grouped);
        }
    }, [timeSlots]);

    const handleServiceToggle = (serviceId: number) => {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const handleContinue = () => {
        switch(currentStep) {
            case 'services':
                setCurrentStep('time');
                break;
            case 'time':
                setCurrentStep('master');
                break;
            case 'master':
                setCurrentStep('confirm');
                break;
            case 'confirm':
                handleFinalBooking();
                break;
        }
    };

    const handleFinalBooking = () => {
        if (!branchId || !selectedDate || !selectedTime || !selectedMaster) {
            console.error('Missing required data');
            return;
        }

        const appointmentData = {
            branch_id: branchId,
            employee_id: selectedMaster,
            services: selectedServices.join(','),
            appointment_datetime: `${selectedDate}T${selectedTime}:00`,
            name: clientData.name,
            phone: clientData.phone,
            comment: clientData.comment
        };

        createAppointment(appointmentData, {
            onSuccess: () => {
                // Перенаправление на страницу подтверждения
                window.location.href = '/booking/success';
            }
        });
    };

    if (!branchId || isNaN(branchId)) {
        return <div className="p-4 text-red-500">Invalid branch ID</div>;
    }

    if (isLoading) return <div className="p-4 text-gray-500">Loading...</div>;
    if (isError) return <div className="p-4 text-red-500">Error: {error?.message}</div>;

    const filteredServices = services?.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24">
            {/* Step indicators */}
            <div className="mb-8 flex gap-4">
                <StepIndicator step={1} current={currentStep} target="services" label="Услуги"/>
                <StepIndicator step={2} current={currentStep} target="time" label="Время"/>
                <StepIndicator step={3} current={currentStep} target="master" label="Мастер"/>
                <StepIndicator step={4} current={currentStep} target="confirm" label="Подтверждение"/>
            </div>

            {isSubmitError && (
                <div className="p-4 mb-4 text-red-600 bg-red-50 rounded-lg">
                    Ошибка при создании записи: {submitError?.message}
                </div>
            )}

            {currentStep === 'services' && (
                <>
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold mb-4">Select Services</h1>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search services..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-3 pl-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500"
                            />
                            <svg
                                className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredServices.map(service => (
                            <label
                                key={service.id}
                                className={`p-6 bg-white rounded-xl shadow-sm border-2 transition-all ${
                                    selectedServices.includes(service.id)
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-100 hover:border-green-200'
                                }`}
                            >
                                <div className="flex items-start space-x-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedServices.includes(service.id)}
                                        onChange={() => handleServiceToggle(service.id)}
                                        className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500"
                                    />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>⏳ {service.duration_minutes} min</span>
                                            <span>💲 {service.base_price} ₽</span>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </>
            )}

            {currentStep === 'time' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Select Time</h2>
                    {Object.entries(groupedSlots).map(([date, times]) => (
                        <div key={date} className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="font-medium mb-2">
                                {new Date(date).toLocaleDateString('ru-RU', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </div>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {times.map((time, index) => (
                                    <button
                                        key={`${date}-${index}`}
                                        onClick={() => setSelectedSlot(`${date}T${time}`)}
                                        className={`p-2 text-sm rounded transition-colors ${
                                            selectedSlot === `${date}T${time}`
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-100 hover:bg-green-100'
                                        }`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {currentStep === 'master' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Select Master</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {masters?.map(master => (
                            <button
                                key={master.id}
                                onClick={() => setSelectedMaster(master.id)}
                                className={`p-6 bg-white rounded-xl shadow-sm border-2 transition-all 
                                    ${selectedMaster === master.id
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-100 hover:border-green-200'}`}
                            >
                                <div className="text-left">
                                    <h3 className="text-lg font-semibold mb-2">{master.name}</h3>
                                    <p className="text-sm text-gray-600">
                                        {master.specialization}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {currentStep === 'confirm' && (
                <div className="space-y-6 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold">Подтверждение записи</h2>

                    <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                            <input
                                type="text"
                                value={clientData.name}
                                onChange={(e) => setClientData({...clientData, name: e.target.value})}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                            <input
                                type="tel"
                                value={clientData.phone}
                                onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                            <textarea
                                value={clientData.comment}
                                onChange={(e) => setClientData({...clientData, comment: e.target.value})}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                                rows={3}
                            />
                        </div>
                    </div>
                </div>
            )}


            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
                <div className="flex gap-4">
                    {currentStep !== 'services' && (
                        <button
                            onClick={() => setCurrentStep(prev => {
                                if (prev === 'confirm') return 'master';
                                if (prev === 'master') return 'time';
                                return 'services';
                            })}
                            className="flex-1 py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-50"
                        >
                            Back
                        </button>
                    )}
                    <button
                        onClick={handleContinue}
                        disabled={
                            (currentStep === 'services' && selectedServices.length === 0) ||
                            (currentStep === 'time' && !selectedSlot) ||
                            (currentStep === 'master' && !selectedMaster) ||
                            (currentStep === 'confirm' && (!clientData.name.trim() || !clientData.phone.trim()))
                        }
                        className={`flex-1 py-3 px-6 rounded-lg text-white transition-colors ${
                            (currentStep === 'services' && selectedServices.length > 0) ||
                            (currentStep === 'time' && selectedSlot) ||
                            (currentStep === 'master' && selectedMaster) ||
                            (currentStep === 'confirm' && clientData.name.trim() && clientData.phone.trim())
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-400 cursor-not-allowed'
                        }`}

                    >
                        {isPending
                            ? 'Отправка...'
                            : currentStep === 'confirm'
                                ? 'Подтвердить запись'
                                : 'Продолжить'}
                        {/*{currentStep === 'confirm' ? 'Подтвердить запись' : 'Продолжить'}*/}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StepIndicator = ({
                           step,
                           current,
                           target,
                           label
                       }: {
    step: number;
    current: Step;
    target: Step;
    label: string;
}) => {
    const stepsOrder: Step[] = ['services', 'time', 'master', 'confirm'];
    const currentIndex = stepsOrder.indexOf(current);
    const targetIndex = stepsOrder.indexOf(target);

    const isCompleted = currentIndex >= targetIndex;
    const isActive = current === target;

    return (
        <div className={`flex items-center gap-2 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center 
        ${isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                {step}
            </div>
            <span className={isActive ? 'font-medium' : ''}>{label}</span>
        </div>
    );
};

export default ServiceSelectionPage;
