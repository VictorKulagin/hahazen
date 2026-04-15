"use client";

import { useEffect, useState } from "react";

export function useSidebarCollapsed() {
    const [collapsed, setCollapsed] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved !== null) {
            setCollapsed(saved === "true");
        }
        setIsReady(true);
    }, []);

    useEffect(() => {
        if (isReady) {
            localStorage.setItem("sidebar-collapsed", String(collapsed));
        }
    }, [collapsed, isReady]);

    return {
        collapsed,
        setCollapsed,
        isReady,
    };
}
