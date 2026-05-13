const CURRENCY_LOCALES: Record<string, string> = {
    KGS: "ru-KG",
    KZT: "ru-KZ",
    RUB: "ru-RU",
    USD: "en-US",
    EUR: "de-DE",
};

export const normalizeCurrencyCode = (currencyCode?: string | null) =>
    (currencyCode || "KGS").toUpperCase();

export const formatMoney = (
    value: number | string | null | undefined,
    currencyCode?: string | null
) => {
    const currency = normalizeCurrencyCode(currencyCode);
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat(CURRENCY_LOCALES[currency] ?? "ru-RU", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
};
