import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../../service/api';
import { getToken } from '../../service/auth';

const RegisterTeacher = ({ onTeacherRegistered, onClose, setAlert, teacherData }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nameCode: '',
  });
  const [initialFormData, setInitialFormData] = useState(null);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const initialData = teacherData
      ? {
          name: teacherData.name || '',
          email: teacherData.email || '',
          password: '',
          confirmPassword: '',
          nameCode: teacherData.nameCode || '',
        }
      : {
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          nameCode: '',
        };
    setFormData(initialData);
    setInitialFormData(initialData);
  }, [teacherData]);

  useEffect(() => {
    if (initialFormData) {
      const hasChanged = Object.keys(formData).some(
        (key) => formData[key] !== initialFormData[key]
      );
      setIsFormChanged(hasChanged);
    }
  }, [formData, initialFormData]);

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
      !formData.nameCode ||
      (!teacherData && (!formData.password || !formData.confirmPassword))
    ) {
      setAlert({
        show: true,
        message: 'Preencha todos os campos obrigatórios antes de prosseguir.',
        type: 'warning',
      });
      return;
    }

    if (!teacherData && formData.password !== formData.confirmPassword) {
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
      const { name, email, password, nameCode } = formData;
      const payload = { name, email, nameCode, role: 'professor' };

      if (!teacherData && password) {
        payload.password = password;
      }

      let response;
      if (teacherData) {
        response = await api.put(`/users/teachers/${teacherData.id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        response = await api.post('/users/teachers', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (response.status === 201 || response.status === 200) {
        setAlert({
          show: true,
          message: `Professor ${teacherData ? 'atualizado' : 'cadastrado'} com sucesso!`,
          type: 'success',
        });
        if (onTeacherRegistered) {
          onTeacherRegistered();
        }
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          nameCode: '',
        });
        setInitialFormData(null);
        setIsFormChanged(false);
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      console.error(`Erro ao ${teacherData ? 'atualizar' : 'cadastrar'} professor:`, error);

      let errorMessage = 'Erro ao comunicar com o servidor. Tente novamente.';

      if (error.response) {
        if (error.response.data && error.response.data.error) {
          errorMessage = error.response.status === 409 ? error.response.data.error : error.response.data.error;
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
        padding: isMobile ? 1 : 2,
        borderRadius: 4,
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: isMobile ? '100%' : 1000,
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
        sx={{ fontWeight: 'bold', color: '#2e7d32', mb: isMobile ? 1 : 2, textAlign: 'center' }}
      >
        {teacherData ? 'Editar Professor' : 'Cadastrar Professor'}
      </Typography>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 15 : 20,
          width: '350px',
          maxWidth: '100%',
        }}
        noValidate
      >
        <TextField
          label="Nome Completo (Obrigatório)"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#2e7d32',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#2e7d32',
            },
          }}
        />
        <TextField
          label="Email (Obrigatório)"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#2e7d32',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#2e7d32',
            },
          }}
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
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#2e7d32',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#2e7d32',
            },
            '& input': {
              textTransform: 'uppercase',
            },
          }}
        />
        {!teacherData && (
          <>
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
              sx={{
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#2e7d32',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#2e7d32',
                },
              }}
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
              sx={{
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#2e7d32',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#2e7d32',
                },
              }}
            />
          </>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 1 : 2, mt: isMobile ? 1 : 2, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <Button
            variant="outlined"
            sx={{
              color: '#d32f2f',
              borderColor: '#d32f2f',
              backgroundColor: 'white',
              '&:hover': {
                backgroundColor: '#ffebee',
                borderColor: '#b71c1c',
              },
              textTransform: 'none',
            }}
            onClick={handleCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isFormChanged}
            sx={{
              backgroundColor: '#2e7d32',
              '&:hover': { backgroundColor: '#1b5e20' },
              textTransform: 'none',
              '&.Mui-disabled': {
                backgroundColor: '#e0e0e0',
                color: '#9e9e9e',
              },
            }}
          >
            {teacherData ? 'Salvar' : 'Cadastrar'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default RegisterTeacher;