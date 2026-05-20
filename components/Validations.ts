// validations.ts
import {
    getPhoneDigitsCount,
    isValidPhone,
    MIN_PHONE_DIGITS,
    MAX_PHONE_DIGITS,
} from "@/components/utils/phone";

export const validatePhone = (phone: string): string => {
    if (!phone) return "Введите номер телефона";
    if (phone === "+") return "Введите номер после +";
    if (!phone.startsWith("+")) return "Номер должен начинаться с +";
    if (!/^\+\d+$/.test(phone)) return "Допустимы только цифры после +";
    if (getPhoneDigitsCount(phone) < MIN_PHONE_DIGITS) {
        return `Минимум ${MIN_PHONE_DIGITS} цифр`;
    }
    if (getPhoneDigitsCount(phone) > MAX_PHONE_DIGITS) {
        return `Максимум ${MAX_PHONE_DIGITS} цифр`;
    }
    return "";
};

export const UI_validatePhone = (phone: string): string => {
    if (!phone) return "";
    return isValidPhone(phone)
        ? ""
        : `Неверный формат: + и ${MIN_PHONE_DIGITS}-${MAX_PHONE_DIGITS} цифр`;
};

export const validateName = (name: string): string => {
    return name.trim().length >= 2
        ? ""
        : "Имя должно быть не короче 2 символов";
};
