import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogTitle, TextField,
  FormControl, InputLabel, Select, MenuItem,
  Button, Box, Typography, useMediaQuery, useTheme, CircularProgress
} from '@mui/material';
import api from '../../service/api';
import { getToken } from '../../service/auth';
import { jwtDecode } from 'jwt-decode';

const focusedGreenStyles = {
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#2e7d32',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#2e7d32',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.23)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
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

const RegisterClass = ({
  open,
  onClose,
  initialClass,
  onCreated,
  onUpdated,
  setAlert,
}) => {
  const [formData, setFormData] = useState({
    semester: '',
    courseId: '',
    calendarId: '',
    curriculumMatrixId: '',
    turnId: '',
    type: '',
  });
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [courses, setCourses] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [curriculumMatrices, setCurriculumMatrices] = useState([]);
  const [turns, setTurns] = useState([]);
  const [coordinatorCourse, setCoordinatorState] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedCourseDuration, setSelectedCourseDuration] = useState(null);
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const decoded = jwtDecode(token);
        const userId = decoded.id;
        const fetchedUserRole = decoded.role;
        setUserRole(fetchedUserRole);

        let courseData = [];
        let fetchedCoordinatorCourse = null;

        if (fetchedUserRole === 'Coordenador') {
          const courseRes = await api.get(`/courses/coordinator/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchedCoordinatorCourse = courseRes.data;
          courseData = fetchedCoordinatorCourse ? [fetchedCoordinatorCourse] : [];
        } else {
          const courseRes = await api.get('/courses', {
            headers: { Authorization: `Bearer ${token}` },
          });
          courseData = courseRes.data;
        }
        setCourses(courseData);
        setCoordinatorState(fetchedCoordinatorCourse);

        const [calendarRes, matrixRes, turnRes] = await Promise.all([
          api.get('/calendar', { headers: { Authorization: `Bearer ${token}` } }),
          api.get(`/course-grid/coordination/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get('/turns', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setCalendars(calendarRes.data);
        setCurriculumMatrices(matrixRes.data);
        setTurns(turnRes.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setAlert({ show: true, message: 'Erro ao carregar dados.', type: 'error' });
      }
    };
    if (open) {
      fetchData();
    }
  }, [setAlert, open]);

  useEffect(() => {
    if (initialClass) {
      setFormData({
        semester: initialClass.semester ? initialClass.semester.toString() : '',
        courseId: initialClass.courseId || initialClass.course?.id || '',
        calendarId: initialClass.calendarId || initialClass.calendar?.id || '',
        curriculumMatrixId: initialClass.gridCourseId || initialClass.gridCourse?.id || '',
        turnId: initialClass.turnId || initialClass.turn?.id || '',
        type: initialClass.type || '',
      });

      const initialCourse = courses.find(c => c.id === (initialClass.courseId || initialClass.course?.id));
      setSelectedCourseDuration(initialCourse?.duration || 10);
      setIsFormChanged(false);
    } else {
      setFormData({
        semester: '',
        courseId: coordinatorCourse ? coordinatorCourse.id : '',
        calendarId: '',
        curriculumMatrixId: '',
        turnId: '',
        type: '',
      });
      setSelectedCourseDuration(coordinatorCourse?.duration || 10);
      setIsFormChanged(false);
    }
  }, [initialClass, open, coordinatorCourse, courses]);

  useEffect(() => {
    if (initialClass) {
      const hasChanges =
        formData.semester !== (initialClass.semester ? initialClass.semester.toString() : '') ||
        formData.courseId !== (initialClass.courseId || initialClass.course?.id || '') ||
        formData.calendarId !== (initialClass.calendarId || initialClass.calendar?.id || '') ||
        formData.curriculumMatrixId !== (initialClass.gridCourseId || initialClass.gridCourse?.id || '') ||
        formData.turnId !== (initialClass.turnId || initialClass.turn?.id || '') ||
        formData.type !== (initialClass.type || '');
      setIsFormChanged(hasChanges);
    } else {
      const isDefaultStateForNewClass = (
        formData.semester === '' &&
        formData.calendarId === '' &&
        formData.curriculumMatrixId === '' &&
        formData.turnId === '' &&
        formData.courseId === (coordinatorCourse ? coordinatorCourse.id : '') &&
        formData.type === ''
      );
      setIsFormChanged(!isDefaultStateForNewClass);
    }
  }, [formData, initialClass, coordinatorCourse]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'courseId' && isCourseDisabled) {
      return;
    }

    if (name === 'courseId') {
      const selectedCourse = courses.find(c => c.id === parseInt(value));
      setSelectedCourseDuration(selectedCourse?.duration || 10);
      setFormData({ ...formData, [name]: value, semester: '' }); // Reset semester when course changes
    } else if (name === 'semester') {
      const numValue = parseInt(value, 10);
      if (value === '' || (!isNaN(numValue) && numValue >= 1 && numValue <= selectedCourseDuration)) {
        setFormData({ ...formData, [name]: value });
        setAlert({ show: false, message: '', type: '' });
      } else {
        setAlert({
          show: true,
          message: `Semestre deve ser um número entre 1 e ${selectedCourseDuration}.`,
          type: 'warning',
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
      setAlert({ show: false, message: '', type: '' });
    }
  };

  const handleTypeChange = (e) => {
    const { value } = e.target;
    const uppercaseValue = value.toUpperCase();
    if (/^[A-Z]*$/.test(uppercaseValue) || value === '') {
      setFormData({ ...formData, type: uppercaseValue });
      setAlert({ show: false, message: '', type: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isCreating = !initialClass;
    if (!formData.semester || !formData.courseId || !formData.calendarId || !formData.curriculumMatrixId || !formData.turnId) {
      setAlert({ show: true, message: 'Preencha todos os campos obrigatórios!', type: 'warning' });
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      if (!token) throw new Error('Usuário não autenticado');

      const payload = {
        semester: parseInt(formData.semester, 10),
        courseId: parseInt(formData.courseId, 10),
        calendarId: parseInt(formData.calendarId, 10),
        gridCourseId: parseInt(formData.curriculumMatrixId, 10),
        turnId: formData.turnId ? parseInt(formData.turnId, 10) : null,
        type: formData.type || null,
      };

      if (initialClass?.id) {
        await api.put(`/classes/${initialClass.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlert({ show: true, message: 'Turma atualizada com sucesso.', type: 'success' });
        onUpdated && onUpdated();
      } else {
        await api.post('/classes/', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlert({ show: true, message: 'Turma cadastrada com sucesso.', type: 'success' });
        onCreated && onCreated();
      }
      onClose();
    } catch (err) {
      setAlert({
        show: true,
        message: err.response?.data?.error || 'Erro ao salvar turma.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const isCourseDisabled =
    (!initialClass && userRole === 'Coordenador' && coordinatorCourse !== null) ||
    (initialClass !== null && userRole === 'Coordenador');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={isMobile ? 'sm' : 'xs'}
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: isMobile ? 1 : 2,
          width: '100%',
          maxWidth: isMobile ? '90%' : 430,
          maxHeight: '90vh',
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
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', p: isMobile ? 1 : 2, mb: isMobile ? 0 : 1 }}>
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          fontWeight="bold"
          color="#2e7d32"
        >
          {initialClass ? 'Editar Turma' : 'Cadastrar Turma'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ padding: isMobile ? 1 : 2 }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 1 : 1,
            width: '100%',
            maxWidth: isMobile ? '100%' : 430,
          }}
        >
          <FormControl fullWidth margin="dense" sx={focusedGreenStyles}>
            <InputLabel id="courseId-label">Curso (Obrigatório)</InputLabel>
            <Select
              labelId="courseId-label"
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              label="Curso (Obrigatório)"
              disabled={isCourseDisabled}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: isMobile ? 150 : 200,
                    overflowY: 'auto',
                  },
                },
              }}
            >
              {courses.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" sx={focusedGreenStyles}>
            <InputLabel id="semester-label">Semestre (Obrigatório)</InputLabel>
            <Select
              labelId="semester-label"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              label="Semestre (Obrigatório)"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: isMobile ? 120 : 145,
                    overflowY: 'auto',
                  },
                },
              }}
            >
              {Array.from({ length: selectedCourseDuration }, (_, i) => i + 1).map((num) => (
                <MenuItem key={num} value={num}>{num}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="dense"
            label="Variação (Opcional)"
            name="type"
            value={formData.type}
            onChange={handleTypeChange}
            sx={focusedGreenStyles}
            inputProps={{ maxLength: 50 }}
            placeholder="Ex: A, B, C"
          />

          <FormControl fullWidth margin="dense" sx={focusedGreenStyles}>
            <InputLabel id="curriculumMatrixId-label">Matriz Curricular (Obrigatório)</InputLabel>
            <Select
              labelId="curriculumMatrixId-label"
              name="curriculumMatrixId"
              value={formData.curriculumMatrixId}
              onChange={handleChange}
              label="Matriz Curricular (Obrigatório)"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: isMobile ? 150 : 150,
                    maxWidth: isMobile ? 150 : 150,
                    overflowY: 'auto',
                  },
                },
              }}
            >
              {curriculumMatrices.map(m => (
                <MenuItem key={m.id} value={m.id}
                  sx={{
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                    maxWidth: '100%',
                  }}
                >
                  {m.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" sx={focusedGreenStyles}>
            <InputLabel id="calendarId-label">Calendário (Obrigatório)</InputLabel>
            <Select
              labelId="calendarId-label"
              name="calendarId"
              value={formData.calendarId}
              onChange={handleChange}
              label="Calendário (Obrigatório)"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: isMobile ? 110 : 150,
                    maxWidth: isMobile ? 150 : 150,
                    overflowY: 'auto',
                  },
                },
              }}
            >
              {calendars.map(c => (
                <MenuItem
                  key={c.id}
                  value={c.id}
                  sx={{
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                    maxWidth: '100%',
                  }}
                >
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" sx={focusedGreenStyles}>
            <InputLabel id="turn-label">Turno (Obrigatório)</InputLabel>
            <Select
              labelId="turn-label"
              name="turnId"
              value={formData.turnId}
              onChange={handleChange}
              label="Turno (Obrigatório)"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: isMobile ? 100 : 90,
                    overflowY: 'auto',
                  },
                },
              }}
            >
              {turns.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: isMobile ? 1 : 2,
              gap: isMobile ? 1 : 2,
              flexWrap: isMobile ? 'wrap' : 'nowrap'
            }}
          >
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{
                ...cancelButtonStyle,
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                padding: isMobile ? '6px 12px' : '8px 16px'
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={initialClass && !isFormChanged}
              sx={{
                ...saveButtonStyle,
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                padding: isMobile ? '6px 12px' : '8px 16px'
              }}
            >
              {loading ? <CircularProgress size={24} /> : initialClass ? 'Salvar' : 'Cadastrar'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterClass;