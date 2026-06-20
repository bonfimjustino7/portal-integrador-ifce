import React, { useEffect, useState, useCallback } from 'react';
import {
    Dialog, DialogContent, DialogTitle,
    FormControl, InputLabel, Select, MenuItem,
    Button, Box, Typography, useMediaQuery, useTheme,
    Checkbox, TextField
} from '@mui/material';
import api from '../../service/api';
import { getToken, getUserId } from '../../service/auth';

const focusedGreenStyles = {
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#2e7d32',
    },
    '& .MuiInputLabel-root.Mui-focused': {
        color: '#2e7d32',
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#2e7d32',
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

const AssociateDiscipline = ({
    open,
    onClose,
    courseId,
    gridCourseId,
    onAssociated,
    setAlert,
}) => {
    const [formData, setFormData] = useState({
        semesterId: '',
        disciplineIds: [],
        type: '',
    });
    const [disciplines, setDisciplines] = useState([]);
    const [filteredDisciplines, setFilteredDisciplines] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const fetchData = async () => {
            const token = getToken();
            if (!token) {
                setAlert({ show: true, message: 'Usuário não autenticado.', type: 'warning' });
                return;
            }

            try {
                const disciplineRes = await api.get(`/disciplines/coordination/${getUserId()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDisciplines(disciplineRes.data);
                setFilteredDisciplines(disciplineRes.data);

                const semesterRes = await api.get(`courses/semesters/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const semesterData = semesterRes.data.map((s, index) => ({
                    id: s.semesterId,
                    name: `${index + 1}`,
                }));
                setSemesters(semesterData);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
                setAlert({ show: true, message: 'Erro ao carregar dados.', type: 'error' });
            }
        };

        if (open) {
            fetchData();
        }
    }, [open, courseId, setAlert]);

    useEffect(() => {
        setFormData({
            semesterId: '',
            disciplineIds: [],
            type: '',
        });
        setSearchQuery('');
        setFilteredDisciplines(disciplines);
    }, [open, disciplines]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSearchChange = useCallback((e) => {
        const query = e.target.value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        setSearchQuery(query);

        const filtered = disciplines.filter((d) =>
            d.name
                ?.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .includes(query)
        );
        setFilteredDisciplines(filtered);
    }, [disciplines]);

    const handleSelectOpen = () => {
        setSearchQuery('');
        setFilteredDisciplines(disciplines);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.semesterId || formData.disciplineIds.length === 0 || !formData.type) {
            setAlert({ show: true, message: 'Preencha todos os campos obrigatórios!', type: 'warning' });
            return;
        }

        try {
            const token = getToken();
            if (!token) throw new Error('Usuário não autenticado');

            const payload = {
                courseId,
                semesterId: parseInt(formData.semesterId, 10),
                disciplines: formData.disciplineIds.map(id => ({
                    disciplineId: parseInt(id, 10),
                    type: formData.type,
                })),
            };

            await api.post(`/course-grid/course/associate/${gridCourseId}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setAlert({ show: true, message: 'Disciplinas associadas com sucesso.', type: 'success' });
            onAssociated && onAssociated();
            onClose();
        } catch (err) {
            setAlert({
                show: true,
                message: err.response?.data?.error || 'Erro ao associar disciplinas.',
                type: 'error',
            });
        }
    };

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
                    maxWidth: isMobile ? '90%' : 500,
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
            <DialogTitle sx={{ textAlign: 'center', p: isMobile ? 1 : 2, mb: isMobile ? 0 : 1 }}>
                <Typography
                    variant={isMobile ? 'h6' : 'h5'}
                    fontWeight="bold"
                    color="#2e7d32"
                >
                    Associar Disciplina
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
                        <InputLabel id="semesterId-label">Semestre (Obrigatório)</InputLabel>
                        <Select
                            labelId="semesterId-label"
                            name="semesterId"
                            value={formData.semesterId}
                            onChange={handleChange}
                            label="Semestre (Obrigatório)"
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: isMobile ? 150 : 145,
                                        overflowY: 'auto',
                                    },
                                },
                            }}
                        >
                            {semesters.map(s => (
                                <MenuItem key={s.id} value={s.id}>
                                    {s.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="dense" sx={focusedGreenStyles}>
                        <InputLabel id="type-label">Tipo (Obrigatório)</InputLabel>
                        <Select
                            labelId="type-label"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            label="Tipo (Obrigatório)"
                        >
                            <MenuItem value="Obrigatória">Obrigatória</MenuItem>
                            <MenuItem value="Optativa">Optativa</MenuItem>
                            <MenuItem value="PEI">PEI</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="dense" sx={focusedGreenStyles}>
                        <InputLabel id="disciplineIds-label">Disciplinas (Obrigatório)</InputLabel>
                        <Select
                            labelId="disciplineIds-label"
                            name="disciplineIds"
                            multiple
                            value={formData.disciplineIds}
                            onChange={handleChange}
                            onOpen={handleSelectOpen}
                            label="Disciplinas (Obrigatório)"
                            renderValue={(selected) =>
                                selected
                                    .map(id => disciplines.find(d => d.id === id)?.name)
                                    .filter(name => name)
                                    .join(', ')
                            }
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: isMobile ? 250 : 250,
                                        maxWidth: isMobile ? 300 : 400,
                                        overflowY: 'auto',
                                    },
                                },
                                autoFocus: false,
                            }}
                        >
                            <Box sx={{ p: 1, position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Buscar disciplina por nome..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    autoFocus
                                    sx={{
                                        ...focusedGreenStyles,
                                        mb: 1,
                                    }}
                                />
                            </Box>
                            {filteredDisciplines.length === 0 ? (
                                <MenuItem disabled>Nenhuma disciplina encontrada</MenuItem>
                            ) : (
                                filteredDisciplines.map(d => (
                                    <MenuItem
                                        key={d.id}
                                        value={d.id}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            whiteSpace: 'normal',
                                            wordWrap: 'break-word',
                                            padding: '8px 16px',
                                        }}
                                    >
                                        <Checkbox
                                            checked={formData.disciplineIds.includes(d.id)}
                                            sx={{
                                                color: '#2e7d32',
                                                '&.Mui-checked': {
                                                    color: '#2e7d32',
                                                },
                                                mr: 1,
                                            }}
                                        />
                                        <Typography sx={{ wordBreak: 'break-word' }}>
                                            {d.name}
                                        </Typography>
                                    </MenuItem>
                                ))
                            )}
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
                            onClick={onClose}
                            variant="outlined"
                            sx={{
                                ...cancelButtonStyle,
                                fontSize: isMobile ? '0.8rem' : '0.875rem',
                                padding: isMobile ? '6px 12px' : '8px 16px',
                            }}
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
                            Associar
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default AssociateDiscipline;