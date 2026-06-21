import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
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

const UserEdit = ({ userId, onUserRegistered, onClose, setAlert }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    nameCode: '',
  });
  const [originalData, setOriginalData] = useState(null);
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
      if (!token) {
        setAlert({ show: true, message: 'Usuário não autenticado.', type: 'error' });
        return;
      }

      try {
        const response = await api.get(`/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          const { name, email, role, nameCode } = response.data;
          setFormData({ name, email, role, nameCode });
          setOriginalData({ name, email, role, nameCode });
        } else {
          setAlert({ show: true, message: 'Erro ao carregar dados do usuário.', type: 'error' });
        }
      } catch (err) {
        setAlert({
          show: true,
          message: 'Erro ao carregar dados do usuário. Verifique a conexão.',
          type: 'error',
        });
        console.error('Erro ao buscar usuário:', err);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, setAlert]);

  const handleNameCodeChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
    setFormData({ ...formData, nameCode: value });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      const authErrorMsg = 'Usuário não autenticado. Faça login novamente.';
      setAlert({ show: true, message: authErrorMsg, type: 'error' });
      return;
    }

    try {
      const { name, email, role, nameCode } = formData;
      const response = await api.put(
        `/users/${userId}`,
        { name, email, role, nameCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setAlert({ show: true, message: 'Usuário editado com sucesso.', type: 'success' });
        if (onUserRegistered) {
          onUserRegistered();
        } else {
          navigate('/users');
        }
        if (onClose) {
          onClose();
        }
      } else {
        const fallbackError =
          response.data?.message || 'Ocorreu um erro desconhecido ao editar o usuário.';
        setAlert({ show: true, message: fallbackError, type: 'error' });
        console.error('Resposta inesperada ao editar usuário:', response.data);
      }
    } catch (error) {
      console.error('Erro na requisição de atualização:', error);

      let errorMessage = 'Erro ao comunicar com o servidor. Tente novamente.';

      if (error.response) {
        if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 404) {
          errorMessage = 'Usuário não encontrado para edição.';
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

  const isSaveButtonEnabled = () => {
    if (!originalData) {
      return false;
    }
    return (
      formData.name !== originalData.name ||
      formData.email !== originalData.email ||
      formData.role !== originalData.role ||
      formData.nameCode !== originalData.nameCode
    );
  };

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
        maxHeight: '100vh',
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#2e7d32',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#1b5e20',
        },
        scrollbarWidth: 'thin',
        scrollbarColor: '#2e7d32 #f1f1f1',
      }}
    >
      <Typography
        variant={isMobile ? 'h6' : 'h5'}
        component="h2"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: '#2e7d32',
          mb: isMobile ? 3 : 2,
          textAlign: 'center',
        }}
      >
        Editar Usuário
      </Typography>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 25 : 25,
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
          onChange={handleNameCodeChange}
          fullWidth
          inputProps={{
            maxLength: 10,
          }}
          sx={{
            ...textFieldStyle,
            '& input': {
              textTransform: 'uppercase',
            },
          }}
        />
        <FormControl fullWidth>
          <InputLabel id="role-label" sx={inputLabelStyle}>
            Cargo (Obrigatório)
          </InputLabel>
          <Select
            labelId="role-label"
            name="role"
            value={formData.role || ''}
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
            disabled={!isSaveButtonEnabled()}
            sx={{
              ...saveButtonStyle,
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              padding: isMobile ? '6px 12px' : '8px 16px',
            }}
          >
            Salvar
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default UserEdit;