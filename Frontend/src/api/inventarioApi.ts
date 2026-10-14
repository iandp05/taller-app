// Frontend/src/api/inventarioApi.ts
import { api } from './axios';
import { Producto, ProductoCreate } from '../types';

export const getProductos = async (): Promise<Producto[]> => {
    try {
        const response = await api.get<Producto[]>('/inventario/');
        return Array.isArray(response.data) ? response.data : [];
    } catch {
        return [];
    }
};

export const getProductoById = async (id: number): Promise<Producto> => {
    const response = await api.get<Producto>(`/inventario/${id}`);
    return response.data;
};

export const createProducto = async (producto: ProductoCreate): Promise<Producto> => {
    const response = await api.post<Producto>('/inventario/', producto);
    return response.data;
};

export const updateProducto = async (id: number, producto: Partial<ProductoCreate>): Promise<Producto> => {
    const response = await api.put<Producto>(`/inventario/${id}`, producto);
    return response.data;
};

export const deleteProducto = async (id: number): Promise<void> => {
    await api.delete(`/inventario/${id}`);
};
