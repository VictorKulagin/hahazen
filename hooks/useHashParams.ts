// hooks/useHashParams.ts
import { useCallback, useEffect, useState } from 'react';

export const useHashParams = () => {
    const [params, setParams] = useState(() => new URLSearchParams(window.location.hash.substring(1)));

    const updateParams = useCallback(() => {
        setParams(new URLSearchParams(window.location.hash.substring(1)));
    }, []);

    useEffect(() => {
        window.addEventListener('hashchange', updateParams);
        return () => window.removeEventListener('hashchange', updateParams);
    }, [updateParams]);

    return params;
};
