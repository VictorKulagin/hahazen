"use client";

import { createContext, useContext } from "react";
import type { AppTheme } from "./theme.types";

type ThemeContextType = {
    theme: AppTheme;
    setTheme: (theme: AppTheme) => void;
    toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used inside ThemeProvider");
    }

    return context;
};
