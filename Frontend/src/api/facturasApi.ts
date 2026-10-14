// Frontend/src/api/facturasApi.ts
import { api } from './axios';
import { Factura, FacturaCreate } from '../types';

export const getFacturas = async (): Promise<Factura[]> => {
    try {
        const response = await api.get<Factura[]>('/facturas/');
        return Array.isArray(response.data) ? response.data : [];
    } catch {
        return [];
    }
};

export const getFacturaById = async (id: number): Promise<Factura> => {
    const response = await api.get<Factura>(`/facturas/${id}`);
    return response.data;
};

export const createFactura = async (factura: FacturaCreate): Promise<Factura> => {
    const response = await api.post<Factura>('/facturas/', factura);
    return response.data;
};

export const deleteFactura = async (id: number, reponerStock: boolean = true): Promise<void> => {
    await api.delete(`/facturas/${id}`, { params: { reponer_stock: reponerStock } });
};
