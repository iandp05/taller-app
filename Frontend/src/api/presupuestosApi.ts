// Frontend/src/api/presupuestosApi.ts
import { api } from './axios';
import { Presupuesto, PresupuestoCreate } from '../types';

export const getPresupuestos = async (): Promise<Presupuesto[]> => {
    const response = await api.get<Presupuesto[]>('/presupuestos/');
    return response.data;
};

export const getPresupuestoById = async (id: number): Promise<Presupuesto> => {
    const response = await api.get<Presupuesto>(`/presupuestos/${id}`);
    return response.data;
};

export const createPresupuesto = async (presupuesto: PresupuestoCreate): Promise<Presupuesto> => {
    const response = await api.post<Presupuesto>('/presupuestos/', presupuesto);
    return response.data;
};

export const updatePresupuesto = async (id: number, presupuesto: Partial<PresupuestoCreate>): Promise<Presupuesto> => {
    const response = await api.put<Presupuesto>(`/presupuestos/${id}`, presupuesto);
    return response.data;
};

export const deletePresupuesto = async (id: number): Promise<void> => {
    await api.delete(`/presupuestos/${id}`);
};