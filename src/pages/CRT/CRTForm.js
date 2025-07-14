import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { crtService } from '../../services/crtService';
import { transportadoraService } from '../../services/transportadoraService';
import { toast } from 'react-toastify';

export default function CRTForm({ open, onClose }) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      transportadoraId: '',
      quantidade: 1,
      faturaComercial: '',
      exportador: '',
      importador: '',
      paisOrigemCodigo: '',
      paisDestinoCodigo: ''
    }
  });

  // Queries
  const { data: transportadoras } = useApiQuery(
    'transportadoras',
    transportadoraService.getAll
  );

  const { data: countries } = useApiQuery(
    'countries',
    transportadoraService.getCountries
  );

  // Mutation para criar CRT
  const createMutation = useApiMutation(
    crtService.create,
    {
      onSuccess: (data) => {
        const quantidade = data.data.length;
        toast.success(`${quantidade} CRT(s) criado(s) com sucesso`);
        reset();
        onClose();
      },
      invalidateQueries: ['crt', 'mic-dta']
    }
  );

  const selectedTransportadoraId = watch('transportadoraId');
  const selectedTransportadora = transportadoras?.data?.find(
    t => t.id.toString() === selectedTransportadoraId
  );

  // Auto-preencher país de origem quando selecionar transportadora
  useEffect(() => {
    if (selectedTransportadora) {
      setValue('paisOrigemCodigo', selectedTransportadora.pais);
    }
  }, [selectedTransportadora, setValue]);

  // Resetar formulário quando abrir
  useEffect(() => {
    if (open) {
      reset({
        transportadoraId: '',
        quantidade: 1,
        faturaComercial: '',
        exportador: '',
        importador: '',
        paisOrigemCodigo: '',
        paisDestinoCodigo: ''
      });
    }
  }, [open, reset]);

  // Função para verificar se existe licença entre origem e destino
  const hasLicenseBetweenCountries = (transportadora, origem, destino) => {
    if (!transportadora) return false;
    // Verifica se existe licença para o par (origem, destino) ou (destino, origem)
    return (
      transportadora.paisesDestino?.some(ld =>
        (ld.paisDestino === destino && transportadora.pais === origem) ||
        (ld.paisDestino === origem && transportadora.pais === destino)
      )
    );
  };

  const onSubmit = (data) => {
    const origem = data.paisOrigemCodigo;
    const destino = data.paisDestinoCodigo;
    if (!hasLicenseBetweenCountries(selectedTransportadora, origem, destino)) {
      toast.error('Não existe licença vinculando os países selecionados. Não é possível emitir o documento.');
      return;
    }
    createMutation.mutate({
      ...data,
      transportadoraId: parseInt(data.transportadoraId),
      quantidade: parseInt(data.quantidade)
    });
  };

  // Função utilitária para montar lista de países permitidos
  const getAllowedCountries = (transportadora, countries) => {
    if (!transportadora) return [];
    const destinos = transportadora.paisesDestino?.map(dest => dest.paisDestino) || [];
    const paisRegistro = transportadora.pais;
    const uniqueCodes = Array.from(new Set([...destinos, paisRegistro]));
    return uniqueCodes.map(code => ({
      code,
      name: countries?.data?.find(c => c.code === code)?.name || code
    }));
  };

  const paisOrigemSelecionado = watch('paisOrigemCodigo');
  const allowedCountries = getAllowedCountries(selectedTransportadora, countries);
  const allowedDestinos = allowedCountries.filter(c => c.code !== paisOrigemSelecionado);

  // Países disponíveis para destino baseado nas licenças da transportadora
  const availableDestinations = selectedTransportadora?.paisesDestino || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Novo CRT</DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Informações da transportadora */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Transportadora
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.transportadoraId}>
                <InputLabel>Transportadora</InputLabel>
                <Select
                  {...register('transportadoraId', { required: 'Transportadora é obrigatória' })}
                  label="Transportadora"
                  defaultValue=""
                >
                  {transportadoras?.data?.map((transportadora) => (
                    <MenuItem key={transportadora.id} value={transportadora.id.toString()}>
                      {transportadora.nome} ({transportadora.pais})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantidade de CRTs"
                type="number"
                {...register('quantidade', { 
                  required: 'Quantidade é obrigatória',
                  min: { value: 1, message: 'Mínimo 1' },
                  max: { value: 100, message: 'Máximo 100' }
                })}
                error={!!errors.quantidade}
                helperText={errors.quantidade?.message}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>

            {/* Rota */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Rota
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.paisOrigemCodigo}>
                <InputLabel>País de Origem</InputLabel>
                <Select
                  {...register('paisOrigemCodigo', { required: 'País de origem é obrigatória' })}
                  label="País de Origem"
                  defaultValue={selectedTransportadora?.pais || ''}
                  disabled={!selectedTransportadora}
                >
                  {/* País de registro sempre como opção */}
                  {selectedTransportadora && (
                    <MenuItem key={selectedTransportadora.pais} value={selectedTransportadora.pais}>
                      {countries?.data?.find(c => c.code === selectedTransportadora.pais)?.name || selectedTransportadora.pais} ({selectedTransportadora.pais})
                    </MenuItem>
                  )}
                  {/* Países de idoneidade/licença, exceto país de registro (para evitar duplicidade) */}
                  {allowedCountries.filter(c => c.code !== selectedTransportadora?.pais).map((country) => (
                    <MenuItem key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </MenuItem>
                  ))}
                </Select>
                <Alert severity="info" sx={{ mt: 1 }}>
                  O país de registro da transportadora sempre pode ser selecionado como origem
                </Alert>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.paisDestinoCodigo}>
                <InputLabel>País de Destino</InputLabel>
                <Select
                  {...register('paisDestinoCodigo', { required: 'País de destino é obrigatório' })}
                  label="País de Destino"
                  defaultValue=""
                  disabled={!selectedTransportadora}
                >
                  {/* Permite qualquer país de idoneidade/licença, exceto o país de origem */}
                  {allowedCountries.filter(c => c.code !== watch('paisOrigemCodigo')).map((country) => (
                    <MenuItem key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </MenuItem>
                  ))}
                </Select>
                <Alert severity="info" sx={{ mt: 1 }}>
                  Se o país de registro for origem, pode escolher qualquer país de idoneidade/licença como destino
                </Alert>
              </FormControl>
            </Grid>

            {/* Documentação comercial */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Documentação Comercial
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fatura Comercial"
                {...register('faturaComercial', { required: 'Fatura comercial é obrigatória' })}
                error={!!errors.faturaComercial}
                helperText={errors.faturaComercial?.message}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Exportador"
                {...register('exportador', { required: 'Exportador é obrigatório' })}
                error={!!errors.exportador}
                helperText={errors.exportador?.message}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Importador"
                {...register('importador', { required: 'Importador é obrigatório' })}
                error={!!errors.importador}
                helperText={errors.importador?.message}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading ? 'Criando...' : 'Criar CRT'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}