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
  Box,
  Typography,
  IconButton,
  Chip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, useFieldArray } from 'react-hook-form';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { transportadoraService } from '../../services/transportadoraService';
import { toast } from 'react-toastify';
import { formatDateBR, dateToISO } from '../../utils/dateUtils';

export default function TransportadoraForm({ open, onClose, transportadora }) {
  const isEdit = Boolean(transportadora);
  const formKey = isEdit ? `edit-${transportadora?.id}` : `new-${open}`;

  const { control, register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      nome: '',
      pais: '',
      numeroRegistro: '',
      numeroInicialCRT: 1,
      numeroInicialMicDta: 1,
      paisesDestino: [{ paisDestino: '', licenca: '', vencimentoLicenca: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'paisesDestino'
  });

  // Query para buscar países
  const { data: countries } = useApiQuery(
    'countries',
    transportadoraService.getCountries
  );

  // Mutations
  const createMutation = useApiMutation(
    transportadoraService.create,
    {
      onSuccess: () => {
        toast.success('Transportadora criada com sucesso');
        reset();
        onClose();
      },
      invalidateQueries: ['transportadoras', 'crt', 'mic-dta']
    }
  );

  const updateMutation = useApiMutation(
    (data) => transportadoraService.update(transportadora.id, data),
    {
      onSuccess: () => {
        toast.success('Transportadora atualizada com sucesso');
        reset();
        onClose();
      },
      invalidateQueries: ['transportadoras', 'crt', 'mic-dta']
    }
  );

  // Resetar formulário quando abrir/fechar
  useEffect(() => {
    if (open) {
      let destinos = [{ paisDestino: '', licenca: '', idoneidade: '', vencimentoLicenca: '' }];
      if (transportadora && transportadora.paisesDestino?.length > 0) {
        // Para transportadora brasileira, filtra apenas licenças cujo destino não é BR
        if (transportadora.pais === 'BR') {
          destinos = transportadora.paisesDestino.filter((d, i) => d.paisDestino !== 'BR');
        } else {
          destinos = transportadora.paisesDestino.map(destino => ({
            paisDestino: destino.paisDestino || '',
            licenca: destino.licenca || '',
            idoneidade: destino.idoneidade || '',
            vencimentoLicenca: destino.vencimentoLicenca || ''
          }));
        }
      }
      reset({
        nome: transportadora?.nome || '',
        pais: transportadora?.pais || '',
        numeroRegistro: transportadora?.numeroRegistro || '',
        numeroInicialCRT: transportadora?.numeroInicialCRT || 1,
        numeroInicialMicDta: transportadora?.numeroInicialMicDta || 1,
        paisesDestino: destinos
      });
    }
  }, [open, transportadora, reset]);

  const onSubmit = (data) => {
    // Filtrar destinos vazios
    const paisesDestino = data.paisesDestino.filter(
      destino => destino.paisDestino && destino.licenca && destino.vencimentoLicenca
    );

    if (paisesDestino.length === 0) {
      toast.error('Adicione pelo menos um país de destino com licença e vencimento');
      return;
    }

    // Validação: impedir datas de vencimento duplicadas entre quaisquer destinos
    const vencimentos = paisesDestino.map(d => d.vencimentoLicenca);
    const vencimentosDuplicados = vencimentos.filter((v, i, arr) => arr.indexOf(v) !== i);
    if (vencimentosDuplicados.length > 0) {
      toast.error('Não é permitido repetir a mesma data de vencimento em mais de uma licença.');
      return;
    }

    const submitData = {
      ...data,
      paisesDestino
    };

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const availableCountries = countries?.data || [];
  const selectedPais = watch('pais');

  // Países disponíveis para destino (excluir o país da transportadora)
  const availableDestinations = availableCountries.filter(
    country => country.code !== selectedPais
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <div key={formKey}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {isEdit ? 'Editar Transportadora' : 'Nova Transportadora'}
          </DialogTitle>
          
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Informações básicas */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Informações Básicas
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome da Transportadora"
                  {...register('nome', { required: 'Nome é obrigatório' })}
                  error={!!errors.nome}
                  helperText={errors.nome?.message}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.pais}>
                  <InputLabel>País</InputLabel>
                  <Select
                    {...register('pais', { required: 'País é obrigatório' })}
                    label="País"
                    value={watch('pais') || ''}
                  >
                    {availableCountries.map((country) => (
                      <MenuItem key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Número de Registro"
                  {...register('numeroRegistro', { required: 'Registro é obrigatório' })}
                  error={!!errors.numeroRegistro}
                  helperText={errors.numeroRegistro?.message}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Número Inicial CRT"
                  type="number"
                  {...register('numeroInicialCRT', { 
                    required: 'Número inicial CRT é obrigatório',
                    min: { value: 1, message: 'Deve ser maior que 0' }
                  })}
                  error={!!errors.numeroInicialCRT}
                  helperText={errors.numeroInicialCRT?.message}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Número Inicial MIC/DTA"
                  type="number"
                  {...register('numeroInicialMicDta', { 
                    required: 'Número inicial MIC/DTA é obrigatório',
                    min: { value: 1, message: 'Deve ser maior que 0' }
                  })}
                  error={!!errors.numeroInicialMicDta}
                  helperText={errors.numeroInicialMicDta?.message}
                />
              </Grid>

              {/* Licenças por destino */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">
                    Licenças por Destino
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => append({ paisDestino: '', licenca: '', idoneidade: '', vencimentoLicenca: '' })}
                    disabled={!selectedPais}
                  >
                    Adicionar Destino
                  </Button>
                </Box>
                {!selectedPais && (
                  <Typography variant="body2" color="text.secondary">
                    Selecione o país da transportadora primeiro
                  </Typography>
                )}
              </Grid>

              {fields
                .filter(field => selectedPais !== 'BR' || field.paisDestino !== 'BR')
                .map((field, index) => (
                  <Grid item xs={12} key={field.id}>
                    <Box display="flex" gap={2} alignItems="start" flexWrap="wrap">
                      <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>País de Destino</InputLabel>
                        <Select
                          {...register(`paisesDestino.${index}.paisDestino`, {
                            required: 'País de destino é obrigatório'
                          })}
                          label="País de Destino"
                        >
                          <MenuItem value={field.paisDestino}>
                            {availableCountries.find(c => c.code === field.paisDestino)?.name || field.paisDestino} ({field.paisDestino})
                          </MenuItem>
                          {availableDestinations
                            .filter(c => c.code !== field.paisDestino)
                            .map((country) => (
                              <MenuItem key={country.code} value={country.code}>
                                {country.name} ({country.code})
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>

                      <TextField
                        label="Licença"
                        {...register(`paisesDestino.${index}.licenca`, {
                          required: 'Licença é obrigatória'
                        })}
                        error={!!errors.paisesDestino?.[index]?.licenca}
                        helperText={errors.paisesDestino?.[index]?.licenca?.message}
                        sx={{ minWidth: 150 }}
                      />

                      {selectedPais && selectedPais !== 'BR' && (
                        <TextField
                          label="Idoneidade"
                          {...register(`paisesDestino.${index}.idoneidade`, {
                            required: 'Idoneidade é obrigatória para transportadoras estrangeiras'
                          })}
                          error={!!errors.paisesDestino?.[index]?.idoneidade}
                          helperText={errors.paisesDestino?.[index]?.idoneidade?.message || 'Número de idoneidade'}
                          sx={{ minWidth: 150 }}
                        />
                      )}

                      <TextField
                        label="Vencimento da Licença"
                        placeholder="DD/MM/AAAA"
                        {...register(`paisesDestino.${index}.vencimentoLicenca`, {
                          required: 'Vencimento da licença é obrigatório',
                          pattern: {
                            value: /^(\d{2})\/(\d{2})\/(\d{4})$/,
                            message: 'Formato deve ser DD/MM/AAAA'
                          },
                          validate: (value) => {
                            if (!value) return true;
                            const parts = value.split('/');
                            if (parts.length !== 3) return 'Formato deve ser DD/MM/AAAA';
                            const day = parseInt(parts[0], 10);
                            const month = parseInt(parts[1], 10);
                            const year = parseInt(parts[2], 10);
                            if (day < 1 || day > 31) return 'Dia inválido';
                            if (month < 1 || month > 12) return 'Mês inválido';
                            if (year < 2000 || year > 2100) return 'Ano inválido';
                            const date = new Date(year, month - 1, day);
                            if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
                              return 'Data inválida';
                            }
                            return true;
                          }
                        })}
                        error={!!errors.paisesDestino?.[index]?.vencimentoLicenca}
                        helperText={errors.paisesDestino?.[index]?.vencimentoLicenca?.message || 'Formato: DD/MM/AAAA'}
                        sx={{ minWidth: 200 }}
                        inputProps={{
                          maxLength: 10,
                          onInput: (e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 3) {
                              value = value.substring(0,2) + '/' + value.substring(2);
                            }
                            if (value.length >= 6) {
                              value = value.substring(0,5) + '/' + value.substring(5,9);
                            }
                            e.target.value = value;
                          }
                        }}
                      />

                      <IconButton
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {createMutation.isLoading || updateMutation.isLoading
                ? 'Salvando...'
                : isEdit ? 'Atualizar' : 'Criar'
              }
            </Button>
          </DialogActions>
        </form>
      </div>
    </Dialog>
  );
}