import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../../service/api';
import { getToken } from '../../service/auth';
import { useNavigate } from 'react-router-dom';

const textFieldStyle = {
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#2e7d32',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#2e7d32',
  },
};

const inputLabelStyle = {
  '&.Mui-focused': {
    color: '#2e7d32',
  },
};

const selectStyle = {
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.23)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#2e7d32',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#2e7d32',
  },
};

const cancelButtonStyle = {
  color: '#d32f2f',
  borderColor: '#d32f2f',
  backgroundColor: 'white',
  '&:hover': {
    backgroundColor: '#ffebee',
    borderColor: '#b71c1c',
  },
  textTransform: 'none',
};

const saveButtonStyle = {
  backgroundColor: '#2e7d32',
  '&:hover': { backgroundColor: '#1b5e20' },
  textTransform: 'none',
};

const RegisterUser = ({ onUserRegistered, onClose, setAlert }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    nameCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'nameCode') {
      const lettersOnly = value.replace(/[^a-zA-Z]/g, '');
      setFormData({ ...formData, [name]: lettersOnly.toUpperCase() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert((prev) => ({ ...prev, show: false }));

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.role ||
      !formData.nameCode
    ) {
      setAlert({
        show: true,
        message: 'Preencha todos os campos obrigatórios antes de prosseguir.',
        type: 'warning',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setAlert({ show: true, message: 'As senhas não coincidem.', type: 'error' });
      return;
    }

    const token = getToken();
    if (!token) {
      setAlert({
        show: true,
        message: 'Usuário não autenticado. Faça login novamente.',
        type: 'error',
      });
      return;
    }

    try {
      const { name, email, password, role, nameCode } = formData;
      const response = await api.post(
        'users/',
        { name, email, password, role, nameCode },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 201) {
        setAlert({
          show: true,
          message: 'Usuário cadastrado com sucesso.',
          type: 'success',
        });
        if (onUserRegistered) {
          onUserRegistered();
        } else {
          navigate('/users');
        }
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: '',
          nameCode: '',
        });
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);

      let errorMessage = 'Erro ao comunicar com o servidor. Tente novamente.';

      if (error.response) {
        if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage = `Erro do servidor: ${error.response.status} ${error.response.statusText}`;
        }
      } else if (error.request) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão de internet.';
      }

      setAlert({ show: true, message: errorMessage, type: 'error' });
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? 2 : 5,
        borderRadius: 4,
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: isMobile ? '100%' : 450,
        margin: 'auto',
      }}
    >
      <Typography
        variant={isMobile ? 'h6' : 'h5'}
        component="h2"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: '#2e7d32',
          mb: isMobile ? 1 : 2,
          textAlign: 'center',
        }}
      >
        Cadastrar Usuário
      </Typography>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: 'repeat(6, auto)',
          gap: isMobile ? 15 : 12,
          width: '100%',
          maxWidth: isMobile ? '100%' : 400,
        }}
        noValidate
      >
        <TextField
          label="Nome Completo (Obrigatório)"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          sx={textFieldStyle}
        />
        <TextField
          label="Email (Obrigatório)"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          sx={textFieldStyle}
        />
        <TextField
          label="Código do Nome (Obrigatório)"
          name="nameCode"
          value={formData.nameCode}
          onChange={handleChange}
          fullWidth
          inputProps={{
            pattern: '[a-zA-Z]*',
          }}
          sx={{
            ...textFieldStyle,
            '& input': {
              textTransform: 'uppercase',
            },
          }}
        />
        <TextField
          label="Senha (Obrigatório)"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleClickShowPassword} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={textFieldStyle}
        />
        <TextField
          label="Confirmar Senha (Obrigatório)"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={handleChange}
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleClickShowConfirmPassword} edge="end">
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={textFieldStyle}
        />
        <FormControl fullWidth>
          <InputLabel id="role-label" sx={inputLabelStyle}>
            Cargo (Obrigatório)
          </InputLabel>
          <Select
            labelId="role-label"
            name="role"
            value={formData.role}
            onChange={handleChange}
            label="Cargo (Obrigatório)"
            sx={selectStyle}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 90,
                  overflowY: 'auto',
                },
              },
            }}
          >
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Professor">Professor</MenuItem>
            <MenuItem value="Coordenador">Coordenador</MenuItem>
            <MenuItem value="Diretor Ensino">Diretor Ensino</MenuItem>
          </Select>
        </FormControl>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: isMobile ? 1 : 2,
            gap: isMobile ? 1 : 2,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
          }}
        >
          <Button
            variant="outlined"
            sx={{
              ...cancelButtonStyle,
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              padding: isMobile ? '6px 12px' : '8px 16px',
            }}
            onClick={handleCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              ...saveButtonStyle,
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              padding: isMobile ? '6px 12px' : '8px 16px',
            }}
          >
            Cadastrar
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default RegisterUser;