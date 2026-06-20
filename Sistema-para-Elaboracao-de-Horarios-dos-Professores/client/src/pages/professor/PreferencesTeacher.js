import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField, FormControlLabel, Checkbox,
  Button, Box, Typography,
  useTheme, useMediaQuery,
  FormGroup, Paper,
  CircularProgress, Chip,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import api from '../../service/api';
import { getToken, getUserId } from '../../service/auth';
import AlertMessage from '../../components/AlertMessage';

const PreferencesTeacher = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentPreference, setCurrentPreference] = useState(null);
  const [error, setError] = useState(null);
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [selectedDayIds, setSelectedDayIds] = useState([]);
  const [observations, setObservations] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [originalSelectedDayIds, setOriginalSelectedDayIds] = useState([]);
  const [originalObservations, setOriginalObservations] = useState('');

  const [alertState, setAlertState] = useState({
    show: false,
    message: '',
    type: 'info',
  });

  const [isEditing, setIsEditing] = useState(false);

  const dayNameDisplayMap = daysOfWeek.reduce((map, day) => {
    map[day.id] = day.name;
    return map;
  }, {});

  const fetchDaysOfWeek = async () => {
    try {
      const response = await api.get('/daysOfWeek');
      const orderedDays = response.data.sort((a, b) => {
        const dayOrder = { 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5 };
        return dayOrder[a.name] - dayOrder[b.name];
      });
      setDaysOfWeek(orderedDays);
    } catch (err) {
      showAlert({ message: 'Erro ao carregar dias da semana.', type: 'error' });
    }
  };

  const fetchUserPreference = async () => {
    setError(null);
    try {
      const userId = getUserId();
      const response = await api.get(`users/${userId}/preferences/days`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const prefsDays = response.data;

      setCurrentPreference(prefsDays);
      setSelectedDayIds(prefsDays.map(day => day.id));

      const firstObservation = prefsDays.find(day => day.preferencesDay?.observation)?.preferencesDay?.observation || '';

      setObservations(firstObservation);
      setOriginalSelectedDayIds(prefsDays.map(day => day.id));
      setOriginalObservations(firstObservation);

    } catch (err) {
      if (err.response && (err.response.status === 404 || err.response.status === 204)) {
        setCurrentPreference([]);
        setObservations('');
        setSelectedDayIds([]);
        setIsEditing(false);
        setOriginalSelectedDayIds([]);
        setOriginalObservations('');
      } else {
        setError('Erro ao carregar sua preferência.');
      }
    }
  };

  useEffect(() => {
    fetchDaysOfWeek();
    fetchUserPreference();
  }, []);

  const handleDayChange = (event) => {
    const dayId = parseInt(event.target.value);
    setSelectedDayIds(prevSelectedDays =>
      event.target.checked
        ? [...prevSelectedDays, dayId]
        : prevSelectedDays.filter(id => id !== dayId)
    );
  };

  const handleObservationsChange = (event) => {
    setObservations(event.target.value);
  };

  const hasChanges = useCallback(() => {
    const sortedSelected = [...selectedDayIds].sort((a, b) => a - b);
    const sortedOriginal = [...originalSelectedDayIds].sort((a, b) => a - b);

    const daysChanged = JSON.stringify(sortedSelected) !== JSON.stringify(sortedOriginal);
    const obsChanged = observations.trim() !== originalObservations.trim();

    return daysChanged || obsChanged;
  }, [selectedDayIds, observations, originalSelectedDayIds, originalObservations]);


  const handleSaveChanges = async () => {
    if (selectedDayIds.length === 0) {
      showAlert({ message: 'É obrigatório selecionar pelo menos um dia da semana.', type: 'error' });
      return;
    }

    setIsSaving(true);

    const token = getToken();
    const userId = getUserId();

    if (!token || !userId) {
      showAlert({ message: 'Usuário não autenticado. Por favor, faça login novamente.', type: 'error' });
      setIsSaving(false);
      return;
    }

    const dataToSave = {
      prefDays: selectedDayIds.map(dayId => ({
        dayId,
        observation: observations.trim() || null,
      })),
    };

    try {
      await api.post(`users/${userId}/preferences/days`, dataToSave, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showAlert({ message: 'Preferência salva com sucesso.', type: 'success' });

      setTimeout(async () => {
        await fetchUserPreference();
        setIsEditing(false);
        handleCloseAlert();
      }, 2000);

    } catch (error) {
      let errorMessage = 'Erro ao salvar preferências. Tente novamente.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      showAlert({ message: errorMessage, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setSelectedDayIds(currentPreference?.map(day => day.id) || []);
    const firstObservation = currentPreference?.find(day => day.preferencesDay?.observation)?.preferencesDay?.observation || '';
    setObservations(firstObservation);
    setOriginalSelectedDayIds(currentPreference?.map(day => day.id) || []);
    setOriginalObservations(firstObservation);
  };

  const showAlert = useCallback(({ message, type }) => {
    setAlertState({ show: true, message, type });
  }, []);

  const handleCloseAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, show: false }));
  }, []);


  const handleCancelEdit = () => {
    setIsEditing(false);

    if (currentPreference && currentPreference.length > 0) {
      setSelectedDayIds(originalSelectedDayIds);
      setObservations(originalObservations);
    } else {
      setObservations('');
      setSelectedDayIds([]);
    }
  };

  const handleStartCreation = () => {
    setIsEditing(true);
    setObservations('');
    setSelectedDayIds([]);
    setOriginalObservations('');
    setOriginalSelectedDayIds([]);
  };

  let isActionButtonDisabled = isSaving;

  const isCreatingNewPreference = !currentPreference || currentPreference.length === 0;

  if (isCreatingNewPreference) {
    isActionButtonDisabled = isSaving;
  } else {
    isActionButtonDisabled = isSaving || selectedDayIds.length === 0 || !hasChanges();
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        padding: isMobile ? '16px' : '32px',
      }}
    >
      <Typography
        variant={isMobile ? 'h6' : 'h5'}
        component="h2"
        gutterBottom
        sx={{
          marginBottom: '24px',
          fontWeight: 'bold',
          color: '#333',
          textAlign: 'center',
          width: '100%',
          mt: isMobile ? 3 : 0,
        }}
      >
        Minhas Preferências de Dias
      </Typography>

      <Paper
        elevation={3}
        sx={{
          padding: isMobile ? '16px' : '32px',
          margin: isMobile ? '16px 0' : '0',
          maxWidth: '700px',
          width: '100%',
          borderRadius: '8px',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        {error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Dias Preferenciais:
              </Typography>
              {!isEditing && (
                <>
                  {!currentPreference || currentPreference.length === 0 ? (
                    !isMobile && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleStartCreation}
                        sx={{
                          height: '35px',
                          padding: '0 10px',
                          fontSize: '0.8rem',
                          textTransform: 'none',
                          backgroundColor: '#2e7d32',
                          '&:hover': { backgroundColor: '#1b5e20' },
                          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                          borderRadius: '6px',
                        }}
                      >
                        Cadastrar Preferências
                      </Button>
                    )
                  ) : (
                    <IconButton
                      onClick={handleEditClick}
                      sx={{
                        color: '#2e7d32',
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </>
              )}
            </Box>

            {isEditing ? (
              <FormGroup row sx={{ mb: 4 }}>
                {daysOfWeek.length > 0 ? (
                  daysOfWeek.map((day) => (
                    <FormControlLabel
                      key={day.id}
                      control={
                        <Checkbox
                          value={day.id}
                          checked={selectedDayIds.includes(day.id)}
                          onChange={handleDayChange}
                          color="success"
                          disabled={isSaving}
                        />
                      }
                      label={day.name}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">Carregando dias da semana...</Typography>
                )}
              </FormGroup>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {currentPreference && currentPreference.length > 0 ? (
                  currentPreference
                    .slice()
                    .sort((a, b) => {
                      const dayOrder = { 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5 };
                      return dayOrder[a.name] - dayOrder[b.name];
                    })
                    .map((prefDay) => (
                      <Chip
                        key={prefDay.id}
                        label={dayNameDisplayMap[prefDay.id] || `Dia ${prefDay.id}`}
                        color="success"
                        variant="outlined"
                        sx={{ fontSize: '0.9rem', padding: '5px 8px' }}
                      />
                    ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Nenhum dia selecionado.</Typography>
                )}
              </Box>
            )}

            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
              Observações:
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                value={observations}
                onChange={handleObservationsChange}
                variant="outlined"
                disabled={isSaving}
                sx={{
                  mb: 2, '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2e7d32',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#2e7d32',
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                  textAlign: 'justify',
                  lineHeight: '2',
                }}
              >
                {currentPreference && currentPreference.find(day => day.preferencesDay?.observation)?.preferencesDay?.observation || 'Nenhuma observação.'}
              </Typography>
            )}

            {isEditing && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  mt: 3,
                  justifyContent: 'flex-start',
                }}
              >
                <Button
                  variant="outlined"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  sx={{
                    height: '35px',
                    borderColor: '#d32f2f',
                    color: '#d32f2f',
                    '&:hover': {
                      borderColor: '#b71c1c',
                      color: '#b71c1c',
                      backgroundColor: 'rgba(211, 47, 47, 0.04)',
                    },
                    textTransform: 'none',
                    fontSize: '14px',
                    padding: '0 20px',
                    borderRadius: '6px',
                  }}
                >
                  Cancelar
                </Button>

                <Button
                  variant="contained"
                  onClick={handleSaveChanges}
                  disabled={isActionButtonDisabled}
                  sx={{
                    height: '35px',
                    backgroundColor: '#2e7d32',
                    '&:hover': { backgroundColor: '#1b5e20' },
                    textTransform: 'none',
                    fontSize: '14px',
                    padding: '0 26px',
                    borderRadius: '6px',
                  }}
                  startIcon={isSaving && <CircularProgress size={20} color="inherit" />}
                >
                  {isSaving ? 'Salvando...' : (isCreatingNewPreference ? 'Cadastrar' : 'Salvar')}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {isMobile && !isEditing && (!currentPreference || currentPreference.length === 0) && (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start', mt: 2, maxWidth: '700px' }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleStartCreation}
            sx={{
              height: '40px',
              padding: '0 16px',
              fontSize: '0.9rem',
              textTransform: 'none',
              backgroundColor: '#2e7d32',
              '&:hover': { backgroundColor: '#1b5e20' },
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
              borderRadius: '6px',
            }}
          >
            Cadastrar Preferências
          </Button>
        </Box>
      )}

      {alertState.show && (
        <AlertMessage
          message={alertState.message}
          type={alertState.type}
          onClose={handleCloseAlert}
        />
      )}
    </Box>
  );
};

export default PreferencesTeacher;