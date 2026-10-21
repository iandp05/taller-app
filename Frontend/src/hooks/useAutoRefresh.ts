// Frontend/src/hooks/useAutoRefresh.ts
import { useEffect, useRef } from 'react';

/**
 * Custom Hook para refrescar datos automáticamente en tiempo real (Polling silencioso + Foco de Ventana)
 * sin reiniciar la pantalla ni causar parpadeos en la interfaz.
 */
export function useAutoRefresh(refreshFn: () => void | Promise<void>, intervalMs: number = 5000) {
    const savedCallback = useRef(refreshFn);

    useEffect(() => {
        savedCallback.current = refreshFn;
    }, [refreshFn]);

    useEffect(() => {
        // 1. Polling silencioso en segundo plano cuando la pantalla está visible
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') {
                savedCallback.current();
            }
        }, intervalMs);

        // 2. Refresco inmediato cuando el usuario vuelve a enfocar la ventana / pestaña
        const handleFocus = () => {
            savedCallback.current();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(timer);
            window.removeEventListener('focus', handleFocus);
        };
    }, [intervalMs]);
}
