"use client";

import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./theme.context";
import type { AppTheme } from "./theme.types";
import { getStoredTheme, setStoredTheme } from "./theme.storage";

type ThemeProviderProps = {
    children: React.ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [theme, setThemeState] = useState<AppTheme>("dark");

    useEffect(() => {
        const storedTheme = getStoredTheme();

        if (storedTheme) {
            setThemeState(storedTheme);
        }
    }, []);

    useEffect(() => {
        const root = document.documentElement;

        root.classList.remove("light", "dark");
        root.classList.add(theme);

        setStoredTheme(theme);
    }, [theme]);

    const setTheme = (value: AppTheme) => {
        setThemeState(value);
    };

    const toggleTheme = () => {
        setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
    };

    const value = useMemo(
        () => ({
            theme,
            setTheme,
            toggleTheme,
        }),
        [theme]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
