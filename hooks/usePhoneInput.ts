import { useState, useCallback } from 'react';

const usePhoneInput = (initialValue: string = "+") => {
    const [phone, setPhone] = useState(initialValue);

    const handlePhoneChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            // Удаляем все символы, кроме цифр и плюса
            let cleanedValue = inputValue.replace(/[^\d+]/g, '');

            // Если плюса нет в начале - добавляем
            if (!cleanedValue.startsWith('+')) {
                cleanedValue = '+' + cleanedValue.replace(/\D/g, '');
            }

            // Ограничиваем максимальную длину (1 '+' + 15 цифр = 16 символов)
            const MAX_LENGTH = 16;
            const truncatedValue = cleanedValue.slice(0, MAX_LENGTH);

            setPhone(truncatedValue);
        },
        []
    );

    const resetPhone = useCallback(() => setPhone(initialValue), [initialValue]);

    return {
        phone,
        handlePhoneChange,
        resetPhone,
    };
};

export default usePhoneInput;
