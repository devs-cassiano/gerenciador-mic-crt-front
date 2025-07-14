import api from './api';

export const crtService = {
  // Listar todos os CRTs
  getAll: async () => {
    const response = await api.get('/crt');
    return response.data;
  },

  // Buscar CRT por ID
  getById: async (id) => {
    const response = await api.get(`/crt/${id}`);
    return response.data;
  },

  // Buscar CRTs por transportadora
  getByTransportadora: async (transportadoraId) => {
    const response = await api.get(`/crt/transportadora/${transportadoraId}`);
    return response.data;
  },

  // Criar novo CRT
  create: async (data) => {
    const response = await api.post('/crt', data);
    return response.data;
  }
};