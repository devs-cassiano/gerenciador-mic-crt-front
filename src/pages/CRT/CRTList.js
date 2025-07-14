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
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useApiQuery } from '../../hooks/useApi';
import { crtService } from '../../services/crtService';
import { transportadoraService } from '../../services/transportadoraService';
import LoadingCard from '../../components/common/LoadingCard';
import ErrorCard from '../../components/common/ErrorCard';
import CRTForm from './CRTForm';
import CRTMicDtaViewer from '../../components/common/CRTMicDtaViewer';
import AddMicDtaToCRTForm from '../../components/common/AddMicDtaToCRTForm';
import { toast } from 'react-toastify';

export default function CRTList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransportadora, setSelectedTransportadora] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [micDtaViewerOpen, setMicDtaViewerOpen] = useState(false);
  const [addMicDtaFormOpen, setAddMicDtaFormOpen] = useState(false);
  const [selectedCrt, setSelectedCrt] = useState(null);

  // Queries
  const { data: crts, isLoading: loadingCrts, error, refetch } = useApiQuery(
    'crt',
    crtService.getAll
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

  // Filtrar CRTs
  const filteredCrts = React.useMemo(() => {
    if (!crts?.data) return [];
    
    return crts.data.filter(crt => {
      const matchesSearch = 
        crt.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crt.faturaComercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crt.exportador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crt.importador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crt.transportadoraNome.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTransportadora = !selectedTransportadora || 
        crt.transportadoraId.toString() === selectedTransportadora;

      return matchesSearch && matchesTransportadora;
    });
  }, [crts, searchTerm, selectedTransportadora]);

  const handleViewMicDta = (crt) => {
    setSelectedCrt(crt);
    setMicDtaViewerOpen(true);
  };

  const handleCreateMicDta = (crt) => {
    setSelectedCrt(crt);
    setAddMicDtaFormOpen(true);
  };

  const handleMicDtaSuccess = () => {
    // Atualizar dados se necessário
    refetch();
  };

  if (loadingCrts) return <LoadingCard message="Carregando CRTs..." />;
  if (error) return <ErrorCard message="Erro ao carregar CRTs" onRetry={refetch} />;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            CRT - Conhecimento Internacional de Transporte Rodoviário
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie os conhecimentos internacionais de transporte rodoviário
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={loadingCrts}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
          >
            Novo CRT
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              placeholder="Buscar por número, fatura, exportador..."
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
                <TableCell>Número CRT</TableCell>
                <TableCell>Transportadora</TableCell>
                <TableCell>Fatura Comercial</TableCell>
                <TableCell>Rota</TableCell>
                <TableCell>Exportador</TableCell>
                <TableCell>Importador</TableCell>
                <TableCell>Data</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCrts.map((crt) => (
                <TableRow key={crt.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle2" fontFamily="monospace">
                        {crt.numero}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(crt.numero)}
                        sx={{ p: 0.5 }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {crt.transportadoraNome}
                      </Typography>
                      <Chip
                        label={crt.transportadoraPais}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{crt.faturaComercial}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${crt.paisOrigemCodigo} → ${crt.paisDestinoCodigo}`}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{crt.exportador}</TableCell>
                  <TableCell>{crt.importador}</TableCell>
                  <TableCell>{crt.dataCriacao}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleViewMicDta(crt)}
                      title="Ver MIC/DTA relacionados"
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleCreateMicDta(crt)}
                      title="Adicionar MIC/DTA"
                      color="success"
                    >
                      <AssignmentIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCrts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm || selectedTransportadora ? 'Nenhum CRT encontrado' : 'Nenhum CRT cadastrado'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal do formulário */}
      <CRTForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />

      {/* Modal para visualizar MIC/DTA relacionados */}
      <CRTMicDtaViewer
        open={micDtaViewerOpen}
        onClose={() => setMicDtaViewerOpen(false)}
        crt={selectedCrt}
      />

      {/* Modal para adicionar MIC/DTA ao CRT */}
      <AddMicDtaToCRTForm
        open={addMicDtaFormOpen}
        onClose={() => setAddMicDtaFormOpen(false)}
        crt={selectedCrt}
        onSuccess={handleMicDtaSuccess}
      />
    </Box>
  );
}