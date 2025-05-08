'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useServices, useAvailability } from "@/hooks/useBranches";
import { Service, AvailabilitySlot } from "@/services/branchApi";

type ParamsType = {
    id?: string;
}

const ServiceSelectionPage = () => {
    const params = useParams<ParamsType>();
    const branchId = params?.id ? Number(params.id) : null;
    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentStep, setCurrentStep] = useState<'services' | 'time'>('services');
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [groupedSlots, setGroupedSlots] = useState<{ [date: string]: string[] }>({});

    const { data: services, isLoading, isError, error } = useServices(branchId!);
    const { data: timeSlots } = useAvailability(branchId!, selectedServices, currentStep === 'time');

    useEffect(() => {
        if (timeSlots) {
            const grouped = timeSlots.reduce((acc: { [date: string]: string[] }, slot) => {
                acc[slot.date] = acc[slot.date] || [];
                acc[slot.date].push(slot.time);
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
        currentStep === 'services'
            ? setCurrentStep('time')
            : console.log('Booking data:', { selectedServices, slot: selectedSlot });
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
                <div className={`flex items-center gap-2 ${currentStep === 'services' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center 
            ${currentStep === 'services' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                        1
                    </div>
                    <span>Services</span>
                </div>
                <div className={`flex items-center gap-2 ${currentStep === 'time' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center 
            ${currentStep === 'time' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                        2
                    </div>
                    <span>Time</span>
                </div>
            </div>

            {currentStep === 'services' ? (
                <>
                    {/* Service search */}
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

                    {/* Services list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredServices.length > 0 ? (
                            filteredServices.map(service => (
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
                            ))
                        ) : (
                            <div className="col-span-full text-center py-8 text-gray-500">
                                {services ? 'No services found' : 'Loading...'}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Select Time</h2>
                    {Object.keys(groupedSlots).length > 0 ? (
                        Object.entries(groupedSlots).map(([date, times]) => (
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
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No available slots
                        </div>
                    )}
                </div>
            )}

            {/* Bottom control panel */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
                <div className="flex gap-4">
                    {currentStep === 'time' && (
                        <button
                            onClick={() => setCurrentStep('services')}
                            className="flex-1 py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-50"
                        >
                            Back
                        </button>
                    )}
                    <button
                        onClick={handleContinue}
                        disabled={
                            (currentStep === 'services' && selectedServices.length === 0) ||
                            (currentStep === 'time' && !selectedSlot)
                        }
                        className={`flex-1 py-3 px-6 rounded-lg text-white transition-colors ${
                            (currentStep === 'services' && selectedServices.length > 0) ||
                            (currentStep === 'time' && selectedSlot)
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {currentStep === 'services' ? 'Continue' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServiceSelectionPage;
