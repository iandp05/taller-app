// Frontend/src/utils/subdomain.ts

/**
 * Helper para extraer dinámicamente el identificador (slug) del taller desde la URL.
 * Ejemplos:
 * - gustavo.mitaller.com -> "gustavo"
 * - rosario.mitaller.duckdns.org -> "rosario"
 * - gustavo.127.0.0.1.nip.io:5173 -> "gustavo"
 * - localhost:5173 -> "default"
 */
export const getTallerSlug = (): string => {
    if (typeof window === 'undefined') return 'default';

    const hostname = window.location.hostname.toLowerCase();

    // 1. Caso desarrollo local o IP pura
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const overrideSlug = localStorage.getItem('taller_slug_override');
        return overrideSlug ? overrideSlug.trim().toLowerCase() : 'default';
    }

    // 2. Caso prueba con nip.io (ej: gustavo.127.0.0.1.nip.io)
    if (hostname.includes('.nip.io')) {
        const parts = hostname.split('.nip.io')[0].split('.');
        if (parts.length > 0 && parts[0]) {
            return parts[0].trim().toLowerCase();
        }
    }

    // 3. Caso producción con subdominio real (ej: gustavo.mitaller.com)
    const parts = hostname.split('.');
    if (parts.length >= 3) {
        // El primer elemento antes del primer punto es el slug del taller
        return parts[0].trim().toLowerCase();
    }

    return 'default';
};
