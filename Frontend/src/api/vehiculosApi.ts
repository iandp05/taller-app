// Frontend/src/api/vehiculosApi.ts
import { api } from './axios';
import { Vehiculo, VehiculoCreate } from '../types';

// Obtener todos los vehículos
export const getVehiculos = async (): Promise<Vehiculo[]> => {
    const response = await api.get<Vehiculo[]>('/vehiculos/');
    return response.data;
};

// Obtener un vehículo por ID
export const getVehiculoById = async (id: number): Promise<Vehiculo> => {
    const response = await api.get<Vehiculo>(`/vehiculos/${id}`);
    return response.data;
};

// Crear un vehículo nuevo
export const createVehiculo = async (vehiculo: VehiculoCreate): Promise<Vehiculo> => {
    const response = await api.post<Vehiculo>('/vehiculos/', vehiculo);
    return response.data;
};

// Actualizar un vehículo
export const updateVehiculo = async (id: number, vehiculo: Partial<VehiculoCreate>): Promise<Vehiculo> => {
    const response = await api.put<Vehiculo>(`/vehiculos/${id}`, vehiculo);
    return response.data;
};

// Eliminar un vehículo
export const deleteVehiculo = async (id: number): Promise<void> => {
    await api.delete(`/vehiculos/${id}`);
};

// Obtener el catálogo de marcas y modelos desde la base de datos
export const getCatalogoVehiculos = async (): Promise<Record<string, string[]>> => {
    const response = await api.get('/vehiculos/catalogo/marcas-modelos');
    return response.data;
};