// Frontend/src/api/clientesApi.ts
import { api } from './axios';
import { Cliente, ClienteCreate } from '../types';

export const getClientes = async (): Promise<Cliente[]> => {
    try {
        const response = await api.get<Cliente[]>('/clientes/');
        return Array.isArray(response.data) ? response.data : [];
    } catch {
        return [];
    }
};

export const getClienteById = async (id: number): Promise<Cliente> => {
    const response = await api.get<Cliente>(`/clientes/${id}`);
    return response.data;
};

export const createCliente = async (cliente: ClienteCreate): Promise<Cliente> => {
    const response = await api.post<Cliente>('/clientes/', cliente);
    return response.data;
};

export const updateCliente = async (id: number, cliente: Partial<ClienteCreate>): Promise<Cliente> => {
    const response = await api.put<Cliente>(`/clientes/${id}`, cliente);
    return response.data;
};

export const deleteCliente = async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`);
};
