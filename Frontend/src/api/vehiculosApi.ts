// Frontend/src/api/vehiculosApi.ts
import { api } from './axios';
import { Vehiculo, VehiculoCreate } from '../types';

export const getVehiculos = async (): Promise<Vehiculo[]> => {
    const response = await api.get<Vehiculo[]>('/vehiculos/');
    return response.data;
};

export const getVehiculoById = async (id: string | number): Promise<Vehiculo> => {
    const response = await api.get<Vehiculo>(`/vehiculos/${id}`);
    return response.data;
};

export const createVehiculo = async (vehiculo: VehiculoCreate): Promise<Vehiculo> => {
    const response = await api.post<Vehiculo>('/vehiculos/', vehiculo);
    return response.data;
};

export const updateVehiculo = async (id: string | number, vehiculo: Partial<VehiculoCreate>): Promise<Vehiculo> => {
    const response = await api.put<Vehiculo>(`/vehiculos/${id}`, vehiculo);
    return response.data;
};

export const deleteVehiculo = async (id: string | number): Promise<void> => {
    await api.delete(`/vehiculos/${id}`);
};

export const getCatalogoVehiculos = async (): Promise<Record<string, string[]>> => {
    const response = await api.get('/vehiculos/catalogo/marcas-modelos');
    return response.data;
};
