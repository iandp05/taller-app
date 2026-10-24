// Frontend/src/api/facturasApi.ts
import { api } from './axios';
import { Factura, FacturaCreate } from '../types';

export const getFacturas = async (): Promise<Factura[]> => {
    const response = await api.get<Factura[]>('/facturas/');
    return response.data;
};

export const getFacturaById = async (id: string | number): Promise<Factura> => {
    const response = await api.get<Factura>(`/facturas/${id}`);
    return response.data;
};

export const createFactura = async (factura: FacturaCreate): Promise<Factura> => {
    const response = await api.post<Factura>('/facturas/', factura);
    return response.data;
};

export const deleteFactura = async (id: string | number, reponerStock: boolean = true): Promise<void> => {
    await api.delete(`/facturas/${id}`, { params: { reponer_stock: reponerStock } });
};
