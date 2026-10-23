// Frontend/src/api/axios.ts
import axios from 'axios';
import { getTallerSlug } from '../utils/subdomain';

// Detecta automáticamente la URL del servidor según el entorno (Render Web vs Escritorio)
const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost:5173')) {
        return window.location.origin;
    }
    return 'http://localhost:8000';
};

// 1. Instancia centralizada para conectar con el backend de FastAPI
export const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Interceptor de peticiones (Seguridad, Tokens y Subdominio Multi-Tenant)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('taller_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Inyectamos el subdominio del taller automáticamente en cada petición
        const tallerSlug = getTallerSlug();
        config.headers['X-Taller-Slug'] = tallerSlug;

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Interceptor de respuestas (Escudo global contra crasheos)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            if (Array.isArray(error.response.data?.detail)) {
                error.response.data.detail = error.response.data.detail
                    .map((err: any) => `${err.loc?.slice(-1)}: ${err.msg}`)
                    .join('\n');
            }
        } 
        else if (error.request) {
            error.response = {
                data: {
                    detail: "No se pudo conectar con el servidor. Revisa si el backend está encendido y tu conexión a internet."
                }
            };
        } 
        else {
            error.response = {
                data: {
                    detail: "Ocurrió un error inesperado en la aplicación."
                }
            };
        }

        return Promise.reject(error);
    }
);
