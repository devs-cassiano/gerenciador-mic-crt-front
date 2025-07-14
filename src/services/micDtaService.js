import api from './api';

export const micDtaService = {
  // Listar todos os MIC/DTAs
  getAll: async () => {
    const response = await api.get('/mic-dta');
    return response.data;
  },

  // Buscar MIC/DTAs por tipo
  getByTipo: async (tipo) => {
    const response = await api.get(`/mic-dta/tipo/${tipo}`);
    return response.data;
  },

  // Buscar MIC/DTAs por transportadora
  getByTransportadora: async (transportadoraId) => {
    const response = await api.get(`/mic-dta/transportadora/${transportadoraId}`);
    return response.data;
  },

  // Buscar MIC/DTAs por CRT
  getByCrt: async (crtId) => {
    const response = await api.get(`/mic-dta/crt/${crtId}`);
    return response.data;
  },

  // Criar novo MIC/DTA (NORMAL ou LASTRE)
  create: async (data) => {
    const response = await api.post('/mic-dta', data);
    return response.data;
  }
};