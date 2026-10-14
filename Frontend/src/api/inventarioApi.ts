// Frontend/src/api/inventarioApi.ts
import { api } from './axios';
import { Producto, ProductoCreate } from '../types';

// Obtener todo el inventario
export const getProductos = async (): Promise<Producto[]> => {
    const response = await api.get<Producto[]>('/inventario/');
    return response.data;
};

// Obtener un producto específico
export const getProductoById = async (id: number): Promise<Producto> => {
    const response = await api.get<Producto>(`/inventario/${id}`);
    return response.data;
};

// Crear un nuevo repuesto/producto
export const createProducto = async (producto: ProductoCreate): Promise<Producto> => {
    const response = await api.post<Producto>('/inventario/', producto);
    return response.data;
};

// Actualizar un producto (precio, cantidad, etc.)
export const updateProducto = async (id: number, producto: Partial<ProductoCreate>): Promise<Producto> => {
    const response = await api.put<Producto>(`/inventario/${id}`, producto);
    return response.data;
};

// Eliminar un producto
export const deleteProducto = async (id: number): Promise<void> => {
    await api.delete(`/inventario/${id}`);
};