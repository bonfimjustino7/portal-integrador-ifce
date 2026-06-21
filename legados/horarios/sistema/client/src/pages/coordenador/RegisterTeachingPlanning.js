import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography, Box, Grid, Card, CardContent, TextField, Divider, Button, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
    MenuItem, Select, FormControl, InputLabel, useTheme, useMediaQuery, Autocomplete, Checkbox, CircularProgress, Stack
} from '@mui/material';
import { AddCircleOutline, DeleteOutline, Add, RemoveCircleOutline } from '@mui/icons-material';
import api from '../../service/api';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserId } from '../../service/auth';
import AlertMessage from '../../components/AlertMessage';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ObservationsTeacherDialog from './ObservationsTeacherDialog';
import { v4 as uuidv4 } from 'uuid';

const RegisterTeachingPlanning = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const { classIdToEdit } = useParams();
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [selectedObservation, setSelectedObservation] = useState('');
    const [selectedProfessorName, setSelectedProfessorName] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [removingProfessor, setRemovingProfessor] = useState(false);

    const [formData, setFormData] = useState({
        academicYear: new Date().getFullYear().toString(),
        period: '',
        course: { id: '', name: '' },
        classId: classIdToEdit || '',
        turno: '',
        subjects: [{ id: 1, subjectId: '', professorIds: [''] }],
        professorSchedules: {}
    });
    const [availableData, setAvailableData] = useState({
        professors: [],
        daysOfWeek: [],
        courseData: null,
        classOptions: [],
        turnos: [],
        filteredDisciplines: []
    });
    const [status, setStatus] = useState({ loading: false, error: null });
    const [alert, setAlert] = useState({ open: false, message: '', severity: '' });
    const [selectedSemester, setSelectedSemester] = useState('');

    const greenBorderSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '&.Mui-focused fieldset': { borderColor: '#2e7d32' },
            height: '45px',
            padding: '0 8px',
        },
        '& .MuiInputBase-input': {
            padding: '8px',
            fontSize: '1rem',
        },
        '& .MuiInputLabel-root': {
            fontSize: '1rem',
            transform: 'translate(14px, 10px) scale(1)',
            '&.Mui-focused, &.MuiFormLabel-filled': {
                transform: 'translate(14px, -6px) scale(0.75)',
            },
        },
        '& .MuiInputLabel-root.Mui-focused': { color: '#2e7d32' },
    };

    const menuProps = { PaperProps: { style: { maxHeight: 200, overflowY: 'auto' } } };

    const handleCloseAlert = () => {
        setAlert({ open: false, message: '', severity: '' });
    };

    const handleOpenDialog = (observation, professorName) => {
        setSelectedObservation(observation);
        setSelectedProfessorName(professorName);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    const formatObservations = (prefsDays) => {
        if (!prefsDays || prefsDays.length === 0) {
            return { observation: '', hasObservation: false };
        }
        const firstValidDay = prefsDays.find(day => day.preferencesDay?.observation);
        return {
            observation: firstValidDay ? firstValidDay.preferencesDay.observation : '',
            hasObservation: !!firstValidDay
        };
    };

    const fetchInitialData = useCallback(async () => {
        setStatus({ loading: true, error: null });
        try {
            let [teachers, days, course, turns] = await Promise.all([
                api.get('/users/teachers'),
                api.get('/daysOfWeek'),
                api.get(`/courses/coordinator/wot-planning/${getUserId()}`),
                api.get('/turns')
            ]);

            if (classIdToEdit) {
                course = await api.get(`/courses/coordinator/${getUserId()}`);
                setAvailableData({
                    professors: teachers.data.map(prof => ({
                        id: prof.id,
                        name: prof.name,
                        prefsDays: prof.prefsDays || []
                    })),
                    daysOfWeek: days.data.map(day => ({ id: day.id, name: day.name })),
                    courseData: course.data,
                    classOptions: course.data.classes.map(cls => ({ id: cls.id, name: cls.code, turnId: cls.turnId, semester: cls.semester })),
                    turnos: turns.data.map(turn => ({ id: turn.id, name: turn.name })),
                    filteredDisciplines: []
                });
            } else {
                if (course.data == null) {
                    course = await api.get(`/courses/coordinator/${getUserId()}`);
                    setAvailableData({
                        professors: teachers.data.map(prof => ({
                            id: prof.id,
                            name: prof.name,
                            prefsDays: prof.prefsDays || []
                        })),
                        daysOfWeek: days.data.map(day => ({ id: day.id, name: day.name })),
                        courseData: course.data,
                        classOptions: [],
                        turnos: turns.data.map(turn => ({ id: turn.id, name: turn.name })),
                        filteredDisciplines: []
                    });
                } else {
                    setAvailableData({
                        professors: teachers.data.map(prof => ({
                            id: prof.id,
                            name: prof.name,
                            prefsDays: prof.prefsDays || []
                        })),
                        daysOfWeek: days.data.map(day => ({ id: day.id, name: day.name })),
                        courseData: course.data,
                        classOptions: course.data.classes.map(cls => ({ id: cls.id, name: cls.code, turnId: cls.turnId, semester: cls.semester })),
                        turnos: turns.data.map(turn => ({ id: turn.id, name: turn.name })),
                        filteredDisciplines: []
                    });
                }
            }
            setFormData(prev => ({
                ...prev,
                course: { id: course.data.id, name: course.data.name },
                classId: classIdToEdit ? classIdToEdit : prev.classId
            }));
            if (classIdToEdit) {
                setIsEditingMode(false);
            } else {
                setIsEditingMode(true);
            }
        } catch (error) {
            setStatus({ loading: false, error: 'Erro ao carregar dados iniciais.' });
            setAlert({ open: true, message: error, severity: 'error' });
        } finally {
            setStatus(prev => ({ ...prev, loading: false }));
        }
    }, [classIdToEdit]);

    const fetchPlanningData = useCallback(async () => {
        if (!classIdToEdit || !formData.classId) return;
        setStatus({ loading: true, error: null });
        try {
            const { data } = await api.get(`/coordination/class/${formData.classId}`);
            const subjects = data.subjects?.length > 0
                ? data.subjects.map((sub, index) => ({
                    id: index + 1,
                    subjectId: sub.subjectId || '',
                    professorIds: sub.professorIds?.length > 0 ? sub.professorIds : ['']
                }))
                : [{ id: 1, subjectId: '', professorIds: [''] }];

            const professorSchedules = data.professorPreferences?.reduce((acc, pref) => {
                const daysSchedule = availableData.daysOfWeek.reduce((sched, day) => ({
                    ...sched,
                    [day.name]: pref.prefDays.some(pd => pd.id === day.id)
                }), {});
                acc[pref.professorId] = daysSchedule;
                return acc;
            }, {}) || {};

            setFormData(prev => ({
                ...prev,
                academicYear: data.academicYear?.toString() || prev.academicYear,
                period: data.period || '',
                course: data.course || prev.course,
                classId: data.classId || prev.classId,
                turno: data.turnId || '',
                subjects,
                professorSchedules
            }));
        } catch (error) {
            console.error('Erro ao carregar planejamento:', error);
            if (error.response?.status === 404) {
                setFormData(prev => ({
                    ...prev,
                    subjects: [{ id: 1, subjectId: '', professorIds: [''] }],
                    professorSchedules: {}
                }));
            } else {
                setStatus({ loading: false, error: 'Erro ao carregar planejamento.' });
                setAlert({ open: true, message: 'Erro ao carregar planejamento.', severity: 'error' });
            }
        } finally {
            setStatus(prev => ({ ...prev, loading: false }));
        }
    }, [classIdToEdit, formData.classId, availableData.daysOfWeek]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        if (classIdToEdit && availableData.daysOfWeek.length > 0 && formData.classId) {
            fetchPlanningData();
        }
    }, [fetchPlanningData, availableData.daysOfWeek, classIdToEdit, formData.classId]);

    const updateFilteredDisciplines = useCallback(() => {
        if (formData.classId && availableData.courseData) {
            const selectedClass = availableData.classOptions.find(cls => cls.id === formData.classId);
            if (selectedClass) {
                setSelectedSemester(selectedClass.semester);
                const semesterData = availableData.courseData.semesters.find(sem => sem.number === selectedClass.semester);
                const disciplines = semesterData
                    ? semesterData.disciplines.map(dis => ({ id: dis.id, name: dis.name }))
                    : [];
                setAvailableData(prev => ({
                    ...prev,
                    filteredDisciplines: [...disciplines, { id: 'other', name: 'Outra Disciplina - Lista Completa' }]
                }));
                setFormData(prev => ({ ...prev, turno: selectedClass.turnId }));
                const calendarData = availableData.courseData.classes.find(cls => cls.id === formData.classId)?.calendar;
                if (calendarData) {
                    const [year, period] = calendarData.name.trim().split('-')[0].split('.');
                    setFormData(prev => ({ ...prev, academicYear: year, period: period?.trim() }));
                }
            } else {
                setAvailableData(prev => ({ ...prev, filteredDisciplines: [] }));
                setFormData(prev => ({ ...prev, turno: '' }));
                setSelectedSemester('');
            }
        }
    }, [formData.classId, availableData.courseData, availableData.classOptions]);

    useEffect(() => {
        updateFilteredDisciplines();
    }, [updateFilteredDisciplines]);

    const updateProfessorSchedules = useCallback(() => {
        const uniqueProfessorIds = Array.from(new Set(formData.subjects.flatMap(s => s.professorIds).filter(Boolean)));
        setFormData(prev => ({
            ...prev,
            professorSchedules: uniqueProfessorIds.reduce((acc, profId) => {
                acc[profId] = prev.professorSchedules[profId] ||
                    availableData.daysOfWeek.reduce((sched, day) => ({
                        ...sched,
                        [day.name]: false
                    }), {});
                return acc;
            }, {})
        }));
    }, [formData.subjects, availableData.daysOfWeek]);

    useEffect(() => {
        updateProfessorSchedules();
    }, [updateProfessorSchedules]);

    const handleAddSubjectRow = () => {
        if (!isEditingMode) return;
        setFormData(prev => ({
            ...prev,
            subjects: [...prev.subjects, { id: uuidv4(), subjectId: '', professorIds: [''] }]
        }));
    };

    const handleRemoveSubjectRow = (id) => {
        if (!isEditingMode) return;
        setFormData(prev => ({ ...prev, subjects: prev.subjects.filter(subject => subject.id !== id) }));
    };

    const handleAddProfessorField = (subjectId) => {
        if (!isEditingMode) return;
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.map(subject =>
                subject.id === subjectId ? { ...subject, professorIds: [...subject.professorIds, ''] } : subject
            )
        }));
    };

    const handleRemoveProfessorField = async (subjectId, professorIndex) => {
        if (!isEditingMode) return;

        const subject = formData.subjects.find(s => s.id === subjectId);
        if (!subject) {
            setAlert({
                open: true,
                message: 'Disciplina não encontrada.',
                severity: 'error',
            });
            return;
        }

        const professorId = subject.professorIds[professorIndex];
        const previousFormData = JSON.parse(JSON.stringify(formData));

        setFormData(prev => {
            const updatedSubjects = prev.subjects.map(subject =>
                subject.id === subjectId
                    ? { ...subject, professorIds: subject.professorIds.filter((_, index) => index !== professorIndex) }
                    : subject
            );
            const uniqueProfessorIds = Array.from(new Set(updatedSubjects.flatMap(s => s.professorIds).filter(Boolean)));
            const updatedProfessorSchedules = { ...prev.professorSchedules };
            if (professorId && !uniqueProfessorIds.includes(professorId)) {
                delete updatedProfessorSchedules[professorId];
            }
            return { ...prev, subjects: updatedSubjects, professorSchedules: updatedProfessorSchedules };
        });

        if (professorId && subject.subjectId && classIdToEdit) {
            setRemovingProfessor(true);
            try {
                await api.delete(`/users/${professorId}/${subject.subjectId}/preferences`);

                const uniqueProfessorIds = Array.from(
                    new Set(formData.subjects.flatMap(s => s.professorIds).filter(Boolean))
                );
                const updatedSchedules = { ...formData.professorSchedules };
                for (const profId of uniqueProfessorIds) {
                    try {
                        const response = await api.get(`/users/${profId}/preferences`);
                        const { prefsDays } = response.data.user;
                        updatedSchedules[profId] = availableData.daysOfWeek.reduce((acc, day) => ({
                            ...acc,
                            [day.name]: prefsDays.some(pd => pd.id === day.id)
                        }), {});
                    } catch (error) {
                        console.error(`Erro ao buscar preferências do professor ${profId}:`, error);
                        updatedSchedules[profId] = availableData.daysOfWeek.reduce((acc, day) => ({
                            ...acc,
                            [day.name]: false
                        }), {});
                    }
                }

                setFormData(prev => ({
                    ...prev,
                    professorSchedules: updatedSchedules
                }));

                setAlert({
                    open: true,
                    message: 'Professor removido da disciplina com sucesso.',
                    severity: 'success',
                });
            } catch (error) {
                setFormData(previousFormData);
                console.error('Erro ao remover professor da disciplina:', error);
                setAlert({
                    open: true,
                    message: 'Erro ao remover professor da disciplina.',
                    severity: 'error',
                });
            } finally {
                setRemovingProfessor(false);
            }
        }
    };

    const handleProfessorChange = async (subjectId, professorIndex, value) => {
        if (!isEditingMode) return;
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.map(subject =>
                subject.id === subjectId
                    ? { ...subject, professorIds: subject.professorIds.map((profId, index) => index === professorIndex ? value : profId) }
                    : subject
            )
        }));

        if (value) {
            try {
                const response = await api.get(`/users/${value}/preferences`);
                const { prefsDays } = response.data.user;
                const daysSchedule = availableData.daysOfWeek.reduce((acc, day) => ({
                    ...acc,
                    [day.name]: prefsDays.some(pd => pd.id === day.id)
                }), {});
                setFormData(prev => ({
                    ...prev,
                    professorSchedules: {
                        ...prev.professorSchedules,
                        [value]: daysSchedule
                    }
                }));
                setAvailableData(prev => ({
                    ...prev,
                    professors: prev.professors.map(prof =>
                        prof.id === value ? { ...prof, prefsDays: response.data.user.prefsDays || [] } : prof
                    )
                }));
            } catch (error) {
                console.error('Erro ao buscar preferências do professor:', error);
                setAlert({ open: true, message: 'Erro ao carregar preferências do professor.', severity: 'error' });
                setFormData(prev => ({
                    ...prev,
                    professorSchedules: {
                        ...prev.professorSchedules,
                        [value]: availableData.daysOfWeek.reduce((acc, day) => ({
                            ...acc,
                            [day.name]: false
                        }), {})
                    }
                }));
            }
        }
    };

    const handleSubjectChange = (id, value) => {
        if (!isEditingMode) return;
        setFormData(prev => {
            const newSubjects = prev.subjects.map(subject => {
                if (subject.id === id) {
                    return { ...subject, subjectId: value };
                }
                return subject;
            });
            return { ...prev, subjects: newSubjects };
        });

        if (value === 'other') {
            setFormData(prev => ({
                ...prev,
                subjects: prev.subjects.map(subject =>
                    subject.id === id ? { ...subject, subjectId: '' } : subject
                )
            }));
            const allDisciplines = availableData.courseData?.semesters.flatMap(sem =>
                sem.disciplines.map(dis => ({ id: dis.id, name: dis.name }))
            ) || [];
            setAvailableData(prevData => ({ ...prevData, filteredDisciplines: allDisciplines }));
        } else if (selectedSemester) {
            const semesterData = availableData.courseData?.semesters.find(sem => sem.number === selectedSemester);
            const disciplines = semesterData
                ? semesterData.disciplines.map(dis => ({ id: dis.id, name: dis.name }))
                : [];
            setAvailableData(prevData => ({
                ...prevData,
                filteredDisciplines: [...disciplines, { id: 'other', name: 'Outra Disciplina - Lista Completa' }]
            }));
        }
    };

    const handleScheduleChange = (professorId, day, isChecked) => {
        if (!isEditingMode) return;

        const professor = availableData.professors.find(prof => prof.id === professorId);

        if (professor?.prefsDays?.length > 0) {
            setAlert({
                open: true,
                message: `As preferências de ${professor.name} já estão definidas e não podem ser alteradas.`,
                severity: 'warning',
            });
            return;
        }

        setFormData(prev => ({
            ...prev,
            professorSchedules: {
                ...prev.professorSchedules,
                [professorId]: {
                    ...prev.professorSchedules[professorId],
                    [day]: isChecked,
                },
            },
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!isEditingMode) {
            setIsEditingMode(true);
            return;
        }

        if (!formData.classId) {
            setAlert({
                open: true,
                message: 'O campo turma é obrigatório.',
                severity: 'error'
            });
            return;
        }

        const hasInvalidSubjects = formData.subjects.some(subject =>
            !subject.subjectId || subject.subjectId === 'other' || subject.professorIds.every(profId => !profId)
        );

        if (hasInvalidSubjects) {
            setAlert({
                open: true,
                message: 'Selecione uma disciplina e um professor.',
                severity: 'error'
            });
            return;
        }

        const uniqueProfessorIds = Array.from(
            new Set(formData.subjects.flatMap(s => s.professorIds).filter(Boolean))
        );

        for (const profId of uniqueProfessorIds) {
            const selectedDaysCount = Object.values(formData.professorSchedules[profId] || {})
                .filter(isChecked => isChecked).length;
            if (selectedDaysCount < 1) {
                const professorName = availableData.professors.find(p => p.id === profId)?.name || 'Professor';
                setAlert({
                    open: true,
                    message: `O professor ${professorName} deve ter pelo menos um dia selecionado.`,
                    severity: 'error'
                });
                return;
            }
        }

        try {
            for (const professorId of uniqueProfessorIds) {
                const prefDisciplines = formData.subjects
                    .filter(subject => subject.professorIds.includes(professorId) && subject.subjectId && subject.subjectId !== 'other')
                    .map(subject => subject.subjectId);

                const prefDays = availableData.daysOfWeek
                    .filter(day => formData.professorSchedules[professorId]?.[day.name])
                    .map(day => day.id);

                const firstPayload = {
                    prefDisciplines,
                    prefDays
                };

                await api.post(`users/${professorId}/preferences`, firstPayload);
            }

            await api.post(`coordination/${formData.classId}`);

            if (classIdToEdit) {
                for (const professorId of uniqueProfessorIds) {
                    const prefDisciplines = formData.subjects
                        .filter(subject => subject.professorIds.includes(professorId) && subject.subjectId && subject.subjectId !== 'other')
                        .map(subject => subject.subjectId);

                    const prefDays = availableData.daysOfWeek
                        .filter(day => formData.professorSchedules[professorId]?.[day.name])
                        .map(day => day.id);

                    const firstPayload = {
                        prefDisciplines,
                        prefDays,
                    };

                    await api.post(`users/${professorId}/preferences`, firstPayload);
                }
            }

            setAlert({
                open: true,
                message: 'Planejamento salvo com sucesso.',
                severity: 'success'
            });

            if (classIdToEdit) {
                setIsEditingMode(false);
            }

            setTimeout(() => {
                navigate(-1);
            }, 2000);
        } catch (error) {
            console.error('Erro ao salvar planejamento:', error);
            setAlert({ open: true, message: 'Erro ao salvar o planejamento.', severity: 'error' });
        }
    };

    const handleCancel = () => {
        if (isEditingMode && classIdToEdit) {
            setIsEditingMode(false);
            return;
        }
        setFormData({
            academicYear: new Date().getFullYear().toString(),
            period: '',
            course: { id: '', name: '' },
            classId: '',
            turno: '',
            subjects: [{ id: 1, subjectId: '', professorIds: [''] }],
            professorSchedules: {}
        });
        setAvailableData(prev => ({ ...prev, filteredDisciplines: [] }));
        setSelectedSemester('');
        navigate(-1);
    };

    const SubjectSelect = ({ subject }) => {
        const selectedSubjectIds = formData.subjects
            .filter(s => s.id !== subject.id)
            .map(s => s.subjectId)
            .filter(id => id && id !== 'other');

        const allDisciplines = availableData.courseData?.semesters.flatMap(sem =>
            sem.disciplines.map(dis => ({ id: dis.id, name: dis.name }))
        ) || [];

        const options = [...availableData.filteredDisciplines].sort((a, b) => {
            if (a.id === 'other') return 1;
            if (b.id === 'other') return -1;
            return a.name.localeCompare(b.name);
        });

        if (subject.subjectId && subject.subjectId !== 'other' && !options.some(opt => opt.id === subject.subjectId)) {
            const currentSubject = allDisciplines.find(dis => dis.id === subject.subjectId);
            if (currentSubject) {
                options.splice(options.length - 1, 0, currentSubject);
            }
        }

        const filteredOptions = options.filter(sub =>
            !selectedSubjectIds.includes(sub.id) || sub.id === subject.subjectId || sub.id === 'other'
        );

        return (
            <Autocomplete
                fullWidth
                disablePortal
                options={filteredOptions}
                getOptionLabel={option => option.name || ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={
                    subject.subjectId === 'other'
                        ? null
                        : allDisciplines.find(dis => dis.id === subject.subjectId) || null
                }
                onChange={(event, newValue) => {
                    if (newValue && newValue.id === 'other') {
                        handleSubjectChange(subject.id, 'other');
                    } else if (newValue) {
                        handleSubjectChange(subject.id, newValue.id);
                    } else {
                        handleSubjectChange(subject.id, '');
                    }
                }}
                noOptionsText="Disciplina não encontrada."
                renderOption={(props, option, { index }) => (
                    <>
                        {index === filteredOptions.length - 1 && option.id === 'other' && (
                            <Divider sx={{ my: 1, borderColor: '#e0e0e0' }} />
                        )}
                        <Box
                            component="li"
                            {...props}
                            sx={{
                                color: option.id === 'other' ? '#000000' : 'inherit',
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                fontWeight: option.id === 'other' ? 'bold' : 'normal',
                                '&:hover': {
                                    backgroundColor: option.id === 'other' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                                },
                            }}
                        >
                            {option.id === 'other' ? (
                                <span>
                                    Outra Disciplina - <em>Lista Completa</em>
                                </span>
                            ) : (
                                option.name
                            )}
                        </Box>
                    </>
                )}
                renderInput={params => (
                    <TextField
                        {...params}
                        label="Disciplina"
                        variant="outlined"
                        size="small"
                        placeholder="Buscar..."
                        sx={{
                            ...greenBorderSx,
                            width: { xs: '290px', sm: '100%' },
                            '& .MuiInputBase-input': { whiteSpace: 'normal', overflowWrap: 'break-word' }
                        }}
                        disabled={!isEditingMode}
                    />
                )}
                ListboxProps={{ style: { maxHeight: 250, overflowY: 'auto' } }}
            />
        );
    };

    const ProfessorSelect = ({ subject, professorId, index }) => {
        const selectedProfessorIds = subject.professorIds.filter((id, i) => i !== index && id);
        const filteredProfessors = availableData.professors.filter(
            prof => !selectedProfessorIds.includes(prof.id) || prof.id === professorId
        );

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Autocomplete
                    fullWidth
                    disablePortal
                    disabled={!subject.subjectId || !isEditingMode}
                    options={filteredProfessors}
                    getOptionLabel={option => option.name || ''}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={availableData.professors.find(prof => prof.id === professorId) || null}
                    onChange={(event, newValue) => handleProfessorChange(subject.id, index, newValue ? newValue.id : '')}
                    noOptionsText="Professor não encontrado."
                    renderInput={params => (
                        <TextField
                            {...params}
                            label={`Professor ${index + 1}`}
                            variant="outlined"
                            size="small"
                            placeholder="Buscar..."
                            sx={{
                                ...greenBorderSx,
                                width: { xs: '250px', sm: '100%' },
                                '& .MuiInputBase-input': { whiteSpace: 'normal', overflowWrap: 'break-word' }
                            }}
                        />
                    )}
                    ListboxProps={{ style: { maxHeight: 250, overflowY: 'auto' } }}
                />
                <Box sx={{ width: '40px' }}>
                    {subject.professorIds.length > 1 && (
                        <IconButton
                            color="error"
                            onClick={() => handleRemoveProfessorField(subject.id, index)}
                            aria-label={`remover professor ${index + 1}`}
                            disabled={!subject.subjectId || !isEditingMode || removingProfessor}
                        >
                            {removingProfessor ? <CircularProgress size={24} /> : <RemoveCircleOutline />}
                        </IconButton>
                    )}
                </Box>
            </Box>
        );
    };

    if (status.loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ mx: { xs: 2, sm: 4 }, mt: { xs: 4, sm: 1 }, mb: 4 }}>
            {alert.open && (
                <AlertMessage
                    message={alert.message}
                    type={alert.severity}
                    onClose={handleCloseAlert}
                />
            )}
            {status.error && !alert.open && (
                <AlertMessage
                    message={status.error}
                    type="error"
                    onClose={handleCloseAlert}
                />
            )}
            <Typography
                variant={isMobile ? "body1" : "h5"}
                gutterBottom
                align="center"
                sx={{ fontWeight: 'bold', mt: { xs: 5, sm: 0 }, mb: { xs: 3, sm: 5 }, color: '#333' }}
            >
                {classIdToEdit ? 'Detalhes do Planejamento Docente' : 'Cadastro de Planejamento Docente'}
            </Typography>

            <Card raised sx={{ borderRadius: '12px', boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)', width: '100%', mx: 'auto' }}>
                <CardContent>
                    <Typography
                        variant={isMobile ? "body1" : "h6"}
                        gutterBottom
                        sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 2 }}
                    >
                        Informações Gerais do Planejamento
                    </Typography>
                    <Grid
                        container
                        spacing={isMobile ? 1 : 3}
                        alignItems="center"
                        sx={{ flexWrap: isMobile ? 'wrap' : 'nowrap' }}
                        justifyContent="space-between"
                    >
                        <Grid
                            item
                            xs={12}
                            sm="auto"
                            sx={{ minWidth: isMobile ? '100%' : 80 }}
                        >
                            {isMobile ? (
                                <Box>
                                    <Typography variant="caption" display="block" sx={{ color: '#555' }}>
                                        Ano
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        value={formData.academicYear}
                                        disabled
                                        sx={{ ...greenBorderSx }}
                                    />
                                </Box>
                            ) : (
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label="Ano"
                                    value={formData.academicYear}
                                    disabled
                                    sx={{ ...greenBorderSx, minWidth: '5rem', maxWidth: '5rem' }}
                                />
                            )}
                        </Grid>
                        <Grid item xs={12} sm="auto" sx={{ minWidth: isMobile ? '100%' : 80 }}>
                            {isMobile ? (
                                <Box>
                                    <Typography variant="caption" display="block" sx={{ color: '#555' }}>
                                        Período
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        value={formData.period}
                                        disabled
                                        sx={{ ...greenBorderSx }}
                                    />
                                </Box>
                            ) : (
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label="Período"
                                    value={formData.period}
                                    disabled
                                    sx={{ ...greenBorderSx, minWidth: '6rem', maxWidth: '6rem' }}
                                />
                            )}
                        </Grid>
                        <Grid
                            item
                            xs={12}
                            sm
                            sx={{
                                flexGrow: 1,
                                minWidth: isMobile ? '100%' : 250,
                            }}
                        >
                            {isMobile ? (
                                <Box>
                                    <Typography variant="caption" display="block" sx={{ color: '#555' }}>
                                        Curso
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        value={formData.course.name}
                                        disabled
                                        sx={{ ...greenBorderSx }}
                                    />
                                </Box>
                            ) : (
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label="Curso"
                                    value={formData.course.name}
                                    disabled
                                    sx={{ ...greenBorderSx }}
                                />
                            )}
                        </Grid>
                        <Grid item xs={12} sm="auto" sx={{ minWidth: isMobile ? '100%' : 80 }}>
                            {isMobile ? (
                                <Box>
                                    <Typography variant="caption" display="block" sx={{ color: '#555' }}>
                                        Turma
                                    </Typography>
                                    <FormControl
                                        fullWidth
                                        variant="outlined"
                                        sx={{ ...greenBorderSx, minWidth: '220px', maxWidth: '100%' }}
                                    >
                                        <Select
                                            value={formData.classId}
                                            onChange={e => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                                            MenuProps={menuProps}
                                            disabled={classIdToEdit}
                                        >
                                            {availableData.classOptions.map(cls => (
                                                <MenuItem key={cls.id} value={cls.id}>
                                                    {cls.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            ) : (
                                <FormControl
                                    fullWidth
                                    variant="outlined"
                                    sx={{ ...greenBorderSx, minWidth: '240px', maxWidth: '240px' }}
                                >
                                    <InputLabel>Turma (Obrigatório)</InputLabel>
                                    <Select
                                        value={formData.classId}
                                        onChange={e => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                                        label="Turma (Obrigatório)"
                                        MenuProps={menuProps}
                                        disabled={classIdToEdit}
                                    >
                                        {availableData.classOptions && availableData.classOptions.length > 0 ? (
                                            availableData.classOptions.map(cls => (
                                                <MenuItem key={cls.id} value={cls.id}>
                                                    {cls.name}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled>
                                                Nenhuma turma encontrada.
                                            </MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                            )}
                        </Grid>
                        <Grid item xs={12} sm="auto" sx={{ minWidth: isMobile ? '100%' : 80 }}>
                            {isMobile ? (
                                <Box>
                                    <Typography variant="caption" display="block" sx={{ color: '#555' }}>
                                        Turno
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        value={availableData.turnos.find(t => t.id === formData.turno)?.name || ''}
                                        disabled
                                        sx={{ ...greenBorderSx }}
                                    />
                                </Box>
                            ) : (
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label="Turno"
                                    value={availableData.turnos.find(t => t.id === formData.turno)?.name || ''}
                                    disabled
                                    sx={{ ...greenBorderSx, minWidth: '170px', maxWidth: '170px' }}
                                />
                            )}
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Divider sx={{ my: 3, width: { xs: '100%', sm: '100%' }, mx: 'auto' }} />

            <Card
                raised
                sx={{
                    borderRadius: '12px',
                    boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)',
                    maxWidth: '100%',
                    mx: 'auto',
                    opacity: isEditingMode ? 1 : 0.8,
                    pointerEvents: isEditingMode ? 'auto' : 'none',
                }}
            >
                <CardContent>
                    <Typography
                        variant={isMobile ? "body1" : "h6"}
                        gutterBottom
                        sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 3 }}
                    >
                        Preferências de Disciplinas
                    </Typography>

                    {!formData.classId ? (
                        <Box sx={{ p: 2, textAlign: 'center', color: '#757575', fontStyle: 'italic' }}>
                            <Typography variant="body1">Selecione uma turma para habilitar as preferências de disciplinas.</Typography>
                        </Box>
                    ) : (
                        <>
                            {isMobile ? (
                                <Box>
                                    {formData.subjects.map((subject) => (
                                        <Paper
                                            key={subject.id}
                                            sx={{
                                                p: 2,
                                                mb: 2,
                                                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
                                                borderRadius: '8px',
                                                backgroundColor: '#fff',
                                                width: '100%',
                                            }}
                                        >
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid item xs={12}>
                                                    <Typography variant="caption" display="block" sx={{ color: '#555', mb: 0.5 }}>
                                                        Disciplina(s)
                                                    </Typography>
                                                    <Box sx={{ width: '100%' }}>
                                                        <SubjectSelect subject={subject} />
                                                    </Box>
                                                </Grid>

                                                <Grid item xs={12}>
                                                    <Typography variant="caption" display="block" sx={{ color: '#555', mb: 0.5 }}>
                                                        Professor(es)
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                                                        {subject.professorIds.map((profId, profIndex) => (
                                                            <Box key={profIndex} sx={{ width: '100%' }}>
                                                                <ProfessorSelect subject={subject} professorId={profId} index={profIndex} />
                                                            </Box>
                                                        ))}

                                                        <Button
                                                            startIcon={<Add />}
                                                            onClick={() => handleAddProfessorField(subject.id)}
                                                            variant="outlined"
                                                            disabled={!isEditingMode || !subject.subjectId || subject.professorIds.some(profId => !profId)}
                                                            fullWidth
                                                            sx={{
                                                                mt: 1, color: '#2e7d32', borderColor: '#2e7d32',
                                                                '&:hover': { borderColor: '#1b5e20', backgroundColor: 'rgba(46, 125, 50, 0.04)' },
                                                                '&.Mui-disabled': { borderColor: '#ccc', color: '#ccc' },
                                                                textTransform: 'none', borderRadius: '8px', padding: '6px 12px'
                                                            }}
                                                        >
                                                            Adicionar Outro Professor
                                                        </Button>
                                                    </Box>
                                                </Grid>

                                                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => handleRemoveSubjectRow(subject.id)}
                                                        aria-label="remover disciplina"
                                                        disabled={!isEditingMode || formData.subjects.length === 1}
                                                    >
                                                        <DeleteOutline />
                                                    </IconButton>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    ))}
                                </Box>
                            ) : (
                                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                                    <Table sx={{ minWidth: 650 }} aria-label="disciplines table">
                                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#555', width: '35%' }}>Disciplina(s)</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#555', width: '45%' }}>Professor(es)</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#555', width: '10%' }}>Ações</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {formData.subjects.map(subject => (
                                                <TableRow key={subject.id}>
                                                    <TableCell sx={{ verticalAlign: 'top', pt: '16px!important' }}>
                                                        <SubjectSelect subject={subject} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                            {subject.professorIds.map((profId, index) => (
                                                                <ProfessorSelect key={index} subject={subject} professorId={profId} index={index} />
                                                            ))}
                                                            <Button
                                                                startIcon={<Add />}
                                                                onClick={() => handleAddProfessorField(subject.id)}
                                                                variant="outlined"
                                                                disabled={!isEditingMode || !subject.subjectId || subject.professorIds.some(profId => !profId)}
                                                                sx={{
                                                                    mt: 1, color: '#2e7d32', borderColor: '#2e7d32',
                                                                    '&:hover': { borderColor: '#1b5e20', backgroundColor: 'rgba(46, 125, 50, 0.04)' },
                                                                    '&.Mui-disabled': { borderColor: '#ccc', color: '#ccc' },
                                                                    textTransform: 'none', borderRadius: '8px', padding: '6px 12px', alignSelf: 'flex-start'
                                                                }}
                                                            >
                                                                Adicionar Outro Professor
                                                            </Button>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ verticalAlign: 'top', pt: '16px!important' }}>
                                                        <IconButton
                                                            color="error"
                                                            onClick={() => handleRemoveSubjectRow(subject.id)}
                                                            aria-label="remover disciplina"
                                                            disabled={!isEditingMode || formData.subjects.length === 1}
                                                        >
                                                            <DeleteOutline />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                            <Button
                                startIcon={<AddCircleOutline />}
                                onClick={handleAddSubjectRow}
                                variant="outlined"
                                disabled={
                                    !isEditingMode ||
                                    !formData.classId ||
                                    formData.subjects.length === 0 ||
                                    !formData.subjects[formData.subjects.length - 1].subjectId ||
                                    formData.subjects[formData.subjects.length - 1].subjectId === 'other' ||
                                    formData.subjects[formData.subjects.length - 1].professorIds.every(profId => !profId)
                                }
                                fullWidth={isMobile}
                                sx={{
                                    mt: 2,
                                    width: isMobile ? '100%' : 'auto',
                                    color: '#2e7d32',
                                    borderColor: '#2e7d32',
                                    '&:hover': { borderColor: '#1b5e20', backgroundColor: 'rgba(46, 125, 50, 0.04)' },
                                    textTransform: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                }}
                            >
                                Adicionar Disciplina
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            <Divider sx={{ my: 3, width: { xs: '100%', sm: '100%' }, mx: 'auto' }} />

            <Card
                raised
                sx={{
                    borderRadius: '12px',
                    boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)',
                    maxWidth: '100%',
                    mx: 'auto',
                    opacity: isEditingMode ? 1 : 0.7,
                    pointerEvents: isEditingMode ? 'auto' : 'none',
                }}
            >
                <CardContent>
                    <Typography
                        variant={isMobile ? 'body1' : 'h6'}
                        gutterBottom
                        sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 3 }}
                    >
                        Preferências de Dias
                    </Typography>
                    {availableData.professors.filter(prof => formData.subjects.flatMap(s => s.professorIds).includes(prof.id)).length > 0 ? (
                        <>
                            <Typography
                                variant={isMobile ? 'body1' : 'h6'}
                                gutterBottom
                                sx={{ fontWeight: 'bold', mb: 3, fontSize: '13px' }}
                            >
                                <span style={{ color: '#000000' }}>Observação:</span>{' '}
                                <span style={{ color: 'red' }}>
                                    Lembre-se de manter a mesma proporção de professores entre os dias de segunda a quarta e de quarta a sexta.
                                </span>
                            </Typography>
                            {isMobile ? (
                                <>
                                    {availableData.professors
                                        .filter(prof => formData.subjects.flatMap(s => s.professorIds).includes(prof.id))
                                        .map(professor => (
                                            <Card
                                                key={professor.id}
                                                raised
                                                sx={{ mb: 2, borderRadius: '8px', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)' }}
                                            >
                                                <CardContent>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                        {professor.name}
                                                    </Typography>
                                                    <Stack direction="column" spacing={1}>
                                                        {availableData.daysOfWeek.map(day => (
                                                            <Box
                                                                key={`${professor.id}-${day.name}`}
                                                                sx={{ display: 'flex', alignItems: 'center' }}
                                                            >
                                                                <Typography variant="body2" sx={{ minWidth: '100px' }}>
                                                                    {day.name}
                                                                </Typography>
                                                                <Checkbox
                                                                    checked={formData.professorSchedules[professor.id]?.[day.name] || false}
                                                                    onChange={e => handleScheduleChange(professor.id, day.name, e.target.checked)}
                                                                    sx={{ color: '#2e7d32', '&.Mui-checked': { color: '#2e7d32' } }}
                                                                    disabled={!isEditingMode || professor.prefsDays?.length > 0}
                                                                    title={professor.prefsDays?.length > 0 ? 'Preferências já definidas' : ''}
                                                                />
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                                                        <Typography variant="body2" sx={{ mr: 2.5 }}>
                                                            Observações:
                                                        </Typography>
                                                        <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                                            <InfoOutlinedIcon
                                                                sx={{
                                                                    color: '#2e7d32',
                                                                    cursor: 'pointer',
                                                                }}
                                                                onClick={() => handleOpenDialog(formatObservations(professor.prefsDays).observation, professor.name)}
                                                                title={formatObservations(professor.prefsDays).hasObservation ? 'Observações disponíveis' : 'Nenhuma observação'}
                                                            />
                                                            {formatObservations(professor.prefsDays).hasObservation && (
                                                                <Box
                                                                    sx={{
                                                                        position: 'absolute',
                                                                        top: -4,
                                                                        right: -4,
                                                                        width: 16,
                                                                        height: 16,
                                                                        backgroundColor: '#d32f2f',
                                                                        borderRadius: '50%',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        color: '#fff',
                                                                        fontSize: '10px',
                                                                        fontWeight: 'bold',
                                                                    }}
                                                                >
                                                                    (1)
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}
                                </>
                            ) : (
                                <TableContainer
                                    component={Paper}
                                    sx={{ boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                                >
                                    <Table size="small" aria-label="professor schedule table">
                                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#555', width: '25%' }}>
                                                    Professor
                                                </TableCell>
                                                {availableData.daysOfWeek.map(day => (
                                                    <TableCell
                                                        key={day.name}
                                                        align="center"
                                                        sx={{ fontWeight: 'bold', color: '#555' }}
                                                    >
                                                        {day.name}
                                                    </TableCell>
                                                ))}
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#555' }}>
                                                    Observações
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {availableData.professors
                                                .filter(prof => formData.subjects.flatMap(s => s.professorIds).includes(prof.id))
                                                .map(professor => (
                                                    <TableRow key={professor.id}>
                                                        <TableCell component="th" scope="row">
                                                            {professor.name}
                                                        </TableCell>
                                                        {availableData.daysOfWeek.map(day => (
                                                            <TableCell key={`${professor.id}-${day.name}`} align="center">
                                                                <Checkbox
                                                                    checked={formData.professorSchedules[professor.id]?.[day.name] || false}
                                                                    onChange={e => handleScheduleChange(professor.id, day.name, e.target.checked)}
                                                                    sx={{ color: '#2e7d32', '&.Mui-checked': { color: '#2e7d32' } }}
                                                                    disabled={!isEditingMode || professor.prefsDays?.length > 0}
                                                                    title={professor.prefsDays?.length > 0 ? 'Preferências já definidas' : ''}
                                                                />
                                                            </TableCell>
                                                        ))}
                                                        <TableCell align="center">
                                                            <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                                                <InfoOutlinedIcon
                                                                    sx={{
                                                                        color: '#2e7d32',
                                                                        cursor: 'pointer',
                                                                        verticalAlign: 'middle',
                                                                    }}
                                                                    onClick={() => handleOpenDialog(formatObservations(professor.prefsDays).observation, professor.name)}
                                                                    title={formatObservations(professor.prefsDays).hasObservation ? 'Observações disponíveis' : 'Nenhuma observação'}
                                                                />
                                                                {formatObservations(professor.prefsDays).hasObservation && (
                                                                    <Box
                                                                        sx={{
                                                                            position: 'absolute',
                                                                            top: -4,
                                                                            right: -4,
                                                                            width: 16,
                                                                            height: 16,
                                                                            backgroundColor: '#d32f2f',
                                                                            borderRadius: '50%',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            color: '#fff',
                                                                            fontSize: '10px',
                                                                            fontWeight: 'bold',
                                                                        }}
                                                                    >
                                                                        1
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </>
                    ) : (
                        <Box sx={{ p: 2, textAlign: 'center', color: '#757575', fontStyle: 'italic' }}>
                            <Typography variant="body1">
                                Selecione ao menos um professor para selecionar suas preferências de horários.
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 4, maxWidth: '100%', mx: 'auto', gap: 2 }}>
                {!classIdToEdit && isEditingMode && (
                    <Button
                        variant="outlined"
                        onClick={handleCancel}
                        sx={{
                            height: '40px',
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
                )}
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    sx={{
                        height: '40px',
                        backgroundColor: '#2e7d32',
                        '&:hover': { backgroundColor: '#1b5e20' },
                        textTransform: 'none',
                        fontSize: '14px',
                        padding: '0 22px',
                        borderRadius: '6px',
                    }}
                >
                    {!classIdToEdit ? 'Cadastrar' : !isEditingMode ? 'Editar' : 'Salvar'}
                </Button>
            </Box>

            <ObservationsTeacherDialog
                open={dialogOpen}
                observation={selectedObservation}
                professorName={selectedProfessorName}
                handleClose={handleCloseDialog}
            />
        </Box>
    );
};

export default RegisterTeachingPlanning;