import React from 'react';
import { Card, CardContent, Alert, Button, Box } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

export default function ErrorCard({ message = 'Erro ao carregar dados', onRetry }) {
  return (
    <Card>
      <CardContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
        {onRetry && (
          <Box display="flex" justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              Tentar Novamente
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}