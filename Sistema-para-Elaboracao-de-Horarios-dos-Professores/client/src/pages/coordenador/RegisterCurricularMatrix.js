import React, { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    Box,
    Typography,
    useTheme,
    useMediaQuery,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
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

const RegisterCurricularMatrix = ({
    open,
    onClose,
    coordinatorId,
    onCreated,
    setAlert,
    matrixData,
}) => {
    const [formData, setFormData] = useState({
        courseId: '',
        year: '',
        type: '',
    });
    const [initialFormData, setInitialFormData] = useState(null);
    const [isFormChanged, setIsFormChanged] = useState(false);
    const [courses, setCourses] = useState([]);
    const [coordinatorCourse, setCoordinatorCourse] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [yearError, setYearError] = useState('');

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const fetchData = async () => {
            const token = getToken();
            if (!token) {
                setAlert({ show: true, message: 'Usuário não autenticado.', type: 'error' });
                return;
            }

            try {
                const decoded = jwtDecode(token);
                setUserRole(decoded.role);

                let courseData = [];
                let fetchedCoordinatorCourse = null;

                if (decoded.role === 'Coordenador') {
                    const courseRes = await api.get(`/courses/coordinator/${coordinatorId}`, {
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
                setCoordinatorCourse(fetchedCoordinatorCourse);

                const initialData = matrixData
                    ? {
                        courseId: matrixData.courseId || (fetchedCoordinatorCourse ? fetchedCoordinatorCourse.id : ''),
                        year: matrixData.year || '',
                        type: matrixData.type || '',
                    }
                    : {
                        courseId: fetchedCoordinatorCourse ? fetchedCoordinatorCourse.id : '',
                        year: '',
                        type: '',
                    };
                setFormData(initialData);
                setInitialFormData(initialData);
            } catch (err) {
                setAlert({
                    show: true,
                    message: err.response?.data?.error || 'Erro ao carregar dados do curso.',
                    type: 'error',
                });
            }
        };

        if (open && coordinatorId) {
            fetchData();
        }
    }, [open, coordinatorId, setAlert, matrixData]);

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

    const validateYear = (year) => {
        const yearRegex = /^\d{4}$|^\d{4}\.\d$/;
        return yearRegex.test(year);
    };

    const isSaveButtonEnabled = () => {
        return formData.year.trim() !== '' && validateYear(formData.year) && formData.courseId !== '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        if (name === 'year' && value && !validateYear(value)) {
            setYearError('O ano deve ser no formato 2025 ou 2025.1');
        } else {
            setYearError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert({ show: false });

        if (!formData.year || !formData.courseId) {
            setAlert({ show: true, message: 'Preencha todos os campos obrigatórios.', type: 'warning' });
            return;
        }

        if (!validateYear(formData.year)) {
            setAlert({ show: true, message: 'O ano deve ser no formato 2025 ou 2025.1', type: 'warning' });
            return;
        }

        try {
            const token = getToken();
            if (!token) throw new Error('Usuário não autenticado');

            const payload = {
                year: formData.year,
                type: formData.type || null,
                courseId: parseInt(formData.courseId, 10),
                coordinatorId,
            };

            if (matrixData && matrixData.id) {
                await api.put(`/course-grid/${matrixData.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAlert({ show: true, message: 'Matriz curricular atualizada com sucesso.', type: 'success' });
            } else {
                await api.post(`/course-grid/${formData.courseId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAlert({ show: true, message: 'Matriz curricular cadastrada com sucesso.', type: 'success' });
            }

            onCreated?.();
            setFormData({ courseId: coordinatorCourse ? coordinatorCourse.id : '', year: '', type: '' });
            setInitialFormData(null);
            setIsFormChanged(false);
            setYearError('');
            onClose();
        } catch (err) {
            setAlert({
                show: true,
                message: err.response?.data?.error || `Erro ao ${matrixData ? 'atualizar' : 'cadastrar'} matriz curricular.`,
                type: 'error',
            });
        }
    };

    const handleCancel = () => {
        setYearError('');
        onClose();
    };

    const isCourseDisabled = userRole === 'Coordenador' && coordinatorCourse !== null;

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
                sx={{ fontWeight: 'bold', color: '#2e7d32', mb: isMobile ? 3 : 3, textAlign: 'center', fontSize: isMobile ? '18px' : '22px' }}
            >
                {matrixData ? 'Editar Matriz Curricular' : 'Cadastrar Matriz Curricular'}
            </Typography>
            <form
                onSubmit={handleSubmit}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? 15 : 20,
                    width: '350px',
                    maxWidth: '100%',
                    margin: '0 auto',
                }}
                noValidate
            >
                <FormControl fullWidth sx={focusedGreenStyles}>
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
                <TextField
                    label="Ano (Obrigatório)"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    fullWidth
                    sx={focusedGreenStyles}
                    error={!!yearError}
                    helperText={yearError}
                />
                <TextField
                    label="Tipo (Opcional)"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    fullWidth
                    sx={focusedGreenStyles}
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
                        disabled={!isSaveButtonEnabled() || !isFormChanged}
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
                        {matrixData ? 'Salvar' : 'Cadastrar'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default RegisterCurricularMatrix;