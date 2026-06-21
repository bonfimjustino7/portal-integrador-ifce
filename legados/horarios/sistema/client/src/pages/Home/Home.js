import React from 'react';
import { Box, Typography } from '@mui/material';

function Home() {
  return (
    <Box sx={{ ml: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Início
      </Typography>
      <Typography variant="body1">
        Bem-vindo à página inicial do sistema de Gestão de Horários.
      </Typography>
    </Box>
  );
}

export default Home;