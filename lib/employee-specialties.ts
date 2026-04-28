export type ProCardMode =
    | "body"
    | "face"
    | "eyes"
    | "hands"
    | "feet"
    | "hair"
    | "dental"
    | "text";

export type SpecialtyGroupId =
    | "body"
    | "face"
    | "dental"
    | "aesthetics"
    | "wellness"
    | "technical";

export type SpecialtyOption = {
    id: string;
    label: string;
    groupId: SpecialtyGroupId;
    proCardMode: ProCardMode;
    keywords: string[];
};

export type SpecialtyGroup = {
    id: SpecialtyGroupId;
    label: string;
};

export const SPECIALTY_GROUPS: SpecialtyGroup[] = [
    { id: "body", label: "ТЕЛО" },
    { id: "face", label: "ЛИЦО" },
    { id: "dental", label: "СТОМАТОЛОГИЯ" },
    { id: "aesthetics", label: "ЭСТЕТИКА" },
    { id: "wellness", label: "ОЗДОРОВЛЕНИЕ / ДРУГОЕ" },
    { id: "technical", label: "ТЕХНИЧЕСКИЕ УСЛУГИ" },
];

export const SPECIALTY_OPTIONS: SpecialtyOption[] = [
    {
        id: "massage",
        label: "Массажист (Общий, Спортивный)",
        groupId: "body",
        proCardMode: "body",
        keywords: ["массаж", "массажист", "спортивный массаж", "общий массаж", "mas"],
    },
    {
        id: "osteopath",
        label: "Остеопат / Мануальный терапевт",
        groupId: "body",
        proCardMode: "body",
        keywords: ["остеопат", "мануальный", "терапевт", "тело"],
    },
    {
        id: "depilation",
        label: "Специалист по депиляции (Воск, Шугаринг)",
        groupId: "body",
        proCardMode: "body",
        keywords: ["депиляция", "воск", "шугаринг", "тело"],
    },
    {
        id: "body-hardware",
        label: "Мастер аппаратной коррекции фигуры (LPG, кавитация)",
        groupId: "body",
        proCardMode: "body",
        keywords: ["lpg", "кавитация", "коррекция фигуры", "аппаратная", "тело"],
    },

    {
        id: "cosmetologist",
        label: "Косметолог (Чистка, Уколы)",
        groupId: "face",
        proCardMode: "face",
        keywords: ["косметолог", "чистка", "уколы", "лицо"],
    },
    {
        id: "brow-lash",
        label: "Бровист / Лэшмейкер",
        groupId: "face",
        proCardMode: "eyes",
        keywords: ["бровист", "лэшмейкер", "ресницы", "брови", "глаза"],
    },
    {
        id: "makeup",
        label: "Визажист",
        groupId: "face",
        proCardMode: "face",
        keywords: ["визажист", "макияж", "лицо"],
    },
    {
        id: "permanent-makeup",
        label: "Мастер перманентного макияжа (Татуаж)",
        groupId: "face",
        proCardMode: "face",
        keywords: ["перманент", "татуаж", "перманентный макияж", "лицо"],
    },

    {
        id: "dentist",
        label: "Стоматолог",
        groupId: "dental",
        proCardMode: "dental",
        keywords: ["стоматолог", "стом", "зубы", "зубной", "дент", "dentist"],
    },
    {
        id: "orthodontist",
        label: "Ортодонт",
        groupId: "dental",
        proCardMode: "dental",
        keywords: ["ортодонт", "брекеты", "прикус", "зубы", "дент"],
    },

    {
        id: "manicure",
        label: "Мастер маникюра",
        groupId: "aesthetics",
        proCardMode: "hands",
        keywords: ["маникюр", "ногти", "руки"],
    },
    {
        id: "pedicure",
        label: "Мастер педикюра",
        groupId: "aesthetics",
        proCardMode: "feet",
        keywords: ["педикюр", "подолог", "ноги", "стопы"],
    },
    {
        id: "podiatrist",
        label: "Подолог",
        groupId: "aesthetics",
        proCardMode: "feet",
        keywords: ["подолог", "стопы", "ноги", "педикюр"],
    },
    {
        id: "barber",
        label: "Барбер / Парикмахер",
        groupId: "aesthetics",
        proCardMode: "hair",
        keywords: ["барбер", "парикмахер", "волосы", "стрижка"],
    },

    {
        id: "instructor",
        label: "Инструктор (Йога, Растяжка, Пилатес)",
        groupId: "wellness",
        proCardMode: "text",
        keywords: ["инструктор", "йога", "растяжка", "пилатес"],
    },
    {
        id: "psychologist",
        label: "Психолог / Консультант",
        groupId: "wellness",
        proCardMode: "text",
        keywords: ["психолог", "консультант"],
    },
    {
        id: "tattoo",
        label: "Тату-мастер",
        groupId: "wellness",
        proCardMode: "text",
        keywords: ["тату", "тату-мастер", "мастер тату"],
    },

    {
        id: "technical",
        label: "Технические услуги (Ремонт, Заточка инструмента)",
        groupId: "technical",
        proCardMode: "text",
        keywords: ["ремонт", "заточка", "инструмент", "технические услуги"],
    },
];

export const normalizeSpecialtyText = (value: string) =>
    value.trim().toLocaleLowerCase("ru-RU");

export const getFilteredSpecialties = (query: string) => {
    const normalizedQuery = normalizeSpecialtyText(query);

    if (!normalizedQuery) {
        return SPECIALTY_OPTIONS;
    }

    return SPECIALTY_OPTIONS.filter((option) => {
        if (normalizeSpecialtyText(option.label).includes(normalizedQuery)) {
            return true;
        }

        return option.keywords.some((keyword) =>
            normalizeSpecialtyText(keyword).includes(normalizedQuery),
        );
    });
};

export const findSpecialtyOption = (value: string) => {
    const normalizedValue = normalizeSpecialtyText(value);

    if (!normalizedValue) {
        return null;
    }

    return (
        SPECIALTY_OPTIONS.find(
            (option) => normalizeSpecialtyText(option.label) === normalizedValue,
        ) ?? null
    );
};

export const getProCardModeLabel = (mode: ProCardMode) => {
    switch (mode) {
        case "body":
            return "Тело";
        case "face":
            return "Лицо";
        case "eyes":
            return "Глаза / брови";
        case "hands":
            return "Руки";
        case "feet":
            return "Ноги / стопы";
        case "hair":
            return "Волосы";
        case "dental":
            return "Зубы / челюсть";
        case "text":
            return "Текстовая профкарта";
        default:
            return "Профкарта";
    }
};
