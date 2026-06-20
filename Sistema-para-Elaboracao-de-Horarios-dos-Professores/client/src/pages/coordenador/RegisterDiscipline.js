import React, { useState, useEffect } from 'react';
import {
  TextField,
  FormControl, InputLabel, Select, MenuItem,
  Button, Box, Typography,
  useTheme, useMediaQuery,
} from '@mui/material';
import api from '../../service/api';
import { getToken } from '../../service/auth';

const RegisterDiscipline = ({
  open,
  onClose,
  initialDiscipline,
  onCreated,
  onUpdated,
  setAlert,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    workload: '',
    credit: ''
  });
  const [initialFormData, setInitialFormData] = useState(null);
  const [isFormChanged, setIsFormChanged] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const initialData = initialDiscipline
      ? {
        name: initialDiscipline.name || '',
        code: initialDiscipline.code || '',
        workload: initialDiscipline.workload || '',
        credit: initialDiscipline.credit || '',
        type: initialDiscipline.type || '',
      }
      : {
        name: '',
        code: '',
        workload: '',
        credit: '',
      };
    setFormData(initialData);
    setInitialFormData(initialData);
  }, [initialDiscipline, open]);

  useEffect(() => {
    if (initialFormData) {
      const hasChanged = Object.keys(formData).some(
        (key) => String(formData[key]) !== String(initialFormData[key])
      );
      setIsFormChanged(hasChanged);
    } else {
      setIsFormChanged(false);
    }
  }, [formData, initialFormData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'code' ? value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ show: false });

    if (!formData.name || !formData.code || !formData.workload || !formData.credit) {
      setAlert({ show: true, message: 'Preencha todos os campos obrigatórios.', type: 'warning' });
      return;
    }

    if (initialDiscipline?.id && !isFormChanged) {
      setAlert({ show: true, message: 'Nenhuma alteração detectada para salvar.', type: 'info' });
      return;
    }


    try {
      const token = getToken();
      if (!token) throw new Error('Usuário não autenticado');

      const payload = {
        ...formData,
        workload: parseInt(formData.workload, 10),
        credit: parseInt(formData.credit, 10),
      };

      if (initialDiscipline?.id) {
        await api.put(`/disciplines/${initialDiscipline.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlert({ show: true, message: 'Disciplina atualizada com sucesso.', type: 'success' });
        onUpdated?.();
      } else {
        await api.post('/disciplines', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlert({ show: true, message: 'Disciplina cadastrada com sucesso.', type: 'success' });
        onCreated?.();
      }
      setFormData({ name: '', code: '', workload: '', credit: '', });
      setInitialFormData(null);
      setIsFormChanged(false);
      onClose();
    } catch (err) {
      setAlert({
        show: true,
        message: err.response?.data?.error || 'Erro ao salvar disciplina.',
        type: 'error',
      });
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Box
      sx={{
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
        sx={{ fontWeight: 'bold', color: '#2e7d32', mb: isMobile ? 3 : 2, textAlign: 'center' }}
      >
        {initialDiscipline ? 'Editar Disciplina' : 'Cadastrar Disciplina'}
      </Typography>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 20 : 14,
          width: '350px',
          maxWidth: '100%',
        }}
        noValidate
      >
        <TextField
          label="Nome (Obrigatório)"
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
          label="Código (Obrigatório)"
          name="code"
          value={formData.code}
          onChange={handleChange}
          fullWidth
          inputProps={{ maxLength: 10 }}
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
        <TextField
          label="Carga horária (Obrigatório)"
          name="workload"
          type="number"
          inputProps={{ min: 1 }}
          value={formData.workload}
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
          label="Créditos (Obrigatório)"
          name="credit"
          type="number"
          inputProps={{ min: 1 }}
          value={formData.credit}
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
            disabled={initialDiscipline ? !isFormChanged : false}
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
            {initialDiscipline ? 'Salvar' : 'Cadastrar'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default RegisterDiscipline;