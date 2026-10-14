// Frontend/src/api/configuracionApi.ts
import { api } from './axios';
import { ConfiguracionTaller } from '../types';

export const getConfiguracion = async (): Promise<ConfiguracionTaller> => {
    const response = await api.get<ConfiguracionTaller>('/configuracion/');
    return response.data;
};

export const updateConfiguracion = async (config: Partial<ConfiguracionTaller>): Promise<ConfiguracionTaller> => {
    const response = await api.put<ConfiguracionTaller>('/configuracion/', config);
    return response.data;
};
