"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme/theme.context";
import clsx from "clsx";

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className={clsx(
                "relative inline-flex h-10 w-20 items-center rounded-full p-1",
                "border border-white/10",
                "bg-[#111827]",
                "shadow-[inset_0_1px_2px_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.25)]",
                "transition-all duration-300 ease-in-out",
                "hover:scale-[1.02] active:scale-[0.98]"
            )}
        >
      <span className="absolute left-3 flex items-center justify-center">
        <Moon
            size={16}
            className={clsx(
                "transition-colors duration-300",
                isDark ? "text-white" : "text-white/40"
            )}
        />
      </span>

            <span className="absolute right-3 flex items-center justify-center">
        <Sun
            size={16}
            className={clsx(
                "transition-colors duration-300",
                !isDark ? "text-white" : "text-white/40"
            )}
        />
      </span>

            <span
                className={clsx(
                    "absolute top-1 h-8 w-8 rounded-full",
                    "bg-gradient-to-b from-[#4ade80] to-[#22c55e]",
                    "shadow-[0_0_18px_rgba(34,197,94,0.45),0_4px_10px_rgba(0,0,0,0.35)]",
                    "transition-all duration-300 ease-in-out",
                    isDark ? "left-1" : "left-[calc(100%-2.25rem)]"
                )}
            />
        </button>
    );
};
