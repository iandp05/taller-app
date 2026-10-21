// Frontend/src/hooks/useAutoRefresh.ts
import { useEffect, useRef } from 'react';
import { api } from '../api/axios';

/**
 * Custom Hook para refrescar datos en tiempo real ÚNICAMENTE cuando la base de datos cambia.
 * Consulta un hash de versión ultra liviano (1 ms) y evita spam de consultas HTTP pesadas en los logs.
 */
export function useAutoRefresh(refreshFn: () => void | Promise<void>, intervalMs: number = 4000) {
    const savedCallback = useRef(refreshFn);
    const lastVersionRef = useRef<string | null>(null);

    useEffect(() => {
        savedCallback.current = refreshFn;
    }, [refreshFn]);

    useEffect(() => {
        const checkVersionAndRefresh = async () => {
            if (document.visibilityState !== 'visible') return;

            try {
                const res = await api.get('/sync/version');
                const currentVersion = res.data?.version;

                if (currentVersion && currentVersion !== lastVersionRef.current) {
                    lastVersionRef.current = currentVersion;
                    await savedCallback.current();
                }
            } catch {
                // Fallback silencioso en caso de pérdida de conexión momentánea
            }
        };

        // 1. Chequeo de versión en segundo plano
        const timer = setInterval(checkVersionAndRefresh, intervalMs);

        // 2. Refresco al enfocar la ventana o cambiar de pestaña
        const handleFocus = () => {
            checkVersionAndRefresh();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(timer);
            window.removeEventListener('focus', handleFocus);
        };
    }, [intervalMs]);
}
