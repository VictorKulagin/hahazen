// components/Calendar/WeekNavigator.tsx
'use client';
import { useState } from 'react';
import { getWeekRange } from './utils';
import {DurationOption} from "@/hooks/useAppointments";

interface WeekNavigatorProps {
    currentStartDate: Date;
    onWeekChange: (direction: 'prev' | 'next') => void;
    selectedDuration: DurationOption;
    onDurationChange: (duration: DurationOption) => void;
}

export const WeekNavigator = ({
                                  currentStartDate,
                                  onWeekChange,
                                  selectedDuration,
                                  onDurationChange
                              }: WeekNavigatorProps) => (
    <div className="sticky top-0 bg-white z-10 py-4 px-6 shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
            <button
                onClick={() => onWeekChange('prev')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
                ←
            </button>

            <div className="text-center">
                <h2 className="text-xl font-semibold">
                    {currentStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="text-gray-600 text-sm">
                    {getWeekRange(currentStartDate)}
                </div>
            </div>

            <select
                value={selectedDuration}
                onChange={(e) => onDurationChange(e.target.value as DurationOption)}
                className="px-3 py-1 border rounded-md"
            >
                {['1-day', '2-days', '3-days', '4-days', '5-days', '6-days', 'week'].map(option => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>

            <button
                onClick={() => onWeekChange('next')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
                →
            </button>
        </div>
    </div>
);
