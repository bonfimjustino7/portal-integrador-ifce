import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Link, Box, Fade, IconButton, InputAdornment, useMediaQuery, useTheme } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SchoolIcon from '@mui/icons-material/School';
import { login } from '../../service/auth';

const Login = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      onLogin();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erro desconhecido');
    }
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleLogin(event);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: 'Roboto, sans-serif' }}>
      <Fade in timeout={1200}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            width: '90%',
            maxWidth: '1000px',
            minHeight: isMobile ? 'auto' : '600px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: isMobile ? '30px' : '40px',
              background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
              overflow: 'hidden',
              borderBottomLeftRadius: isMobile ? '20px' : '20px',
              borderTopLeftRadius: isMobile ? '20px' : '20px',
              borderBottomRightRadius: isMobile ? 0 : '0px',
              borderTopRightRadius: isMobile ? 0 : '0px',
            }}
          >
            <SchoolIcon sx={{ fontSize: isMobile ? '50px' : '60px', color: '#ffffff', mb: 0 }} />
            <Typography sx={{ fontSize: isMobile ? '25px' : '40px', fontWeight: 700, textAlign: 'center', color: '#ffffff', zIndex: 1, mb: 1, letterSpacing: '1px' }}>
              Gestão de Horários
            </Typography>
            <Typography sx={{ fontSize: '14px', color: '#e8f5e9', textAlign: 'center', maxWidth: '90%', zIndex: 1, lineHeight: '1.0' }}>
              Organize com eficiência os horários dos professores
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: isMobile ? '30px' : '40px',
              backgroundColor: '#ffffff',
              borderBottomRightRadius: '20px',
              borderTopRightRadius: '20px',
              borderBottomLeftRadius: isMobile ? 0 : '0px',
              borderTopLeftRadius: isMobile ? 0 : '0px',
            }}
          >
            <Box sx={{ width: '100%', maxWidth: '350px' }}>
              <Typography sx={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 600, color: '#333', mb: 3, textAlign: 'center', letterSpacing: '0.5px', fontFamily: 'Roboto, sans-serif' }}>
                Login
              </Typography>
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    backgroundColor: '#f9f9f9',
                    transition: 'background-color 0.3s, border-color 0.3s',
                    '&:hover': {
                      backgroundColor: '#f0f0f0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#388E3C',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2E7D32',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#666',
                    fontSize: '14px',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#2E7D32',
                  },
                }}
              />
              <TextField
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    backgroundColor: '#f9f9f9',
                    transition: 'background-color 0.3s, border-color 0.3s',

                    '&:hover': {
                      backgroundColor: '#f0f0f0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#388E3C',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2E7D32',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#666',
                    fontSize: '14px',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#2E7D32',
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 1 }}>
                {error && (
                  <Typography color="error" sx={{ fontSize: '14px', mr: 1 }}>
                    {error}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 5 }}>
                <Link href="/verify-email" sx={{ fontSize: '14px', color: '#2E7D32', textDecoration: 'none' }}>
                  Esqueceu a senha?
                </Link>
              </Box>
              <Button
                variant="contained"
                fullWidth
                onClick={handleLogin}
                sx={{ backgroundColor: '#2E7D32', color: '#ffffff', padding: '12px 0', textTransform: 'none', fontSize: '16px', borderRadius: '10px', '&:hover': { backgroundColor: '#388E3C' }, boxShadow: '0 4px 15px rgba(76,175,80,0.3)' }}
              >
                Entrar
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};

export default Login;