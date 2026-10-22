// Frontend/src/api/clientesApi.ts
import { api } from './axios';
import { Cliente, ClienteCreate } from '../types';

// Obtener todos los clientes
export const getClientes = async (): Promise<Cliente[]> => {
    const response = await api.get<Cliente[]>('/clientes/');
    return response.data;
};

// Obtener un cliente por ID (con sus vehículos anidados)
export const getClienteById = async (id: number): Promise<Cliente> => {
    const response = await api.get<Cliente>(`/clientes/${id}`);
    return response.data;
};

// Crear un cliente nuevo
export const createCliente = async (cliente: ClienteCreate): Promise<Cliente> => {
    const response = await api.post<Cliente>('/clientes/', cliente);
    return response.data;
};

// Actualizar un cliente
export const updateCliente = async (id: number, cliente: Partial<ClienteCreate>): Promise<Cliente> => {
    const response = await api.put<Cliente>(`/clientes/${id}`, cliente);
    return response.data;
};

// Eliminar un cliente
export const deleteCliente = async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`);
};