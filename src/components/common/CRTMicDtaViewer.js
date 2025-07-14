import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Assignment as NormalIcon,
  LocalShipping as LastreIcon
} from '@mui/icons-material';
import { useApiQuery } from '../../hooks/useApi';
import { micDtaService } from '../../services/micDtaService';
import LoadingCard from '../../components/common/LoadingCard';
import ErrorCard from '../../components/common/ErrorCard';
import { formatDateBR } from '../../utils/dateUtils';

export default function CRTMicDtaViewer({ open, onClose, crt }) {
  // Query para buscar MIC/DTAs relacionados ao CRT
  const { data: micDtas, isLoading, error, refetch } = useApiQuery(
    ['mic-dta-crt', crt?.id],
    () => micDtaService.getByCrt(crt?.id),
    {
      enabled: open && !!crt?.id
    }
  );

  const getTipoIcon = (tipo) => {
    return tipo === 'LASTRE' ? <LastreIcon /> : <NormalIcon />;
  };

  const getTipoColor = (tipo) => {
    return tipo === 'LASTRE' ? 'warning' : 'primary';
  };

  const formatData = (dataString) => {
    return formatDateBR(dataString);
  };

  const getStatusColor = (micDta) => {
    // Baseado nas informações do OpenAPI, não há status específico
    // mas podemos inferir pelo tipo
    return micDta.tipo === 'LASTRE' ? 'warning' : 'success';
  };

  const getStatusLabel = (micDta) => {
    return micDta.tipo === 'LASTRE' ? 'Lastre' : 'Normal';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">
              MIC/DTA relacionados ao CRT
            </Typography>
            {crt && (
              <Typography variant="body2" color="text.secondary">
                CRT: {crt.numero} - {crt.transportadoraNome}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {isLoading && <LoadingCard message="Carregando MIC/DTAs..." />}
        
        {error && (
          <ErrorCard 
            message="Erro ao carregar MIC/DTAs relacionados" 
            onRetry={refetch} 
          />
        )}

        {micDtas && (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Transportadora</TableCell>
                  <TableCell>Rota</TableCell>
                  <TableCell>Informações Adicionais</TableCell>
                  <TableCell>Data Criação</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {micDtas.data?.length > 0 ? (
                  micDtas.data.map((micDta) => (
                    <TableRow key={micDta.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontFamily="monospace">
                          {micDta.numero}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getTipoIcon(micDta.tipo)}
                          label={micDta.tipo}
                          color={getTipoColor(micDta.tipo)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {micDta.transportadoraNome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {micDta.transportadoraPais}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${micDta.paisOrigemCodigo} → ${micDta.paisDestinoCodigo}`}
                          variant="outlined"
                          size="small"
                        />
                        {micDta.licencaComplementar && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Licença: {micDta.licencaComplementar}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {micDta.quantidade || 1}
                        {micDta.crtFaturaComercial && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Fatura: {micDta.crtFaturaComercial}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{formatData(micDta.dataCriacao)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(micDta)}
                          color={getStatusColor(micDta)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Nenhum MIC/DTA encontrado para este CRT
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
