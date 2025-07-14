import axios from 'axios';
import { toast } from 'react-toastify';

// Configuração base da API
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://54.242.200.179:3000/api',
  timeout: 10000,
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Erro na requisição';
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${message}`);
    
    // Exibir toast de erro
    toast.error(message);
    
    return Promise.reject(error);
  }
);

export default api;