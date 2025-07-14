import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

// Hook para queries (GET)
export const useApiQuery = (key, queryFn, options = {}) => {
  return useQuery(key, queryFn, {
    onError: (error) => {
      const message = error.response?.data?.message || 'Erro ao carregar dados';
      toast.error(message);
    },
    ...options
  });
};

// Hook para mutations (POST, PUT, DELETE)
export const useApiMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation(mutationFn, {
    onSuccess: async (data, variables, context) => {
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
      
      // Invalidar queries relacionadas de forma não bloqueante
      if (options.invalidateQueries) {
        // Processar invalidações sem await para não bloquear
        options.invalidateQueries.forEach(key => {
          queryClient.invalidateQueries(key, { exact: false });
        });
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erro na operação';
      toast.error(message);
      
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options
  });
};