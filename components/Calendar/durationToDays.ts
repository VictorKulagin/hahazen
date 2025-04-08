import {DurationOption} from "@/hooks/useAppointments";

export const durationToDays = (duration: DurationOption): number => {
    return {
        '1-day': 1,
        '2-days': 2,
        '3-days': 3,
        '4-days': 4,
        '5-days': 5,
        '6-days': 6,
        'week': 7
    }[duration];
};
