import { api } from './axios';
import { Usuario, UsuarioCreate } from '../types';

export const getUsuarios = async (): Promise<Usuario[]> => {
    try {
        const response = await api.get('/usuarios/');
        return Array.isArray(response.data) ? response.data : [];
    } catch {
        return [];
    }
};

export const createUsuario = async (usuario: UsuarioCreate): Promise<Usuario> => {
    const response = await api.post('/usuarios/', usuario);
    return response.data;
};

export const updateUsuario = async (id: number, usuario: Partial<UsuarioCreate>): Promise<Usuario> => {
    const response = await api.put(`/usuarios/${id}`, usuario);
    return response.data;
};

export const deleteUsuario = async (id: number): Promise<void> => {
    await api.delete(`/usuarios/${id}`);
};
