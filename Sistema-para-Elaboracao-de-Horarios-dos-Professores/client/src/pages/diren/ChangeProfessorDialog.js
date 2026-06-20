import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    TextField,
    Autocomplete,
} from '@mui/material';
import api from '../../service/api';
import { getToken } from '../../service/auth';

const ChangeProfessorDialog = ({
    open,
    onClose,
    classId,
    disciplineId,
    disciplineCode,
    disciplineName,
    day,
    startTime,
    setAlert,
    setScheduleData,
    setPendingChanges,
    setConflicts,
    calendarId,
    className,
    checkConflicts,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [professors, setProfessors] = useState([]);
    const [selectedDiscipline, setSelectedDiscipline] = useState(null);
    const [selectedProfessor, setSelectedProfessor] = useState(null);
    const [originalProfessorId, setOriginalProfessorId] = useState(null);

    useEffect(() => {
        const fetchProfessors = async () => {
            try {
                const professorsResponse = await api.get('/users/teachers');
                setProfessors(professorsResponse.data);

                if (disciplineId && disciplineName && disciplineCode) {
                    setSelectedDiscipline({
                        id: disciplineId,
                        name: disciplineName,
                        code: disciplineCode,
                    });
                }

                setScheduleData((prevData) => {
                    const course = prevData.find((c) => c.classes.some((cls) => cls.id === classId));
                    if (course) {
                        const classData = course.classes.find((cls) => cls.id === classId);
                        const disciplineData = classData.disciplines.find(
                            (d) => d.id === disciplineId && d.day === day && d.startTime === startTime
                        );
                        if (disciplineData && disciplineData.professor1?.id) {
                            const professor = professorsResponse.data.find(
                                (p) => p.id === disciplineData.professor1.id
                            );
                            setSelectedProfessor(professor || null);
                            setOriginalProfessorId(disciplineData.professor1.id);
                        }
                    }
                    return prevData;
                });
            } catch (error) {
                setError('Erro ao carregar dados.');
                setAlert({ message: 'Erro ao carregar dados.', type: 'error' });
                console.error('Error fetching professors:', error);
            }
        };

        if (open) {
            fetchProfessors();
        }
    }, [open, disciplineId, disciplineName, disciplineCode, classId, day, startTime, setAlert, setScheduleData]);

    const handleChangeProfessor = async () => {
        if (!selectedDiscipline || !selectedProfessor) {
            setError('Todos os campos devem ser preenchidos.');
            setAlert({ message: 'Todos os campos devem ser preenchidos.', type: 'error' });
            return;
        }

        const isDayPreferred = selectedProfessor.prefsDays?.some((pref) => pref.name === day);
        if (!isDayPreferred) {
            setError(`O professor ${selectedProfessor.name} não tem preferência pelo dia ${day}.`);
            setAlert({
                message: `O professor ${selectedProfessor.name} não tem preferência pelo dia ${day}.`,
                type: 'warning',
            });
        }

        setIsProcessing(true);
        setError('');
        setAlert(null);

        const token = getToken();
        if (!token) {
            setError('Usuário não autenticado.');
            setAlert({ message: 'Usuário não autenticado.', type: 'error' });
            setIsProcessing(false);
            onClose();
            return;
        }

        try {
            setScheduleData((prevData) => {
                const updatedData = prevData.map((course) => ({
                    ...course,
                    classes: course.classes.map((classItem) => {
                        if (classItem.id === classId) {
                            const newDisciplines = classItem.disciplines.map((disc) => {
                                if (disc.id === disciplineId) {
                                    return {
                                        ...disc,
                                        professor1: {
                                            id: selectedProfessor.id,
                                            name: selectedProfessor.name,
                                            initials: selectedProfessor.nameCode || getProfessorInitials(selectedProfessor.name),
                                            nameCode: selectedProfessor.nameCode || getProfessorInitials(selectedProfessor.name),
                                        },
                                        preferences: selectedProfessor.prefsDays?.map((pref) => ({
                                            dayId: pref.id,
                                            name: pref.name,
                                            observation: pref.preferencesDay?.observation || '',
                                        })) || [],
                                        observation: selectedProfessor.prefsDays?.find((pref) => pref.name === disc.day)?.preferencesDay?.observation || '',
                                    };
                                }
                                return disc;
                            });

                            return {
                                ...classItem,
                                disciplines: newDisciplines,
                            };
                        }
                        return classItem;
                    }),
                }));

                const newConflicts = checkConflicts(updatedData);
                setConflicts(newConflicts);
                if (newConflicts.length > 0) {
                    setAlert({ message: 'Conflitos detectados após a troca de professor.', type: 'error' });
                } else {
                    setAlert({ message: 'Professor alterado com sucesso localmente!', type: 'success' });
                }

                return updatedData;
            });

            setPendingChanges((prev) => [
                ...prev,
                {
                    classId,
                    disciplineId: selectedDiscipline.id,
                    professorId: selectedProfessor.id,
                    originalDisciplineId: disciplineId,
                    day,
                    startTime,
                },
            ]);

            onClose();
        } catch (error) {
            const errorMessage = error.message || 'Erro ao trocar professor.';
            setError(errorMessage);
            setAlert({ message: errorMessage, type: 'error' });
            console.error('Error in handleChangeProfessor:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const getProfessorInitials = (name) => {
        if (!name) return 'N/A';
        const parts = name.split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return parts.map((p) => p[0]).join('').toUpperCase();
    };

    const isSwapButtonDisabled =
        isProcessing ||
        !selectedProfessor ||
        selectedProfessor?.id === originalProfessorId;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ color: '#2e7d32', textAlign: 'center', fontWeight: 'bold' }}>
                Trocar Professor
            </DialogTitle>
            <Typography variant="body2" color="textSecondary" align="center" sx={{ px: 1, pb: 0, color: 'red' }}>
                Atenção: A troca de professor irá refletir em todos os dias e horários da < br /> disciplina selecionada nesta turma.
            </Typography>
            <DialogContent>
                {isProcessing ? (
                    <Box sx={{ textAlign: 'center', mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <CircularProgress color="success" sx={{ mb: 2 }} />
                        <Typography variant="body1">Processando...</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Turma"
                            value={className || 'Turma Não Informada'}
                            InputProps={{
                                readOnly: true,
                            }}
                            fullWidth
                            variant="outlined"
                            sx={{ backgroundColor: '#f5f5f5' }}
                        />
                        <TextField
                            label="Disciplina"
                            value={selectedDiscipline ? `${selectedDiscipline.code || ''} - ${selectedDiscipline.name || ''}` : ''}
                            InputProps={{
                                readOnly: true,
                            }}
                            fullWidth
                            variant="outlined"
                            sx={{ backgroundColor: '#f5f5f5' }}
                        />
                        <Autocomplete
                            id="professor-autocomplete"
                            options={professors}
                            getOptionLabel={(option) => option.name || ''}
                            value={selectedProfessor}
                            onChange={(event, newValue) => {
                                setSelectedProfessor(newValue);
                            }}
                            renderOption={(props, option) => (
                                <li {...props}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="body1">{option.name}</Typography>

                                    </Box>
                                </li>
                            )}
                            renderInput={(params) => <TextField {...params} label="Professor" placeholder="Buscar..." />}
                            noOptionsText="Nenhum professor encontrado"
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                        />
                    </Box>
                )}
                {error && (
                    <Typography color="error" align="center" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    disabled={isProcessing}
                    sx={{
                        color: '#d32f2f',
                        borderColor: '#d32f2f',
                        backgroundColor: 'white',
                        '&:hover': {
                            backgroundColor: '#ffebee',
                            borderColor: '#b71c1c',
                        },
                        textTransform: 'none',
                        minWidth: '100px',
                    }}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleChangeProfessor}
                    variant="contained"
                    disabled={isSwapButtonDisabled}
                    sx={{
                        backgroundColor: '#2e7d32',
                        '&:hover': { backgroundColor: '#1b5e20' },
                        textTransform: 'none',
                        minWidth: '100px',
                        ml: 2,
                    }}
                >
                    Trocar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ChangeProfessorDialog;