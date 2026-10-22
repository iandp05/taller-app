// Frontend/src/api/axios.ts
import axios from 'axios';
import { getTallerSlug } from '../utils/subdomain';

// 1. Instancia centralizada para conectar con el backend de FastAPI
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
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

// 3. NUEVO: Interceptor de respuestas (Escudo global contra crasheos)
api.interceptors.response.use(
    (response) => {
        // Si la petición fue exitosa, la dejamos pasar normal
        return response;
    },
    (error) => {
        // A. Si el error viene de FastAPI (ej: 400 Bad Request o 500 Server Error)
        if (error.response) {
            // Si Pydantic devuelve un array de validaciones, lo aplanamos a un solo texto amigable
            if (Array.isArray(error.response.data?.detail)) {
                error.response.data.detail = error.response.data.detail
                    .map((err: any) => `${err.loc?.slice(-1)}: ${err.msg}`)
                    .join('\n');
            }
        } 
        // B. Si el servidor está apagado o no hay internet (Network Error)
        else if (error.request) {
            // Creamos un objeto de respuesta falso para evitar el crasheo de React
            // cuando los componentes intenten leer "error.response?.data?.detail"
            error.response = {
                data: {
                    detail: "No se pudo conectar con el servidor. Revisa si el backend está encendido y tu conexión a internet."
                }
            };
        } 
        // C. Si hubo un error interno de Axios al armar la petición
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