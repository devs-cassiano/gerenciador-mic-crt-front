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
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  LocalShipping as TruckIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useApiQuery } from '../../hooks/useApi';
import { micDtaService } from '../../services/micDtaService';
import { transportadoraService } from '../../services/transportadoraService';
import LoadingCard from '../../components/common/LoadingCard';
import ErrorCard from '../../components/common/ErrorCard';
import MicDtaForm from './MicDtaForm';
import { toast } from 'react-toastify';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MicDtaList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransportadora, setSelectedTransportadora] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0: Todos, 1: Normal, 2: Lastre

  // Queries
  const { data: allMicDtas, isLoading: loadingAll, error, refetch } = useApiQuery(
    'mic-dta',
    micDtaService.getAll
  );

  const { data: normalMicDtas, isLoading: loadingNormal, refetch: refetchNormal } = useApiQuery(
    ['mic-dta', 'NORMAL'],
    () => micDtaService.getByTipo('NORMAL')
  );

  const { data: lastreMicDtas, isLoading: loadingLastre, refetch: refetchLastre } = useApiQuery(
    ['mic-dta', 'LASTRE'],
    () => micDtaService.getByTipo('LASTRE')
  );

  const { data: transportadoras } = useApiQuery(
    'transportadoras',
    transportadoraService.getAll
  );

  // Função para copiar texto para o clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Número copiado para a área de transferência!');
    }).catch(() => {
      toast.error('Erro ao copiar número');
    });
  };

  // Selecionar dados baseado na aba
  const getCurrentData = () => {
    switch (tabValue) {
      case 1: return normalMicDtas;
      case 2: return lastreMicDtas;
      default: return allMicDtas;
    }
  };

  const getCurrentLoading = () => {
    switch (tabValue) {
      case 1: return loadingNormal;
      case 2: return loadingLastre;
      default: return loadingAll;
    }
  };

  // Filtrar MIC/DTAs
  const filteredMicDtas = React.useMemo(() => {
    const currentData = getCurrentData();
    if (!currentData?.data) return [];
    
    return currentData.data.filter(micDta => {
      const matchesSearch = 
        micDta.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        micDta.transportadoraNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (micDta.crtNumero && micDta.crtNumero.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesTransportadora = !selectedTransportadora || 
        micDta.transportadoraId.toString() === selectedTransportadora;

      return matchesSearch && matchesTransportadora;
    });
  }, [getCurrentData(), searchTerm, selectedTransportadora]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (getCurrentLoading()) return <LoadingCard message="Carregando MIC/DTAs..." />;
  if (error) return <ErrorCard message="Erro ao carregar MIC/DTAs" onRetry={refetch} />;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            MIC/DTA - Manifesto Internacional de Carga
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie os manifestos internacionais de carga e documentos de transporte aduaneiro
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              // Refetch all queries based on current tab
              if (tabValue === 0) {
                refetch();
              } else if (tabValue === 1) {
                refetchNormal?.();
              } else {
                refetchLastre?.();
              }
            }}
            disabled={getCurrentLoading()}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
          >
            Novo MIC/DTA
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="mic-dta tabs">
          <Tab label="Todos" />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Normal
                <Chip label={normalMicDtas?.data?.length || 0} size="small" color="info" />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Lastre
                <Chip label={lastreMicDtas?.data?.length || 0} size="small" color="warning" />
              </Box>
            } 
          />
        </Tabs>
      </Card>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              placeholder="Buscar por número, transportadora, CRT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300, flexGrow: 1 }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Transportadora</InputLabel>
              <Select
                value={selectedTransportadora}
                onChange={(e) => setSelectedTransportadora(e.target.value)}
                label="Transportadora"
              >
                <MenuItem value="">Todas</MenuItem>
                {transportadoras?.data?.map((transportadora) => (
                  <MenuItem key={transportadora.id} value={transportadora.id.toString()}>
                    {transportadora.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número MIC/DTA</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Transportadora</TableCell>
                <TableCell>Rota</TableCell>
                <TableCell>CRT Relacionado</TableCell>
                <TableCell>Data</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMicDtas.map((micDta) => (
                <TableRow key={micDta.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle2" fontFamily="monospace">
                        {micDta.numero}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(micDta.numero)}
                        sx={{ p: 0.5 }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={micDta.tipo}
                      color={micDta.tipo === 'NORMAL' ? 'info' : 'warning'}
                      size="small"
                      icon={micDta.tipo === 'LASTRE' ? <TruckIcon /> : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {micDta.transportadoraNome}
                      </Typography>
                      <Chip
                        label={micDta.transportadoraPais}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${micDta.paisOrigemCodigo} → ${micDta.paisDestinoCodigo}`}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {micDta.crtNumero ? (
                      <Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontFamily="monospace">
                            {micDta.crtNumero}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(micDta.crtNumero)}
                            sx={{ p: 0.5 }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        {micDta.crtFaturaComercial && (
                          <Typography variant="caption" color="text.secondary">
                            {micDta.crtFaturaComercial}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Chip
                        label="Sem CRT"
                        variant="outlined"
                        size="small"
                        color="warning"
                      />
                    )}
                  </TableCell>
                  <TableCell>{micDta.dataCriacao}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      title="Ver detalhes"
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredMicDtas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm || selectedTransportadora ? 'Nenhum MIC/DTA encontrado' : 'Nenhum MIC/DTA cadastrado'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal do formulário */}
      <MicDtaForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </Box>
  );
}