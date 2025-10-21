/*//hooks/useEmployeeId
"use client";
import { useState, useEffect } from 'react';

export const useEmployeeId = () => {
    const [employeeId, setEmployeeIdState] = useState<number | null>(null);
debugger;
    useEffect(() => {
        const extractId = () => {
            if (typeof window === 'undefined') return;

            const match = window.location.hash.match(/master=(\d+)/);
            const id = match ? parseInt(match[1], 10) : null;
            setEmployeeIdState(id);
        };

        // Ждём полной загрузки DOM (иногда `useEffect` срабатывает слишком рано)
        requestAnimationFrame(() => {
            extractId();
        });

        window.addEventListener('hashchange', extractId);

        return () => {
            window.removeEventListener('hashchange', extractId);
        };
    }, []);

    const setEmployeeId = (id: number | null) => {
        const path = window.location.pathname;
        const search = window.location.search;
        const newHash = id ? `#master=${id}` : '';
        window.history.pushState(null, '', `${path}${search}${newHash}`);
        window.dispatchEvent(new Event('hashchange'));
    };

    return { employeeId, setEmployeeId };
};*/


// hooks/useEmployeeId.ts
/*"use client";
import { useState, useEffect, useCallback } from 'react';

export const useEmployeeId = () => {
    const extractFromHash = useCallback((): number | null => {
        if (typeof window === 'undefined') return null;
        const hash = window.location.hash;
        console.log('🔗 Current hash:', hash);
        const match = hash.match(/master=(\d+)/);
        const result = match ? parseInt(match[1], 10) : null;
        console.log('🔗 Extracted employeeId:', result);
        return result;
    }, []);

    const [employeeId, setEmployeeIdState] = useState<number | null>(null);

    // Инициализация при монтировании
    useEffect(() => {
        const initialId = extractFromHash();
        console.log('🔍 Initial employeeId:', initialId);
        setEmployeeIdState(initialId);
    }, [extractFromHash]);

    // Обработчик изменения hash
    useEffect(() => {
        const handleHashChange = () => {
            const id = extractFromHash();
            console.log('🔗 Hash changed → employeeId:', id);
            setEmployeeIdState(id);
        };

        // Добавляем слушатели для разных событий
        window.addEventListener('hashchange', handleHashChange);
        window.addEventListener('popstate', handleHashChange);

        // Проверяем hash при каждом рендере (на случай программного изменения)
        const checkHash = () => {
            const currentId = extractFromHash();
            setEmployeeIdState(prev => {
                if (prev !== currentId) {
                    console.log('🔄 Hash updated programmatically:', currentId);
                    return currentId;
                }
                return prev;
            });
        };

        const intervalId = setInterval(checkHash, 100);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
            window.removeEventListener('popstate', handleHashChange);
            clearInterval(intervalId);
        };
    }, [extractFromHash]);

    const setEmployeeId = useCallback((id: number | null) => {
        console.log('✅ useEmployeeId: setting employeeId =', id);
        setEmployeeIdState(id);

        const path = window.location.pathname;
        const search = window.location.search;
        const newHash = id ? `#master=${id}` : '';
        const newUrl = `${path}${search}${newHash}`;

        window.history.replaceState(null, '', newUrl);

        // Диспатчим события для уведомления других компонентов
        window.dispatchEvent(new Event('hashchange'));
        window.dispatchEvent(new Event('popstate'));
    }, []);

    return { employeeId, setEmployeeId };
};*/

// hooks/useEmployeeId.ts
/*"use client";
import { useState, useEffect, useCallback, useLayoutEffect } from 'react';

export const useEmployeeId = () => {
    const extractFromHash = useCallback((): number | null => {
        if (typeof window === 'undefined') return null;
        const hash = window.location.hash;
        const match = hash.match(/master=(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    }, []);

    // ИСПРАВЛЕНИЕ: Инициализируем useState с правильным значением
    const [employeeId, setEmployeeIdState] = useState<number | null>(() => {
        // При первой инициализации пытаемся извлечь из hash
        if (typeof window !== 'undefined') {
            const initial = extractFromHash();
            console.log('🚀 Initial employeeId from hash:', initial);
            return initial;
        }
        return null;
    });

    // ИСПРАВЛЕНИЕ: Используем useLayoutEffect для синхронного выполнения
    useLayoutEffect(() => {
        const id = extractFromHash();
        console.log('🎬 useLayoutEffect: setting employeeId to:', id);
        if (id !== employeeId) {
            setEmployeeIdState(id);
        }
    }, [extractFromHash, employeeId]);

    // Обычный useEffect для hashchange
    useEffect(() => {
        const handleHashChange = () => {
            const id = extractFromHash();
            console.log('🔔 Hash changed → employeeId:', id);
            setEmployeeIdState(id);
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [extractFromHash]);

    const setEmployeeId = useCallback((id: number | null) => {
        setEmployeeIdState(id);
        const path = window.location.pathname;
        const search = window.location.search;
        const newHash = id ? `#master=${id}` : '';
        window.history.replaceState(null, '', `${path}${search}${newHash}`);
        window.dispatchEvent(new Event('hashchange'));
    }, []);

    console.log('🔄 useEmployeeId returning:', employeeId);
    return { employeeId, setEmployeeId };
};*/

// hooks/useEmployeeId.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ
"use client";
import { useState, useEffect, useCallback, useLayoutEffect } from 'react';

export const useEmployeeId = () => {
    const extractFromHash = useCallback((): number | null => {
        if (typeof window === 'undefined') return null;
        const hash = window.location.hash;
        const match = hash.match(/master=(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    }, []);

    const [employeeId, setEmployeeIdState] = useState<number | null>(() => {
        if (typeof window !== 'undefined') {
            return extractFromHash();
        }
        return null;
    });

    // ИСПРАВЛЕНИЕ: Убираем employeeId из зависимостей чтобы избежать цикла
    useLayoutEffect(() => {
        const id = extractFromHash();
        console.log('🎬 useLayoutEffect: extracted ID:', id);
        setEmployeeIdState(prev => {
            if (prev !== id) {
                console.log('🎬 Updating employeeId from', prev, 'to', id);
                return id;
            }
            return prev;
        });
    }, [extractFromHash]); // Убрали employeeId отсюда!

    useEffect(() => {
        const handleHashChange = () => {
            const id = extractFromHash();
            console.log('🔔 Hash changed → employeeId:', id);
            setEmployeeIdState(id);
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [extractFromHash]);

    const setEmployeeId = useCallback((id: number | null) => {
        setEmployeeIdState(id);
        const path = window.location.pathname;
        const search = window.location.search;
        const newHash = id ? `#master=${id}` : '';
        window.history.replaceState(null, '', `${path}${search}${newHash}`);
        window.dispatchEvent(new Event('hashchange'));
    }, []);

    return { employeeId, setEmployeeId };
};
