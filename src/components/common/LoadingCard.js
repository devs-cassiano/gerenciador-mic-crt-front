import React from 'react';
import { Card, CardContent, CircularProgress, Box, Typography } from '@mui/material';

export default function LoadingCard({ message = 'Carregando...' }) {
  return (
    <Card>
      <CardContent>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight={200}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {message}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}