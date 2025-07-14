import React, { useEffect, useState } from 'react';
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
  Alert,
  Box,
  Chip,
  Paper,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Assignment as NormalIcon,
  LocalShipping as LastreIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { micDtaService } from '../../services/micDtaService';
import { crtService } from '../../services/crtService';
import { transportadoraService } from '../../services/transportadoraService';
import { toast } from 'react-toastify';

export default function MicDtaForm({ open, onClose }) {
  const [tipoSelecionado, setTipoSelecionado] = useState('NORMAL');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      tipo: 'NORMAL',
      crtId: '',
      transportadoraId: '',
      paisOrigemCodigo: '',
      paisDestinoCodigo: '',
      quantidade: 1
    }
  });

  // Queries
  const { data: crts } = useApiQuery(
    'crt',
    crtService.getAll
  );

  const { data: transportadoras } = useApiQuery(
    'transportadoras',
    transportadoraService.getAll
  );

  const { data: countries } = useApiQuery(
    'countries',
    transportadoraService.getCountries
  );

  // Mutation para criar MIC/DTA
  const createMutation = useApiMutation(
    micDtaService.create,
    {
      onSuccess: (data) => {
        const responseData = data.data;
        const message = data.message || `MIC/DTA(s) criado(s) com sucesso`;
        toast.success(message);
        reset();
        onClose();
      },
      invalidateQueries: ['mic-dta', 'crt']
    }
  );

  const selectedCrtId = watch('crtId');
  const selectedTransportadoraId = watch('transportadoraId');

  const selectedCrt = crts?.data?.find(c => c.id.toString() === selectedCrtId);
  const selectedTransportadora = transportadoras?.data?.find(
    t => t.id.toString() === selectedTransportadoraId
  );

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

  // Função para verificar se existe licença entre origem e destino
  const hasLicenseBetweenCountries = (transportadora, origem, destino) => {
    if (!transportadora) return false;
    return (
      transportadora.paisesDestino?.some(ld =>
        (ld.paisDestino === destino && transportadora.pais === origem) ||
        (ld.paisDestino === origem && transportadora.pais === destino)
      )
    );
  };

  // Auto-preencher quando selecionar CRT (tipo NORMAL)
  useEffect(() => {
    if (tipoSelecionado === 'NORMAL' && selectedCrt) {
      setValue('transportadoraId', selectedCrt.transportadoraId.toString());
      setValue('paisOrigemCodigo', selectedCrt.paisOrigemCodigo);
      setValue('paisDestinoCodigo', selectedCrt.paisDestinoCodigo);
    }
  }, [selectedCrt, tipoSelecionado, setValue]);

  // Resetar formulário quando abrir ou mudar tipo
  useEffect(() => {
    if (open) {
      setValue('tipo', tipoSelecionado);
      reset({
        tipo: tipoSelecionado,
        crtId: '',
        transportadoraId: '',
        paisOrigemCodigo: '',
        paisDestinoCodigo: '',
        quantidade: 1
      });
    }
  }, [open, tipoSelecionado, reset, setValue]);

  const onSubmit = (data) => {
    const origem = data.paisOrigemCodigo;
    const destino = data.paisDestinoCodigo;
    if (!hasLicenseBetweenCountries(selectedTransportadora, origem, destino)) {
      toast.error('Não existe licença vinculando os países selecionados. Não é possível emitir o documento.');
      return;
    }

    const submitData = {
      tipo: tipoSelecionado,
      quantidade: parseInt(data.quantidade)
    };

    if (tipoSelecionado === 'NORMAL') {
      submitData.crtId = parseInt(data.crtId);
    } else {
      submitData.transportadoraId = parseInt(data.transportadoraId);
      submitData.paisOrigemCodigo = data.paisOrigemCodigo;
      submitData.paisDestinoCodigo = data.paisDestinoCodigo; // Para LASTRE, agora é selecionável
    }

    createMutation.mutate(submitData);
  };

  const paisOrigemSelecionado = watch('paisOrigemCodigo');
  const allowedCountries = getAllowedCountries(selectedTransportadora, countries);
  const allowedDestinos = allowedCountries.filter(c => c.code !== paisOrigemSelecionado);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Novo MIC/DTA</DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Seleção do tipo */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Tipo de MIC/DTA
              </Typography>
              <ToggleButtonGroup
                value={tipoSelecionado}
                exclusive
                onChange={(event, newValue) => {
                  if (newValue !== null) {
                    setTipoSelecionado(newValue);
                  }
                }}
                aria-label="tipo mic/dta"
                fullWidth
              >
                <ToggleButton value="NORMAL" aria-label="normal">
                  <Box display="flex" alignItems="center" gap={1}>
                    <NormalIcon />
                    <Box textAlign="left">
                      <Typography variant="subtitle2">NORMAL</Typography>
                      <Typography variant="caption">Relacionado a CRT</Typography>
                    </Box>
                  </Box>
                </ToggleButton>
                <ToggleButton value="LASTRE" aria-label="lastre">
                  <Box display="flex" alignItems="center" gap={1}>
                    <LastreIcon />
                    <Box textAlign="left">
                      <Typography variant="subtitle2">LASTRE</Typography>
                      <Typography variant="caption">Caminhão vazio</Typography>
                    </Box>
                  </Box>
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            {/* Quantidade */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantidade de MIC/DTAs"
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

            {/* Configuração NORMAL */}
            {tipoSelecionado === 'NORMAL' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    CRT Relacionado
                  </Typography>
                  <Alert severity="info">
                    Todas as informações serão herdadas automaticamente do CRT selecionado
                  </Alert>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.crtId}>
                    <InputLabel>CRT</InputLabel>
                    <Select
                      {...register('crtId', { required: 'CRT é obrigatório' })}
                      label="CRT"
                      defaultValue=""
                    >
                      {crts?.data?.map((crt) => (
                        <MenuItem key={crt.id} value={crt.id.toString()}>
                          <Box display="flex" justifyContent="space-between" width="100%">
                            <span>{crt.numero}</span>
                            <Box display="flex" gap={1}>
                              <Chip 
                                label={crt.transportadoraNome} 
                                size="small" 
                                variant="outlined" 
                              />
                              <Chip 
                                label={crt.faturaComercial} 
                                size="small" 
                                color="primary" 
                              />
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Informações herdadas do CRT */}
                {selectedCrt && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Informações Herdadas:
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip label={`Transportadora: ${selectedCrt.transportadoraNome}`} />
                        <Chip label={`Rota: ${selectedCrt.paisOrigemCodigo} → ${selectedCrt.paisDestinoCodigo}`} />
                        <Chip label={`Licença: ${selectedCrt.licencaComplementar}`} />
                        <Chip label={`Fatura: ${selectedCrt.faturaComercial}`} />
                      </Box>
                    </Paper>
                  </Grid>
                )}

                {/* País de Origem e Destino - somente para CRTs com transportadora associada */}
                {selectedCrt && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.paisOrigemCodigo}>
                      <InputLabel>País de Origem</InputLabel>
                      <Select
                        {...register('paisOrigemCodigo', { required: 'País de origem é obrigatório' })}
                        label="País de Origem"
                        defaultValue={selectedCrt.paisOrigemCodigo}
                      >
                        {getAllowedCountries(selectedTransportadora, countries).map((country) => (
                          <MenuItem key={country.code} value={country.code}>
                            {country.name} ({country.code})
                          </MenuItem>
                        ))}
                      </Select>
                      <Alert severity="info" sx={{ mt: 1 }}>
                        Só é permitido selecionar países para os quais a transportadora possui licença/idoneidade
                      </Alert>
                    </FormControl>
                  </Grid>
                )}
                {selectedCrt && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.paisDestinoCodigo}>
                      <InputLabel>País de Destino</InputLabel>
                      <Select
                        {...register('paisDestinoCodigo', { required: 'País de destino é obrigatório' })}
                        label="País de Destino"
                        defaultValue={selectedCrt.paisDestinoCodigo}
                      >
                        {getAllowedCountries(selectedTransportadora, countries).map((country) => (
                          <MenuItem key={country.code} value={country.code}>
                            {country.name} ({country.code})
                          </MenuItem>
                        ))}
                      </Select>
                      <Alert severity="success" sx={{ mt: 1 }}>
                        Só é permitido selecionar países para os quais a transportadora possui licença/idoneidade
                      </Alert>
                    </FormControl>
                  </Grid>
                )}
              </>
            )}

            {/* Configuração LASTRE */}
            {tipoSelecionado === 'LASTRE' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Configuração Independente - LASTRE
                  </Typography>
                  <Alert severity="info">
                    Para caminhões vazios - Todas as transportadoras podem emitir LASTRE independente de licenças específicas
                  </Alert>
                </Grid>

                <Grid item xs={12}>
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
                  <FormControl fullWidth error={!!errors.paisOrigemCodigo}>
                    <InputLabel>País de Origem</InputLabel>
                    <Select
                      {...register('paisOrigemCodigo', { required: 'País de origem é obrigatório' })}
                      label="País de Origem"
                      defaultValue=""
                    >
                      {/* Agora só mostra países de idoneidade/licença da transportadora */}
                      {getAllowedCountries(selectedTransportadora, countries).map((country) => (
                        <MenuItem key={country.code} value={country.code}>
                          {country.name} ({country.code})
                        </MenuItem>
                      ))}
                    </Select>
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Só é permitido selecionar países para os quais a transportadora possui licença/idoneidade
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
                    >
                      {/* Agora só mostra países de idoneidade/licença da transportadora */}
                      {allowedDestinos.map((country) => (
                        <MenuItem key={country.code} value={country.code}>
                          {country.name} ({country.code})
                        </MenuItem>
                      ))}
                    </Select>
                    <Alert severity="success" sx={{ mt: 1 }}>
                      Só é permitido selecionar países para os quais a transportadora possui licença/idoneidade
                    </Alert>
                  </FormControl>
                </Grid>

                {/* Informações sobre numeração LASTRE */}
                {selectedTransportadora && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
                      <Typography variant="subtitle2" gutterBottom color="info.main">
                        Numeração LASTRE - Baseada na Idoneidade:
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip 
                          label={`Transportadora: ${selectedTransportadora.nome} (${selectedTransportadora.pais})`} 
                          color="primary" 
                        />
                        {selectedTransportadora.pais === 'BR' ? (
                          <Chip 
                            label="Brasileira: Idoneidade extraída da licença" 
                            color="success" 
                          />
                        ) : (
                          <Chip 
                            label="Estrangeira: Número da idoneidade direto" 
                            color="warning" 
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        {selectedTransportadora.pais === 'BR' 
                          ? 'Para transportadoras brasileiras, o número da idoneidade será extraído automaticamente da licença'
                          : 'Para transportadoras estrangeiras, será usado o número de idoneidade cadastrado'}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </>
            )}
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
            {createMutation.isLoading ? 'Criando...' : 'Criar MIC/DTA'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}