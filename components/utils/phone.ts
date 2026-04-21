export const MIN_PHONE_DIGITS = 7;
export const MAX_PHONE_DIGITS = 15;

export function normalizePhoneInput(value: string): string {
    if (!value) return "";

    // Оставляем только цифры и плюс
    let cleaned = value.replace(/[^\d+]/g, "");

    // Оставляем только один "+" и только в начале
    if (cleaned.includes("+")) {
        cleaned = "+" + cleaned.replace(/\+/g, "");
    }

    // Если пользователь начал с цифры, автоматически добавляем "+"
    if (cleaned && !cleaned.startsWith("+")) {
        cleaned = "+" + cleaned;
    }

    // Оставляем только цифры после "+"
    if (cleaned.startsWith("+")) {
        cleaned = "+" + cleaned.slice(1).replace(/\D/g, "");
    } else {
        cleaned = cleaned.replace(/\D/g, "");
    }

    // Ограничение по длине цифр
    const digitsOnly = cleaned.replace(/\D/g, "").slice(0, MAX_PHONE_DIGITS);

    return digitsOnly ? `+${digitsOnly}` : "";
}

export function getPhoneDigitsCount(phone: string): number {
    return phone.replace(/\D/g, "").length;
}

export function isValidPhone(phone: string): boolean {
    const digitsCount = getPhoneDigitsCount(phone);
    return phone.startsWith("+") && digitsCount >= MIN_PHONE_DIGITS && digitsCount <= MAX_PHONE_DIGITS;
}
