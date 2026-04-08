import type { AppTheme } from "./theme.types";

const THEME_KEY = "app-theme";

export const getStoredTheme = (): AppTheme | null => {
    if (typeof window === "undefined") return null;

    const value = localStorage.getItem(THEME_KEY);

    if (value === "light" || value === "dark") {
        return value;
    }

    return null;
};

export const setStoredTheme = (theme: AppTheme) => {
    if (typeof window === "undefined") return;

    localStorage.setItem(THEME_KEY, theme);
};
