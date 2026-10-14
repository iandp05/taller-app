// Frontend/src/api/updaterApi.ts
import { api } from './axios';

export interface ActualizacionesResponse {
    version_actual: string;
    version_disponible: string;
    hay_actualizacion: boolean;
    download_url: string;
    release_notes: string;
}

export const checkActualizaciones = async (): Promise<ActualizacionesResponse> => {
    const response = await api.get<ActualizacionesResponse>('/actualizaciones/check');
    return response.data;
};
