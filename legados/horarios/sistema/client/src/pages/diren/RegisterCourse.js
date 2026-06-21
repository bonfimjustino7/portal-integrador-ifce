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
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

import api from '../../service/api';
import { getToken } from '../../service/auth';

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

const RegisterCourse = ({ initialCourse, onCourseCreated, onCourseUpdated, onClose, setAlert }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    duration: '',
    typeLearnId: '',
    coordinatorId: '',
  });
  const [error, setError] = useState('');
  const [typeLearns, setTypeLearns] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [initialFormData, setInitialFormData] = useState({});

  const [selectedCoordinator, setSelectedCoordinator] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) {
        setAlert({ show: true, message: 'Usuário não autenticado.', type: 'error' });
        setIsLoading(false);
        return;
      }

      try {
        const typeLearnResponse = await api.get('/type-learn');
        setTypeLearns(typeLearnResponse.data);

        const coordinatorResponse = await api.get('/users/teachers');
        setCoordinators(coordinatorResponse.data);

        if (initialCourse) {
          const initialCoordinatorId = initialCourse.coordinator?.id || '';
          const initialData = {
            name: initialCourse.name || '',
            code: initialCourse.code?.toUpperCase() || '',
            duration: initialCourse.duration?.toString() || '',
            typeLearnId: initialCourse.typeLearnId || '',
            coordinatorId: initialCoordinatorId,
          };
          setFormData(initialData);
          setInitialFormData(initialData);

          if (initialCoordinatorId) {
            const currentCoordinator = coordinatorResponse.data.find(
              (c) => c.id === initialCoordinatorId
            );
            if (currentCoordinator) {
              setSelectedCoordinator(currentCoordinator);
            } else {
              setSelectedCoordinator(null);
              setFormData((prev) => ({ ...prev, coordinatorId: '' }));
            }
          } else {
            setSelectedCoordinator(null);
            setFormData((prev) => ({ ...prev, coordinatorId: '' }));
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setAlert({ show: true, message: 'Erro ao carregar dados.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [initialCourse, setAlert]);

  useEffect(() => {
    if (initialCourse) {
      const hasChanges = Object.keys(formData).some(
        (key) => formData[key] !== initialFormData[key]
      );
      const initialCoordinatorId = initialCourse.coordinator?.id || '';
      const currentSelectedCoordinatorId = selectedCoordinator?.id || '';
      const coordinatorChanged = initialCoordinatorId !== currentSelectedCoordinatorId;

      setIsFormChanged(hasChanges || coordinatorChanged);
    }
  }, [formData, initialFormData, initialCourse, selectedCoordinator]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'duration') {
      if (/^\d*$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else if (name === 'code') {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCoordinatorChange = (event, newValue) => {
    if (!newValue || newValue.isNotFoundOption) {
      setSelectedCoordinator(null);
      setFormData((prev) => ({ ...prev, coordinatorId: '' }));
    } else {
      setSelectedCoordinator(newValue);
      setFormData((prev) => ({
        ...prev,
        coordinatorId: newValue.id,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, code, duration, typeLearnId } = formData;

    if (!name || !code || !duration || !typeLearnId) {
      setAlert({ show: true, message: 'Por favor, preencha todos os campos obrigatórios.', type: 'warning' });
      return;
    }

    if (parseInt(duration, 10) <= 0) {
      setAlert({ show: true, message: 'O número de semestres deve ser maior que zero.', type: 'warning' });
      return;
    }

    const token = getToken();
    if (!token) {
      setAlert({ show: true, message: 'Usuário não autenticado.', type: 'error' });
      return;
    }

    try {
      const coordinatorIdToSend = selectedCoordinator && !selectedCoordinator.isNotFoundOption
        ? selectedCoordinator.id
        : null;

      const courseData = {
        name,
        code,
        duration: parseInt(duration, 10),
        typeLearnId,
        coordinatorId: coordinatorIdToSend,
      };

      let response;
      if (initialCourse?.id) {
        response = await api.put(`/courses/${initialCourse.id}`, courseData);
        if (response.status === 200) {
          setAlert({ show: true, message: 'Curso atualizado com sucesso.', type: 'success' });
          if (onCourseUpdated) {
            onCourseUpdated();
          }
        }
      } else {
        response = await api.post('/courses', courseData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 201) {
          setAlert({ show: true, message: 'Curso cadastrado com sucesso.', type: 'success' });
          if (onCourseCreated) {
            onCourseCreated();
          }
        }
      }

      if (response?.status === 200 || response?.status === 201) {
        onClose();
      }
    } catch (error) {
      let errorMessage = 'Erro ao comunicar com o servidor.';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      setAlert({ show: true, message: errorMessage, type: 'error' });
      console.error('Erro ao cadastrar/atualizar curso:', error);
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
  };

  const getCoordinatorOptionLabel = (option) => {
    if (!option || option.isNotFoundOption) {
      return '';
    }
    return option.name || '';
  };

  const filterOptions = (options, params) => {
    const defaultFilter = createFilterOptions({
      getOptionLabel: (option) => option.name,
    });
    const filtered = defaultFilter(options, params);

    if (params.inputValue !== '' && filtered.length === 0) {
      return [
        {
          id: 'not-found',
          name: 'Professor não encontrado',
          isNotFoundOption: true,
        },
      ];
    }
    return filtered;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? 2 : 3,
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
        sx={{ fontWeight: 'bold', color: '#2e7d32', mb: isMobile ? 1 : 2, textAlign: 'center' }}
      >
        {initialCourse?.id ? 'Editar Curso' : 'Cadastrar Curso'}
      </Typography>
      {isLoading ? (
        <Typography>Carregando...</Typography>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 10 : 12,
            width: '350px',
            maxWidth: isMobile ? '100%' : 400,
          }}
          noValidate
        >
          <TextField
            label="Nome do Curso (Obrigatório)"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            sx={textFieldStyle}
          />
          <TextField
            label="Código do Curso (Obrigatório)"
            name="code"
            value={formData.code}
            onChange={handleChange}
            fullWidth
            sx={textFieldStyle}
          />
          <TextField
            label="Semestres (Obrigatório)"
            name="duration"
            type="number"
            value={formData.duration}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 1 }}
            sx={textFieldStyle}
          />
          <FormControl fullWidth>
            <InputLabel id="typeLearnId-label" sx={inputLabelStyle}>
              Modalidade de Ensino (Obrigatório)
            </InputLabel>
            <Select
              labelId="typeLearnId-label"
              name="typeLearnId"
              value={formData.typeLearnId}
              onChange={handleChange}
              label="Modalidade de Ensino (Obrigatório)"
              sx={selectStyle}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 150,
                    overflowY: 'auto',
                  },
                },
              }}
            >
              {typeLearns.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            id="coordinator-autocomplete"
            options={coordinators}
            getOptionLabel={getCoordinatorOptionLabel}
            value={selectedCoordinator}
            onChange={handleCoordinatorChange}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Coordenador (Opcional)"
                variant="outlined"
                fullWidth
                sx={textFieldStyle}
              />
            )}
            clearOnEscape
            ListboxProps={{
              style: {
                maxHeight: 90,
                overflowY: 'auto',
              },
            }}
            filterOptions={filterOptions}
            renderOption={(props, option) => (
              <li {...props}>
                {option.isNotFoundOption ? (
                  <Box
                    sx={{
                      fontStyle: 'italic',
                      color: 'text.secondary',
                      pointerEvents: 'none',
                      width: '100%',
                      padding: '8px 16px',
                      boxSizing: 'border-box'
                    }}
                  >
                    {option.name}
                  </Box>
                ) : (
                  option.name
                )}
              </li>
            )}
          />

          {error && (
            <Typography color="error" sx={{ mt: 1, fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              {error}
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: isMobile ? 1 : 2, gap: isMobile ? 1 : 2, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
            <Button
              variant="outlined"
              sx={{ ...cancelButtonStyle, fontSize: isMobile ? '0.8rem' : '0.875rem', padding: isMobile ? '6px 12px' : '8px 16px' }}
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ ...saveButtonStyle, fontSize: isMobile ? '0.8rem' : '0.875rem', padding: isMobile ? '6px 12px' : '8px 16px' }}
              disabled={initialCourse ? !isFormChanged : false}
            >
              {initialCourse?.id ? 'Salvar' : 'Cadastrar'}
            </Button>
          </Box>
        </form>
      )}
    </Box>
  );
};

export default RegisterCourse;