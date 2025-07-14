import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import {
  LocalShipping as TruckIcon,
  Description as DocumentIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { useApiQuery } from '../../hooks/useApi';
import { transportadoraService } from '../../services/transportadoraService';
import { crtService } from '../../services/crtService';
import { micDtaService } from '../../services/micDtaService';
import LoadingCard from '../../components/common/LoadingCard';
import ErrorCard from '../../components/common/ErrorCard';
import { formatDateBR } from '../../utils/dateUtils';

function StatCard({ title, value, icon, color = 'primary' }) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`} sx={{ fontSize: 40 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  // Queries para buscar dados
  const { data: transportadoras, isLoading: loadingTransportadoras } = useApiQuery(
    'transportadoras',
    transportadoraService.getAll
  );

  const { data: crts, isLoading: loadingCrts } = useApiQuery(
    'crt',
    crtService.getAll
  );

  const { data: micDtas, isLoading: loadingMicDtas } = useApiQuery(
    'mic-dta',
    micDtaService.getAll
  );

  // Estatísticas calculadas
  const stats = React.useMemo(() => {
    if (!transportadoras?.data || !crts?.data || !micDtas?.data) {
      return { transportadoras: 0, crts: 0, micDtas: 0, micDtasNormal: 0, micDtasLastre: 0 };
    }

    const micDtasNormal = micDtas.data.filter(item => item.tipo === 'NORMAL').length;
    const micDtasLastre = micDtas.data.filter(item => item.tipo === 'LASTRE').length;

    return {
      transportadoras: transportadoras.data.length,
      crts: crts.data.length,
      micDtas: micDtas.data.length,
      micDtasNormal,
      micDtasLastre
    };
  }, [transportadoras, crts, micDtas]);

  // Documentos recentes
  const recentDocuments = React.useMemo(() => {
    if (!crts?.data || !micDtas?.data) return [];

    const allDocs = [
      ...crts.data.map(crt => ({
        ...crt,
        type: 'CRT',
        displayName: `CRT ${crt.numero}`,
        date: crt.createdAt
      })),
      ...micDtas.data.map(mic => ({
        ...mic,
        type: mic.tipo === 'NORMAL' ? 'MIC/DTA Normal' : 'MIC/DTA Lastre',
        displayName: `MIC/DTA ${mic.numero}`,
        date: mic.createdAt
      }))
    ];

    return allDocs
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [crts, micDtas]);

  // Licenças próximas do vencimento
  const licencasVencimento = React.useMemo(() => {
    if (!transportadoras?.data) return { vencidas: [], proximasVencimento: [] };

    const hoje = new Date();
    const vencidas = [];
    const proximasVencimento = [];

    transportadoras.data.forEach(transportadora => {
      transportadora.paisesDestino?.forEach(destino => {
        if (destino.vencimentoLicenca) {
          const vencimento = new Date(destino.vencimentoLicenca);
          const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
          
          const licencaInfo = {
            transportadora: transportadora.nome,
            pais: destino.paisDestino,
            licenca: destino.licenca,
            vencimento: vencimento,
            diasRestantes
          };

          if (diasRestantes < 0) {
            vencidas.push(licencaInfo);
          } else if (diasRestantes <= 30) {
            proximasVencimento.push(licencaInfo);
          }
        }
      });
    });

    return {
      vencidas: vencidas.sort((a, b) => a.vencimento - b.vencimento),
      proximasVencimento: proximasVencimento.sort((a, b) => a.vencimento - b.vencimento)
    };
  }, [transportadoras]);

  if (loadingTransportadoras || loadingCrts || loadingMicDtas) {
    return <LoadingCard message="Carregando dashboard..." />;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Visão geral do sistema de gerenciamento de numeração de licenças documentos de transporte internacional
      </Typography>

      {/* Cards de estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Transportadoras"
            value={stats.transportadoras}
            icon={<TruckIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="CRTs Gerados"
            value={stats.crts}
            icon={<DocumentIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="MIC/DTAs Normais"
            value={stats.micDtasNormal}
            icon={<AssignmentIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="MIC/DTAs Lastre"
            value={stats.micDtasLastre}
            icon={<AssignmentIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Documentos recentes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Documentos Recentes
            </Typography>
            <List>
              {recentDocuments.map((doc, index) => (
                <ListItem key={`${doc.type}-${doc.id}`} divider={index < recentDocuments.length - 1}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{doc.displayName}</span>
                        <Chip
                          label={doc.type}
                          size="small"
                          color={
                            doc.type === 'CRT' ? 'success' :
                            doc.type === 'MIC/DTA Normal' ? 'info' : 'warning'
                          }
                        />
                      </Box>
                    }
                    secondary={`${doc.transportadoraNome} • ${formatDateBR(doc.date)}`}
                  />
                </ListItem>
              ))}
              {recentDocuments.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="Nenhum documento encontrado"
                    secondary="Comece criando uma transportadora e gerando documentos"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Status das Licenças */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status das Licenças
            </Typography>
            
            {/* Licenças vencidas */}
            {licencasVencimento.vencidas.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="error.main" gutterBottom>
                  Licenças Vencidas ({licencasVencimento.vencidas.length})
                </Typography>
                <List dense>
                  {licencasVencimento.vencidas.slice(0, 3).map((licenca, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${licenca.transportadora} - ${licenca.pais}`}
                        secondary={`Licença: ${licenca.licenca} • Venceu em ${formatDateBR(licenca.vencimento)}`}
                      />
                      <Chip label="VENCIDA" color="error" size="small" />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Próximas do vencimento */}
            {licencasVencimento.proximasVencimento.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="warning.main" gutterBottom>
                  Próximas do Vencimento ({licencasVencimento.proximasVencimento.length})
                </Typography>
                <List dense>
                  {licencasVencimento.proximasVencimento.slice(0, 3).map((licenca, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${licenca.transportadora} - ${licenca.pais}`}
                        secondary={`Licença: ${licenca.licenca} • ${licenca.diasRestantes} dia${licenca.diasRestantes !== 1 ? 's' : ''} restante${licenca.diasRestantes !== 1 ? 's' : ''}`}
                      />
                      <Chip label={`${licenca.diasRestantes}d`} color="warning" size="small" />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Sem problemas */}
            {licencasVencimento.vencidas.length === 0 && licencasVencimento.proximasVencimento.length === 0 && (
              <Box display="flex" alignItems="center" justifyContent="center" py={3}>
                <Box textAlign="center">
                  <TrendingIcon color="success" sx={{ fontSize: 48 }} />
                  <Typography variant="body2" color="success.main">
                    Todas as licenças estão em dia!
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}