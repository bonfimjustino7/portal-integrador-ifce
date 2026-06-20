import React, { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    Typography,
    Box,
    Dialog,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    useMediaQuery,
    useTheme,
    Checkbox,
    ListItemText,
    OutlinedInput
} from '@mui/material';
import api from '../../service/api';
import { getToken } from '../../service/auth';

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

const RegisterCalendar = ({ open, onClose, refreshCalendars, setAlert, calendarData }) => {
    const [formData, setFormData] = useState({
        academicYear: '',
        typeLearn: [],
        dateStart: '',
        dateEnd: '',
        dateClose: '',
        type: '',
        period: ''
    });
    const [typeLearnOptions, setTypeLearnOptions] = useState([]);
    const [calendarTypeOptions, setCalendarTypeOptions] = useState([]);
    const [isTypeOther, setIsTypeOther] = useState(false);
    const [isFormChanged, setIsFormChanged] = useState(false);
    const isEditMode = Boolean(calendarData && calendarData.id);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const defaultFixedTypeOptions = ['Regular', 'Convencional'];

    useEffect(() => {
        const fetchTypeLearnOptions = async () => {
            try {
                const response = await api.get('/type-learn', {
                    headers: { Authorization: `Bearer ${getToken()}` }
                });
                if (response.status === 200) {
                    setTypeLearnOptions(response.data);
                }
            } catch (error) {
                console.error('Erro ao carregar tipos de ensino:', error);
                setAlert({ show: true, message: 'Erro ao carregar tipos de ensino.', type: 'error' });
            }
        };

        const fetchCalendarTypeOptions = async () => {
            try {
                const response = await api.get('/calendar/type');
                if (response.status === 200) {
                    const uniqueTypes = [...new Set(response.data.map(item => item.type))];
                    const combinedTypes = [...new Set([...defaultFixedTypeOptions, ...uniqueTypes])];
                    setCalendarTypeOptions(combinedTypes);
                }
            } catch (error) {
                console.error('Erro ao carregar tipos de calendário:', error);
                setAlert({ show: true, message: 'Erro ao carregar tipos de calendário.', type: 'error' });
            }
        };

        fetchTypeLearnOptions();
        if (open) {
            fetchCalendarTypeOptions();
        }

    }, [setAlert, open]);

    useEffect(() => {
        if (open) {
            if (isEditMode && typeLearnOptions.length > 0) {
                let parsedTypeLearn = [];
                if (calendarData.typeLearnId) {
                    if (Array.isArray(calendarData.typeLearnId)) {
                        parsedTypeLearn = calendarData.typeLearnId.map(Number).filter(id => typeLearnOptions.some(opt => opt.id === id));
                    } else if (typeof calendarData.typeLearnId === 'string') {
                        parsedTypeLearn = calendarData.typeLearnId
                            .split(',')
                            .map(Number)
                            .filter(id => !isNaN(id) && typeLearnOptions.some(opt => opt.id === id));
                    } else if (typeof calendarData.typeLearnId === 'number') {
                        parsedTypeLearn = typeLearnOptions.some(opt => opt.id === calendarData.typeLearnId)
                            ? [calendarData.typeLearnId]
                            : [];
                    }
                }

                setFormData({
                    academicYear: calendarData.name ? calendarData.name.substring(0, 4) : '',
                    typeLearn: parsedTypeLearn,
                    dateStart: calendarData.startDate ? new Date(calendarData.startDate).toISOString().split('T')[0] : '',
                    dateEnd: calendarData.endDate ? new Date(calendarData.endDate).toISOString().split('T')[0] : '',
                    dateClose: calendarData.closingDate ? new Date(calendarData.closingDate).toISOString().split('T')[0] : '',
                    type: calendarData.type || '',
                    period: calendarData.period || ''
                });

                // Corrected logic for isTypeOther
                const isCustomType = calendarData.type && !calendarTypeOptions.includes(calendarData.type);
                setIsTypeOther(isCustomType);
                setIsFormChanged(false);
            } else {
                setFormData({
                    academicYear: '',
                    typeLearn: [],
                    dateStart: '',
                    dateEnd: '',
                    dateClose: '',
                    type: '',
                    period: ''
                });
                setIsTypeOther(false);
                setIsFormChanged(false);
            }
        }
    }, [open, calendarData, isEditMode, typeLearnOptions, calendarTypeOptions]);

    useEffect(() => {
        if (isEditMode && typeLearnOptions.length > 0) {
            const currentCalendarTypeLearnArray = Array.isArray(calendarData.typeLearnId)
                ? calendarData.typeLearnId.map(Number)
                : typeof calendarData.typeLearnId === 'string'
                    ? calendarData.typeLearnId.split(',').map(Number)
                    : (typeof calendarData.typeLearnId === 'number' ? [calendarData.typeLearnId] : []);

            const hasChanges =
                formData.academicYear !== (calendarData.name ? calendarData.name.substring(0, 4) : '') ||
                JSON.stringify(formData.typeLearn.sort((a, b) => a - b)) !== JSON.stringify(currentCalendarTypeLearnArray.sort((a, b) => a - b)) ||
                formData.dateStart !== (calendarData.startDate ? new Date(calendarData.startDate).toISOString().split('T')[0] : '') ||
                formData.dateEnd !== (calendarData.endDate ? new Date(calendarData.endDate).toISOString().split('T')[0] : '') ||
                formData.dateClose !== (calendarData.closingDate ? new Date(calendarData.closingDate).toISOString().split('T')[0] : '') ||
                formData.type !== (calendarData.type || '') ||
                formData.period !== (calendarData.period || '');
            setIsFormChanged(hasChanges);
        }
    }, [formData, calendarData, isEditMode, typeLearnOptions]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'academicYear') {
            const numericValue = value.replace(/[^0-9]/g, '').slice(0, 4);
            setFormData({ ...formData, [name]: numericValue });
        } else if (name === 'typeLearn') {
            const newTypeLearn = typeof value === 'string' ? value.split(',').map(Number) : value;
            setFormData({ ...formData, [name]: newTypeLearn });
        } else if (name === 'typeSelector') {
            if (value === 'Outro') {
                setIsTypeOther(true);
                setFormData({ ...formData, type: '' });
            } else {
                setIsTypeOther(false);
                setFormData({ ...formData, type: value });
            }
        } else if (name === 'typeInput') {
            setFormData({ ...formData, type: value });
        } else if (name === 'period') {
            setFormData({ ...formData, [name]: value === '' ? '' : parseInt(value, 10) });
        } else {
            setFormData({ ...formData, [name]: value === '' ? null : value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert((prev) => ({ ...prev, show: false }));

        const { academicYear, typeLearn, dateStart, dateEnd, dateClose, type, period } = formData;

        if (!academicYear || typeLearn.length === 0 || !dateStart || !dateEnd || !dateClose || !type || period === '' || period === null) {
            setAlert({ show: true, message: 'Preencha todos os campos obrigatórios.', type: 'warning' });
            return;
        }

        if (!/^\d{4}$/.test(academicYear)) {
            setAlert({ show: true, message: 'O ano acadêmico deve conter exatamente 4 dígitos.', type: 'error' });
            return;
        }

        const currentYear = new Date().getFullYear();
        const maxYear = currentYear + 5;
        const year = parseInt(academicYear, 10);
        if (year < currentYear || year > maxYear) {
            setAlert({ show: true, message: `O ano acadêmico deve estar entre ${currentYear} e ${maxYear}.`, type: 'error' });
            return;
        }

        if (parseInt(period, 10) !== 1 && parseInt(period, 10) !== 2) {
            setAlert({ show: true, message: 'Informe um período válido (1 ou 2).', type: 'error' });
            return;
        }

        const token = getToken();
        if (!token) {
            setAlert({ show: true, message: 'Usuário não autenticado. Faça login novamente.', type: 'error' });
            return;
        }

        const selectedTypeLearnNames = typeLearn
            .map(id => {
                const option = typeLearnOptions.find(opt => opt.id === id);
                return option ? option.name : '';
            })
            .filter(name => name !== '')
            .join('/');

        const payload = {
            academicYear,
            typeLearnsIds: typeLearn,
            dateStart,
            dateEnd,
            dateClose,
            type,
            period: parseInt(period, 10),
            name: `${academicYear}/${period} - ${type} (${selectedTypeLearnNames})`
        };

        try {
            let response;
            if (isEditMode) {
                response = await api.put(`/calendar/${calendarData.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                response = await api.post('/calendar', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (response.status === 201 || response.status === 200) {
                setAlert({
                    show: true,
                    message: isEditMode ? 'Calendário atualizado com sucesso.' : 'Calendário cadastrado com sucesso.',
                    type: 'success'
                });
                if (refreshCalendars) refreshCalendars();
                if (onClose) onClose();
            }
        } catch (error) {
            let errorMessage = 'Erro ao comunicar com o servidor. Tente novamente.';
            if (error.response) {
                errorMessage = error.response.data?.error || `Erro do servidor: ${error.response.status}`;
            } else if (error.request) {
                errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão de internet.';
            }
            setAlert({ show: true, message: errorMessage, type: 'error' });
        }
    };

    const handleCancel = () => {
        if (onClose) onClose();
    };

    const getMinDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getMinEndDate = () => {
        if (formData.dateStart) {
            return formData.dateStart;
        }
        return getMinDate();
    };

    const getMinCloseDate = () => {
        if (formData.dateEnd) {
            const endDate = new Date(formData.dateEnd + 'T00:00:00');
            endDate.setDate(endDate.getDate() + 1);
            const year = endDate.getFullYear();
            const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
            const day = endDate.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return getMinDate();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={isMobile ? 'sm' : 'xs'}
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    width: '100%',
                    maxWidth: isMobile ? '90%' : 450,
                    borderRadius: 4,
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
                },
            }}
        >
            <Box
                sx={{
                    padding: isMobile ? 2 : 3,
                    bgcolor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography
                    variant={isMobile ? 'h6' : 'h5'}
                    gutterBottom
                    sx={{
                        mb: isMobile ? 1 : 2,
                        fontWeight: 'bold',
                        color: '#2e7d32',
                        textAlign: 'center'
                    }}
                >
                    {isEditMode ? 'Editar Calendário' : 'Cadastrar Calendário'}
                </Typography>
                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: isMobile ? 13 : 15,
                        width: '100%',
                        maxWidth: isMobile ? '100%' : 400,
                    }}
                    noValidate
                >
                    <TextField
                        label="Ano Acadêmico (Obrigatório)"
                        name="academicYear"
                        type="text"
                        value={formData.academicYear}
                        onChange={handleChange}
                        fullWidth
                        inputProps={{ maxLength: 4, inputMode: 'numeric', pattern: '[0-9]*' }}
                        sx={{ ...focusedGreenStyles, fontSize: isMobile ? '1rem' : '1rem' }}
                    />

                    <FormControl fullWidth sx={focusedGreenStyles}>
                        <InputLabel id="period-label">Período (Obrigatório)</InputLabel>
                        <Select
                            labelId="period-label"
                            id="period"
                            name="period"
                            value={formData.period}
                            label="Período (Obrigatório)"
                            onChange={handleChange}
                            sx={{ fontSize: isMobile ? '1rem' : '1rem' }}
                        >
                            <MenuItem value={1}>1</MenuItem>
                            <MenuItem value={2}>2</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={focusedGreenStyles}>
                        <InputLabel id="typeLearn-label">Modalidade de Ensino (Obrigatório)</InputLabel>
                        <Select
                            labelId="typeLearn-label"
                            id="typeLearn"
                            name="typeLearn"
                            multiple
                            value={formData.typeLearn}
                            onChange={handleChange}
                            input={<OutlinedInput label="Modalidade de Ensino (Obrigatório)" />}
                            renderValue={(selectedIds) => {
                                return selectedIds
                                    .map(id => {
                                        const option = typeLearnOptions.find(opt => opt.id === id);
                                        return option ? option.name : '';
                                    })
                                    .filter(name => name !== '')
                                    .join('/');
                            }}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: isMobile ? 220 : 290,
                                        overflowY: 'auto',
                                    },
                                },
                            }}
                            sx={{ fontSize: isMobile ? '1rem' : '1rem' }}
                        >
                            {typeLearnOptions.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                    <Checkbox checked={formData.typeLearn.includes(option.id)} color="success" />
                                    <ListItemText primary={option.name} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {isTypeOther ? (
                        <TextField
                            label="Tipo (Obrigatório)"
                            name="typeInput"
                            type="text"
                            value={formData.type}
                            onChange={handleChange}
                            fullWidth
                            sx={{ ...focusedGreenStyles, fontSize: isMobile ? '1rem' : '1rem' }}
                        />
                    ) : (
                        <FormControl fullWidth sx={focusedGreenStyles}>
                            <InputLabel id="type-label">Tipo (Obrigatório)</InputLabel>
                            <Select
                                labelId="type-label"
                                id="type"
                                name="typeSelector"
                                value={formData.type || ''}
                                label="Tipo (Obrigatório)"
                                onChange={handleChange}
                                sx={{ fontSize: isMobile ? '1rem' : '1rem' }}
                                MenuProps={{
                                    PaperProps: {
                                        style: {
                                            maxHeight: isMobile ? 200 : 190,
                                            overflowY: 'auto',
                                        },
                                    },
                                }}
                            >
                                {calendarTypeOptions.map((typeOption) => (
                                    <MenuItem key={typeOption} value={typeOption}>
                                        {typeOption}
                                    </MenuItem>
                                ))}

                                <MenuItem value="Outro">Outro</MenuItem>
                            </Select>
                        </FormControl>
                    )}

                    <TextField
                        label="Data de Início (Obrigatório)"
                        name="dateStart"
                        type="date"
                        value={formData.dateStart}
                        onChange={handleChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: getMinDate() }}
                        sx={{ ...focusedGreenStyles, fontSize: isMobile ? '1rem' : '1rem' }}
                    />
                    <TextField
                        label="Data de Término (Obrigatório)"
                        name="dateEnd"
                        type="date"
                        value={formData.dateEnd}
                        onChange={handleChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: getMinEndDate() }}
                        sx={{ ...focusedGreenStyles, fontSize: isMobile ? '1rem' : '1rem' }}
                    />
                    <TextField
                        label="Data de Fechamento (Obrigatório)"
                        name="dateClose"
                        type="date"
                        value={formData.dateClose}
                        onChange={handleChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: getMinCloseDate() }}
                        sx={{ ...focusedGreenStyles, fontSize: isMobile ? '1rem' : '1rem' }}
                    />

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: isMobile ? 1 : 2,
                            mt: isMobile ? 1 : 2,
                            flexWrap: isMobile ? 'wrap' : 'nowrap'
                        }}
                    >
                        <Button
                            variant="outlined"
                            sx={{
                                ...cancelButtonStyle,
                                fontSize: isMobile ? '0.8rem' : '0.875rem',
                                padding: isMobile ? '6px 12px' : '8px 16px'
                            }}
                            onClick={handleCancel}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isEditMode && !isFormChanged}
                            sx={{
                                ...saveButtonStyle,
                                fontSize: isMobile ? '0.8rem' : '0.875rem',
                                padding: isMobile ? '6px 12px' : '8px 16px'
                            }}
                        >
                            {isEditMode ? 'Salvar' : 'Cadastrar'}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Dialog>
    );
};

export default RegisterCalendar;