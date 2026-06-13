"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type AdminDialogPortalProps = {
    children: ReactNode;
    onEscape?: () => void;
};

type ScrollLockSnapshot = {
    scrollX: number;
    scrollY: number;
    htmlOverflow: string;
    bodyOverflow: string;
    bodyPaddingRight: string;
};

let activeLocks = 0;
let scrollLockSnapshot: ScrollLockSnapshot | null = null;

function lockPageScroll() {
    activeLocks += 1;
    if (activeLocks > 1) return;

    const html = document.documentElement;
    const body = document.body;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - html.clientWidth;

    scrollLockSnapshot = {
        scrollX,
        scrollY,
        htmlOverflow: html.style.overflow,
        bodyOverflow: body.style.overflow,
        bodyPaddingRight: body.style.paddingRight,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
    }
}

function unlockPageScroll() {
    activeLocks = Math.max(activeLocks - 1, 0);
    if (activeLocks > 0 || !scrollLockSnapshot) return;

    const html = document.documentElement;
    const body = document.body;
    const snapshot = scrollLockSnapshot;

    html.style.overflow = snapshot.htmlOverflow;
    body.style.overflow = snapshot.bodyOverflow;
    body.style.paddingRight = snapshot.bodyPaddingRight;

    scrollLockSnapshot = null;
    window.scrollTo(snapshot.scrollX, snapshot.scrollY);
}

export default function AdminDialogPortal({ children, onEscape }: AdminDialogPortalProps) {
    const portalTarget = typeof document === "undefined" ? null : document.body;
    const onEscapeRef = useRef(onEscape);

    useEffect(() => {
        onEscapeRef.current = onEscape;
    }, [onEscape]);

    useEffect(() => {
        if (!portalTarget) return;

        const previouslyFocused =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onEscapeRef.current?.();
            }
        };

        lockPageScroll();
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            unlockPageScroll();
            previouslyFocused?.focus({ preventScroll: true });
        };
    }, [portalTarget]);

    return portalTarget ? createPortal(children, portalTarget) : null;
}
