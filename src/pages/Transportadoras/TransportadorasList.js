import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { transportadoraService } from '../../services/transportadoraService';
import { toast } from 'react-toastify';
import LoadingCard from '../../components/common/LoadingCard';
import ErrorCard from '../../components/common/ErrorCard';
import TransportadoraForm from './TransportadoraForm';
import { formatDateBR } from '../../utils/dateUtils';

export default function TransportadorasList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransportadora, setSelectedTransportadora] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  // Query para buscar transportadoras
  const { data, isLoading, error, refetch } = useApiQuery(
    'transportadoras',
    transportadoraService.getAll
  );

  // Mutation para deletar transportadora
  const deleteMutation = useApiMutation(
    transportadoraService.delete,
    {
      onSuccess: () => {
        toast.success('Transportadora deletada com sucesso');
        setDeleteConfirmOpen(false);
        setSelectedTransportadora(null);
      },
      invalidateQueries: ['transportadoras', 'crts', 'mic-dtas']
    }
  );

  // Filtrar transportadoras
  const filteredTransportadoras = React.useMemo(() => {
    if (!data?.data) return [];
    
    return data.data.filter(transportadora =>
      transportadora.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transportadora.numeroRegistro.includes(searchTerm) ||
      transportadora.pais.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleEdit = (transportadora) => {
    setSelectedTransportadora(transportadora);
    setFormOpen(true);
  };

  const handleDelete = (transportadora) => {
    setSelectedTransportadora(transportadora);
    setDeleteConfirmOpen(true);
  };

  const handleViewDetails = (transportadora) => {
    setSelectedTransportadora(transportadora);
    setViewDetailsOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTransportadora) {
      deleteMutation.mutate(selectedTransportadora.id);
    }
  };

  if (isLoading) return <LoadingCard message="Carregando transportadoras..." />;
  if (error) return <ErrorCard message="Erro ao carregar transportadoras" onRetry={refetch} />;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Transportadoras
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie suas transportadoras e suas licenças por destino
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedTransportadora(null);
              setFormOpen(true);
            }}
          >
            Nova Transportadora
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Buscar por nome, registro ou país..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>País</TableCell>
                <TableCell>Registro</TableCell>
                <TableCell>Licenças</TableCell>
                <TableCell>Criado em</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransportadoras.map((transportadora) => (
                <TableRow key={transportadora.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {transportadora.nome}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transportadora.pais}
                      color={transportadora.pais === 'BR' ? 'success' : 'primary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{transportadora.numeroRegistro}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {transportadora.pais !== 'BR'
                        ? (() => {
                            // Para estrangeiras, mostrar só a primeira licença
                            const destino = transportadora.paisesDestino?.[0];
                            if (!destino) return null;
                            // Cálculo do status de vencimento
                            const vencimento = destino.vencimentoLicenca ? destino.vencimentoLicenca : null;
                            let chipColor = 'success';
                            let chipLabel = `${destino.paisDestino}:${destino.licenca}`;
                            if (vencimento) {
                              const [day, month, year] = vencimento.split('/').map(Number);
                              const vencDate = new Date(year, month - 1, day);
                              const hoje = new Date();
                              const diffDias = (vencDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
                              const diffMeses = diffDias / 30.44;
                              if (vencDate < hoje) {
                                chipColor = 'error'; // vermelho
                                chipLabel += ` • Vencida: ${vencimento}`;
                              } else if (diffMeses <= 6) {
                                chipColor = 'warning'; // amarelo
                                chipLabel += ` • Vence em: ${vencimento}`;
                              } else {
                                chipColor = 'success'; // verde
                                chipLabel += ` • Vence em: ${vencimento}`;
                              }
                            }
                            return (
                              <Chip
                                key={destino.paisDestino}
                                label={chipLabel}
                                size="small"
                                variant="outlined"
                                color={chipColor}
                              />
                            );
                          })()
                        : (() => {
                            // Para brasileiras, ocultar licenças com destino Brasil
                            if (transportadora.pais === 'BR') {
                              return transportadora.paisesDestino
                                ?.filter(destino => destino.paisDestino !== 'BR')
                                .filter((destino, idx, arr) =>
                                  arr.findIndex(d => d.paisDestino === destino.paisDestino && d.vencimentoLicenca === destino.vencimentoLicenca) === idx
                                )
                                .map((destino) => {
                                  // Cálculo do status de vencimento
                                  const vencimento = destino.vencimentoLicenca ? destino.vencimentoLicenca : null;
                                  let chipColor = 'success';
                                  let chipLabel = `${destino.paisDestino}:${destino.licenca}`;
                                  if (vencimento) {
                                    const [day, month, year] = vencimento.split('/').map(Number);
                                    const vencDate = new Date(year, month - 1, day);
                                    const hoje = new Date();
                                    const diffDias = (vencDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
                                    const diffMeses = diffDias / 30.44;
                                    if (vencDate < hoje) {
                                      chipColor = 'error'; // vermelho
                                      chipLabel += ` • Vencida: ${vencimento}`;
                                    } else if (diffMeses <= 6) {
                                      chipColor = 'warning'; // amarelo
                                      chipLabel += ` • Vence em: ${vencimento}`;
                                    } else {
                                      chipColor = 'success'; // verde
                                      chipLabel += ` • Vence em: ${vencimento}`;
                                    }
                                  }
                                  return (
                                    <Chip
                                      key={destino.paisDestino + destino.vencimentoLicenca}
                                      label={chipLabel}
                                      size="small"
                                      variant="outlined"
                                      color={chipColor}
                                    />
                                  );
                                });
                            } else {
                              // Estrangeiras e demais
                              return transportadora.paisesDestino?.map((destino) => {
                                // Cálculo do status de vencimento
                                const vencimento = destino.vencimentoLicenca ? destino.vencimentoLicenca : null;
                                let chipColor = 'success';
                                let chipLabel = `${destino.paisDestino}:${destino.licenca}`;
                                if (vencimento) {
                                  const [day, month, year] = vencimento.split('/').map(Number);
                                  const vencDate = new Date(year, month - 1, day);
                                  const hoje = new Date();
                                  const diffDias = (vencDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
                                  const diffMeses = diffDias / 30.44;
                                  if (vencDate < hoje) {
                                    chipColor = 'error'; // vermelho
                                    chipLabel += ` • Vencida: ${vencimento}`;
                                  } else if (diffMeses <= 6) {
                                    chipColor = 'warning'; // amarelo
                                    chipLabel += ` • Vence em: ${vencimento}`;
                                  } else {
                                    chipColor = 'success'; // verde
                                    chipLabel += ` • Vence em: ${vencimento}`;
                                  }
                                }
                                return (
                                  <Chip
                                    key={destino.paisDestino}
                                    label={chipLabel}
                                    size="small"
                                    variant="outlined"
                                    color={chipColor}
                                  />
                                );
                              });
                            }
                          })()}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {formatDateBR(transportadora.createdAt)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(transportadora)}
                      title="Ver detalhes"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(transportadora)}
                      title="Editar"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(transportadora)}
                      title="Deletar"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransportadoras.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm ? 'Nenhuma transportadora encontrada' : 'Nenhuma transportadora cadastrada'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal do formulário */}
      <TransportadoraForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedTransportadora(null);
        }}
        transportadora={selectedTransportadora}
      />

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja deletar a transportadora "{selectedTransportadora?.nome}"?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? 'Deletando...' : 'Deletar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de detalhes */}
      <Dialog
        open={viewDetailsOpen}
        onClose={() => setViewDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalhes da Transportadora</DialogTitle>
        <DialogContent>
          {selectedTransportadora && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedTransportadora.nome}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                País: {selectedTransportadora.pais} | Registro: {selectedTransportadora.numeroRegistro}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Licenças
              </Typography>
              <Grid container spacing={2}>
                {selectedTransportadora.pais !== 'BR'
                  ? (() => {
                      const destino = selectedTransportadora.paisesDestino?.[0];
                      if (!destino) return null;
                      const vencimento = destino.vencimentoLicenca ? destino.vencimentoLicenca : null;
                      const hoje = new Date();
                      let chipColor = 'success';
                      let chipLabel = `${destino.paisDestino}:${destino.licenca}`;
                      if (vencimento) {
                        const [day, month, year] = vencimento.split('/').map(Number);
                        const vencDate = new Date(year, month - 1, day);
                        const diffDias = (vencDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
                        const diffMeses = diffDias / 30.44;
                        if (vencDate < hoje) {
                          chipColor = 'error';
                          chipLabel += ` • Vencida: ${vencimento}`;
                        } else if (diffMeses <= 6) {
                          chipColor = 'warning';
                          chipLabel += ` • Vence em: ${vencimento}`;
                        } else {
                          chipColor = 'success';
                          chipLabel += ` • Vence em: ${vencimento}`;
                        }
                      }
                      return (
                        <Grid item xs={12} sm={6} key={destino.paisDestino}>
                          <Paper sx={{ p: 2, bgcolor: chipColor === 'error' ? 'error.50' : chipColor === 'warning' ? 'warning.50' : 'grey.50' }}>
                            <Typography variant="subtitle2" color={chipColor === 'error' ? 'error.main' : chipColor === 'warning' ? 'warning.main' : 'text.primary'}>
                              {destino.paisDestino}
                            </Typography>
                            <Typography variant="body2">
                              Licença: {destino.licenca}
                            </Typography>
                            {destino.idoneidade && (
                              <Typography variant="body2">
                                Idoneidade: {destino.idoneidade}
                              </Typography>
                            )}
                            <Typography variant="body2" color={chipColor === 'error' ? 'error.main' : chipColor === 'warning' ? 'warning.main' : 'text.secondary'}>
                              Vencimento: {vencimento}
                            </Typography>
                            {chipColor === 'error' && (
                              <Chip label="VENCIDA" color="error" size="small" sx={{ mt: 1 }} />
                            )}
                            {chipColor === 'warning' && chipColor !== 'error' && (
                              <Chip label="PRÓXIMO VENCIMENTO" color="warning" size="small" sx={{ mt: 1 }} />
                            )}
                            {chipColor === 'success' && (
                              <Chip label="VÁLIDA" color="success" size="small" sx={{ mt: 1 }} />
                            )}
                          </Paper>
                        </Grid>
                      );
                    })()
                  : selectedTransportadora.paisesDestino
                      ?.filter(destino => destino.paisDestino !== 'BR')
                      .map((destino) => {
                        const vencimento = destino.vencimentoLicenca ? destino.vencimentoLicenca : null;
                        const hoje = new Date();
                        let chipColor = 'success';
                        let chipLabel = `${destino.paisDestino}:${destino.licenca}`;
                        if (vencimento) {
                          const [day, month, year] = vencimento.split('/').map(Number);
                          const vencDate = new Date(year, month - 1, day);
                          const diffDias = (vencDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
                          const diffMeses = diffDias / 30.44;
                          if (vencDate < hoje) {
                            chipColor = 'error'; // vermelho
                            chipLabel += ` • Vencida: ${vencimento}`;
                          } else if (diffMeses <= 6) {
                            chipColor = 'warning'; // amarelo
                            chipLabel += ` • Vence em: ${vencimento}`;
                          } else {
                            chipColor = 'success'; // verde
                            chipLabel += ` • Vence em: ${vencimento}`;
                          }
                        }
                        return (
                          <Grid item xs={12} sm={6} key={destino.paisDestino}>
                            <Paper sx={{ p: 2, bgcolor: chipColor === 'error' ? 'error.50' : chipColor === 'warning' ? 'warning.50' : 'grey.50' }}>
                              <Typography variant="subtitle2" color={chipColor === 'error' ? 'error.main' : chipColor === 'warning' ? 'warning.main' : 'text.primary'}>
                                {destino.paisDestino}
                              </Typography>
                              <Typography variant="body2">
                                Licença: {destino.licenca}
                              </Typography>
                              {destino.idoneidade && (
                                <Typography variant="body2">
                                  Idoneidade: {destino.idoneidade}
                                </Typography>
                              )}
                              <Typography variant="body2" color={chipColor === 'error' ? 'error.main' : chipColor === 'warning' ? 'warning.main' : 'text.secondary'}>
                                Vencimento: {vencimento}
                              </Typography>
                              {chipColor === 'error' && (
                                <Chip label="VENCIDA" color="error" size="small" sx={{ mt: 1 }} />
                              )}
                              {chipColor === 'warning' && chipColor !== 'error' && (
                                <Chip label="PRÓXIMO VENCIMENTO" color="warning" size="small" sx={{ mt: 1 }} />
                              )}
                              {chipColor === 'success' && (
                                <Chip label="VÁLIDA" color="success" size="small" sx={{ mt: 1 }} />
                              )}
                            </Paper>
                          </Grid>
                        );
                      })}
              </Grid>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Configurações:
              </Typography>
              <Typography variant="body2">
                Número inicial CRT: {selectedTransportadora.numeroInicialCRT}
              </Typography>
              <Typography variant="body2">
                Número inicial MIC/DTA: {selectedTransportadora.numeroInicialMicDta}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDetailsOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}