//validations.ts
export const validatePhone = (phone: string): string => {
    if (phone === '+') return 'Введите номер после +';
    if (phone.length < 7) return 'Минимум 6 цифр';
    if (!/^\+[0-9]{6,15}$/.test(phone)) return 'Допустимы только цифры после +';
    return '';
};

export const UI_validatePhone = (phone: string): string => {
    if (!phone) return ''; // Необязательное поле
    return /^\+[0-9]{6,15}$/.test(phone)
        ? ''
        : 'Неверный формат (+ и 6-15 цифр)';
};

export const validateName = (name: string): string => {
    return name.trim().length >= 2
        ? ''
        : 'Имя должно быть не короче 2 символов';
};
