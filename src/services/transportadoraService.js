import api from './api';

export const transportadoraService = {
  // Listar todas as transportadoras
  getAll: async () => {
    const response = await api.get('/transportadoras');
    return response.data;
  },

  // Buscar transportadora por ID
  getById: async (id) => {
    const response = await api.get(`/transportadoras/${id}`);
    return response.data;
  },

  // Criar nova transportadora
  create: async (data) => {
    const response = await api.post('/transportadoras', data);
    return response.data;
  },

  // Atualizar transportadora
  update: async (id, data) => {
    const response = await api.put(`/transportadoras/${id}`, data);
    return response.data;
  },

  // Deletar transportadora
  delete: async (id) => {
    const response = await api.delete(`/transportadoras/${id}`);
    return response.data;
  },

  // Buscar países disponíveis
  getCountries: async () => {
    const response = await api.get('/countries');
    return response.data;
  }
};