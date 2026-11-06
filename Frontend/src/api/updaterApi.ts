// Frontend/src/api/updaterApi.ts
import { api } from './axios';

export interface ActualizacionesResponse {
    version_actual: string;
    version_disponible: string;
    hay_actualizacion: boolean;
    download_url: string;
    release_notes: string;
}

export interface ProgresoActualizacionResponse {
    descargando: boolean;
    porcentaje: number;
    completado: boolean;
    error: string | null;
    mensaje: string;
}

export const checkActualizaciones = async (): Promise<ActualizacionesResponse> => {
    const response = await api.get<ActualizacionesResponse>('/actualizaciones/check');
    return response.data;
};

export const iniciarActualizacion = async (): Promise<ProgresoActualizacionResponse> => {
    const response = await api.post<ProgresoActualizacionResponse>('/actualizaciones/iniciar');
    return response.data;
};

export const getProgresoActualizacion = async (): Promise<ProgresoActualizacionResponse> => {
    const response = await api.get<ProgresoActualizacionResponse>('/actualizaciones/progreso');
    return response.data;
};
