// Frontend/src/api/ordenesApi.ts
import { api } from './axios';
import { OrdenTrabajo, OrdenCreate } from '../types';

export const getOrdenes = async (): Promise<OrdenTrabajo[]> => {
    const response = await api.get<OrdenTrabajo[]>('/ordenes/');
    return response.data;
};

export const getOrdenById = async (id: string | number): Promise<OrdenTrabajo> => {
    const response = await api.get<OrdenTrabajo>(`/ordenes/${id}`);
    return response.data;
};

export const createOrden = async (orden: OrdenCreate): Promise<OrdenTrabajo> => {
    const response = await api.post<OrdenTrabajo>('/ordenes/', orden);
    return response.data;
};

export const updateOrden = async (id: string | number, orden: Partial<OrdenCreate>): Promise<OrdenTrabajo> => {
    const response = await api.put<OrdenTrabajo>(`/ordenes/${id}`, orden);
    return response.data;
};

export const deleteOrden = async (id: string | number, reponerStock: boolean = true): Promise<void> => {
    await api.delete(`/ordenes/${id}`, { params: { reponer_stock: reponerStock } });
};
