import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Alert,
  Box,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  IconButton
} from '@mui/material';
import {
  Assignment as NormalIcon,
  LocalShipping as LastreIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { micDtaService } from '../../services/micDtaService';
import { toast } from 'react-toastify';

export default function AddMicDtaToCRTForm({ open, onClose, crt, onSuccess }) {
  const [tipoSelecionado, setTipoSelecionado] = useState('NORMAL');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      tipo: 'NORMAL',
      crtId: '',
      quantidade: 1
    }
  });

  // Query para obter o próximo número sequencial
  const { data: nextNumberData, isLoading: loadingNextNumber, refetch: refetchNextNumber } = useApiQuery(
    ['next-mic-dta-number', crt?.transportadoraId, crt?.paisDestinoCodigo],
    () => micDtaService.getNextNumber(
      crt?.transportadoraId, 
      crt?.paisDestinoCodigo, 
      crt?.paisOrigemCodigo
    ),
    {
      enabled: open && !!crt?.transportadoraId && !!crt?.paisDestinoCodigo
    }
  );

  // Mutation para criar MIC/DTA
  const createMutation = useApiMutation(
    micDtaService.create,
    {
      onSuccess: () => {
        toast.success('MIC/DTA criado com sucesso!');
        reset();
        onSuccess?.();
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erro ao criar MIC/DTA');
      },
      invalidateQueries: [
        'mic-dta',
        'crt',
        ['mic-dta-crt', crt?.id],
        ['next-mic-dta-number', crt?.transportadoraId, crt?.paisDestinoCodigo]
      ]
    }
  );

  // Pré-preencher dados do CRT quando o modal abrir
  useEffect(() => {
    if (open && crt) {
      setValue('crtId', crt.id);
      setValue('quantidade', 1);
    }
  }, [open, crt, setValue]);

  // Atualizar número quando o próximo número for carregado
  useEffect(() => {
    if (nextNumberData?.data?.numeroCompleto) {
      setValue('numero', nextNumberData.data.numeroCompleto);
    }
  }, [nextNumberData, setValue]);

  const onSubmit = (data) => {
    const formattedData = {
      tipo: tipoSelecionado,
      crtId: parseInt(data.crtId),
      quantidade: parseInt(data.quantidade)
    };

    createMutation.mutate(formattedData);
  };

  const handleClose = () => {
    reset();
    setTipoSelecionado('NORMAL');
    onClose();
  };

  const watchedQuantidade = watch('quantidade');

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">
              Adicionar MIC/DTA ao CRT
            </Typography>
            {crt && (
              <Typography variant="body2" color="text.secondary">
                CRT: {crt.numero} - {crt.transportadoraNome}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {/* Informações do CRT */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Dados do CRT Selecionado
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Número:</strong> {crt?.numero}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Fatura:</strong> {crt?.faturaComercial}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Rota:</strong> {crt?.paisOrigemCodigo} → {crt?.paisDestinoCodigo}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Transportadora:</strong> {crt?.transportadoraNome}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Tipo de MIC/DTA */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Tipo de MIC/DTA
            </Typography>
            <ToggleButtonGroup
              value={tipoSelecionado}
              exclusive
              onChange={(event, newValue) => {
                if (newValue !== null) {
                  setTipoSelecionado(newValue);
                  setValue('tipo', newValue);
                  // Limpar o número atual para forçar novo carregamento
                  setValue('numero', '');
                }
              }}
              aria-label="tipo mic/dta"
            >
              <ToggleButton value="NORMAL" aria-label="normal">
                <NormalIcon sx={{ mr: 1 }} />
                Normal
              </ToggleButton>
              <ToggleButton value="LASTRE" aria-label="lastre">
                <LastreIcon sx={{ mr: 1 }} />
                Lastre
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              O número será gerado automaticamente baseado no tipo selecionado
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Número */}
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('numero', { required: 'Número é obrigatório' })}
                label="Número MIC/DTA"
                fullWidth
                error={!!errors.numero}
                helperText={errors.numero?.message || 'Número gerado automaticamente'}
                InputProps={{
                  readOnly: true
                }}
                value={watch('numero') || (loadingNextNumber ? 'Carregando...' : '')}
              />
            </Grid>

            {/* Quantidade */}
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('quantidade', { 
                  required: 'Quantidade é obrigatória',
                  min: { value: 1, message: 'Quantidade deve ser pelo menos 1' },
                  max: { value: 100, message: 'Máximo 100' }
                })}
                label="Quantidade"
                type="number"
                fullWidth
                error={!!errors.quantidade}
                helperText={errors.quantidade?.message}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>

            {/* Transportadora (somente leitura, vem do CRT) */}
            <Grid item xs={12}>
              <TextField
                label="Transportadora"
                value={`${crt?.transportadoraNome} (${crt?.transportadoraPais})`}
                fullWidth
                InputProps={{
                  readOnly: true
                }}
                helperText="Transportadora definida pelo CRT selecionado"
              />
            </Grid>

            {/* País de Origem (somente leitura, vem do CRT) */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="País de Origem"
                value={crt?.paisOrigemCodigo || ''}
                fullWidth
                InputProps={{
                  readOnly: true
                }}
                helperText="Definido pelo CRT"
              />
            </Grid>

            {/* País de Destino (somente leitura, vem do CRT) */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="País de Destino"
                value={crt?.paisDestinoCodigo || ''}
                fullWidth
                InputProps={{
                  readOnly: true
                }}
                helperText="Definido pelo CRT"
              />
            </Grid>

            {/* Observações */}
            <Grid item xs={12}>
              <TextField
                {...register('observacoes')}
                label="Observações"
                multiline
                rows={3}
                fullWidth
                placeholder="Informações adicionais sobre o MIC/DTA..."
              />
            </Grid>
          </Grid>

          {createMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {createMutation.error?.response?.data?.message || 'Erro ao criar MIC/DTA'}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading ? 'Criando...' : 'Criar MIC/DTA'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
