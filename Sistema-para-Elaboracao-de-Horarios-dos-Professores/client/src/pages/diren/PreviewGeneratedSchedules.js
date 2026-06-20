import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography,
    Box,
    useMediaQuery,
    useTheme,
    createTheme,
    ThemeProvider,
} from '@mui/material';
import { useParams, useLocation } from 'react-router-dom';
import { AlertMessage } from '../../components/AlertMessage';
import DisciplineDeleteDialog from './DisciplineDeleteDialog';
import api from '../../service/api';
import FilterByShift from '../../components/FilterByShift';
import CourseClassSection from './CourseClassSection';
import ObservationsTeacherDialog from '../coordenador/ObservationsTeacherDialog';
import PreferenceErrorDialog from '../../components/PreferenceErrorDialog';
import { handleApiError } from '../../components/handleApiError';

const CONFLICT_MESSAGES = {
    same_day: 'O mesmo professor está alocado em mais de uma turma no mesmo horário.',
};

const getProfessorInitials = (name) => {
    if (!name) return 'N/A';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return parts.map(p => p[0]).join('').toUpperCase();
};

const customTheme = createTheme({
    palette: {
        primary: {
            main: '#2e7d32',
        },
        background: {
            default: '#ffffff',
        },
        text: {
            primary: '#212121',
            secondary: '#757575',
        },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    border: '1px solid #408349',
                    backgroundColor: '#ffffff',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    padding: '10px',
                    borderBottom: '1px solid #e0e0e0',
                },
                head: {
                    fontWeight: 600,
                    backgroundColor: '#f5f5f5',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                    padding: '8px 10px',
                },
            },
        },
        MuiTypography: {
            styleOverrides: {
                root: {
                    color: '#212121',
                },
            },
        },
    },
});

const PreviewGeneratedSchedules = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { calendarId } = useParams();
    const { state } = useLocation();
    const successMessage = state?.successMessage || null;
    const calendarName = state?.calendarName || 'Não Informado';
    const [selectedShift, setSelectedShift] = useState(null);
    const [scheduleData, setScheduleData] = useState([]);
    const [savedScheduleData, setSavedScheduleData] = useState([]);
    const [daysOfWeek, setDaysOfWeek] = useState([]);
    const [hoursData, setHoursData] = useState({});
    const [alert, setAlert] = useState(successMessage ? { message: successMessage, type: 'success' } : null);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedClasses, setExpandedClasses] = useState({});
    const [swapMode, setSwapMode] = useState({});
    const [selectedCell, setSelectedCell] = useState(null);
    const [pendingChanges, setPendingChanges] = useState([]);
    const [conflicts, setConflicts] = useState([]);
    const [preferenceError, setPreferenceError] = useState(null);
    const [editMode, setEditMode] = useState({});
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDiscipline, setSelectedDiscipline] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [isPostCompleted, setIsPostCompleted] = useState({});
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [deleteMode, setDeleteMode] = useState({});
    const [duplicateMode, setDuplicateMode] = useState({});
    const [openObservationsDialog, setOpenObservationsDialog] = useState(false);
    const [selectedProfessor, setSelectedProfessor] = useState({ name: '', observation: '' });

    const handleConflicts = (scheduleData, setConflicts, setAlert, setPreferenceError) => {
        if (!Array.isArray(scheduleData)) {
            setAlert({ message: 'Dados de horário inválidos.', type: 'error' });
            return true;
        }
        const newConflicts = checkConflicts(scheduleData);
        setConflicts(newConflicts);
        if (newConflicts.length > 0) {
            const message = [...new Set(newConflicts.map((c) => CONFLICT_MESSAGES[c.type]))].join(' ');
            setAlert({ message, type: 'error' });
            return true;
        }
        setPreferenceError(null);
        return false;
    };

    const transformHoursData = (apiHours) => {
        const transformed = {};
        apiHours.forEach((hour) => {
            const turnId = hour.turn?.id;
            if (turnId && !transformed[turnId]) {
                transformed[turnId] = [];
            }
            if (turnId) {
                transformed[turnId].push({
                    hourStart: hour.hourStart,
                    hourEnd: hour.hourEnd,
                    id: hour.id,
                });
            }
        });
        return transformed;
    };

    useEffect(() => {
        const loadStaticSchedule = async () => {
            setIsLoading(true);
            try {
                const [daysRes, hoursRes] = await Promise.all([
                    api.get('/daysOfWeek'),
                    api.get('/hours')
                ]);

                setDaysOfWeek(daysRes.data.map(d => ({ id: d.id, name: d.name })));
                setHoursData(transformHoursData(hoursRes.data));

                const module = await import(`../../metrics/${calendarId}_schedule.json`);
                const scheduleDataJson = module.default;

                if (!scheduleDataJson || scheduleDataJson.length === 0) {
                    throw new Error('Arquivo schedule.json vazio ou não encontrado');
                }

                setScheduleData(scheduleDataJson);
                setSavedScheduleData(scheduleDataJson);

                // inicializa expanded, etc.
                const expanded = {};
                scheduleDataJson.forEach(course => {
                    course.classes?.forEach(cls => {
                        expanded[cls.id] = scheduleDataJson.flatMap(c => c.classes || []).length > 12 ? false : true;
                    });
                });
                setExpandedClasses(expanded);

                handleConflicts(scheduleDataJson, setConflicts, setAlert, setPreferenceError);
                

            } catch (err) {
                handleApiError(err, setAlert);
            } finally {
                setIsLoading(false);
            }
        };

        loadStaticSchedule();
    }, [calendarId]);

    const handleCloseAlert = () => setAlert(null);
    const handleClosePreferenceError = () => setPreferenceError(null);

    const toggleMode = (mode, classId) => {
        const modes = {
            swap: setSwapMode,
            delete: setDeleteMode,
            duplicate: setDuplicateMode,
        };

        Object.entries(modes).forEach(([key, setter]) => {
            if (key === mode) {
                setter((prev) => ({
                    ...prev,
                    [classId]: !prev[classId] || false,
                }));
            } else {
                setter((prev) => ({
                    ...prev,
                    [classId]: false,
                }));
            }
        });

        setSelectedCell(null);
        setSelectedSlot(null);
    };

    const handleToggleSwapMode = (classId) => toggleMode('swap', classId);
    const handleToggleDeleteMode = (classId) => toggleMode('delete', classId);
    const handleToggleDuplicateMode = (classId) => toggleMode('duplicate', classId);

    const handleCellClick = (discipline, classId, day, startTime) => {
        if (!editMode[classId] && isPostCompleted[classId]) {
            return;
        }

        if (deleteMode[classId] && discipline.id !== 'unallocated') {
            if (!Array.isArray(scheduleData)) {
                setAlert({ message: 'Dados de horário inválidos.', type: 'error' });
                return;
            }
            const classItem = scheduleData.flatMap(course => Array.isArray(course.classes) ? course.classes : []).find(c => c.id === classId);
            if (!classItem) {
                setAlert({ message: 'Turma não encontrada.', type: 'error' });
                return;
            }
            setSelectedDiscipline({ ...discipline, day, startTime });
            setSelectedClass(classItem);
            setDeleteDialogOpen(true);
            return;
        }

        if (duplicateMode[classId]) {
            if (selectedSlot && discipline.id === 'unallocated') {
                handleDuplicateSlot(classId, day, startTime);
            } else if (discipline.id !== 'unallocated') {
                const professorId = discipline.professor1?.id || discipline.professorId || null;
                const professorName = discipline.professor1?.name || discipline.professorName || '';
                const professorShort = discipline.professor1?.initials || discipline.professorShort || getProfessorInitials(professorName);
                if (!professorId || !professorName) {
                    setAlert({ message: 'Não é possível duplicar uma disciplina sem ID ou nome do professor.', type: 'error' });
                    return;
                }
                setSelectedSlot({
                    classId,
                    disciplineId: discipline.id || null,
                    disciplineCode: discipline.code || '',
                    disciplineName: discipline.description || '',
                    professorId,
                    professorName,
                    professorShort,
                    day,
                    startTime,
                    endTime: discipline.endTime || null,
                    preferences: discipline.preferences || [],
                    observation: discipline.observation || '',
                });
            }
            return;
        }

        if (discipline.id === 'unallocated' && !swapMode[classId]) {
            return;
        }

        if (!swapMode[classId]) {
            handleToggleSwapMode(classId);
            setSelectedCell({ classId, disciplineId: discipline.id, day, startTime });
        } else if (
            selectedCell &&
            selectedCell.classId === classId &&
            (selectedCell.disciplineId !== discipline.id ||
                selectedCell.day !== day ||
                selectedCell.startTime !== startTime)
        ) {
            handleSwapDiscipline(discipline, classId, day, startTime);
        } else {
            handleToggleSwapMode(classId);
            setSelectedCell(null);
        }
    };

    const handleDisciplineDeleted = (disciplineId, classId, day, startTime) => {
        if (!Array.isArray(scheduleData)) {
            setAlert({ message: 'Dados de horário inválidos.', type: 'error' });
            return;
        }
        const updatedScheduleData = scheduleData.map((course) => ({
            ...course,
            classes: Array.isArray(course.classes) ? course.classes.map((classItem) => {
                if (classItem.id === classId) {
                    const newDisciplines = classItem.disciplines.filter(
                        (d) => !(d.id === disciplineId && d.day === day && d.startTime === startTime)
                    );
                    return {
                        ...classItem,
                        disciplines: newDisciplines,
                    };
                }
                return { ...classItem };
            }) : [],
        }));
        setScheduleData(updatedScheduleData);
        setPendingChanges((prev) => {
            const existingChange = prev.find((change) => change.classId === classId);
            if (existingChange) {
                return prev.map((change) =>
                    change.classId === classId
                        ? { ...change, assignments: [...change.assignments, { disciplineId, day, startTime, deleted: true }] }
                        : change
                );
            }
            return [...prev, { classId, assignments: [{ disciplineId, day, startTime, deleted: true }] }];
        });
        setAlert({ message: 'Disciplina removida com sucesso.', type: 'success' });
        handleConflicts(updatedScheduleData, setConflicts, setAlert, setPreferenceError);
        setDeleteMode((prev) => ({ ...prev, [classId]: false }));
        setDeleteDialogOpen(false);
        setSelectedDiscipline(null);
        setSelectedClass(null);
    };

    const handleDuplicateSlot = (classId, targetDay, targetStartTime) => {
        if (!selectedSlot) {
            setAlert({ message: 'Nenhum slot selecionado para duplicação.', type: 'error' });
            return;
        }
        const {
            disciplineId,
            disciplineCode,
            disciplineName,
            professorId,
            professorName,
            professorShort,
            observation,
            preferences,
        } = selectedSlot;
        if (!disciplineId || !disciplineCode || !disciplineName || !professorId || !professorName) {
            setAlert({ message: 'Dados incompletos para duplicação.', type: 'error' });
            return;
        }
        if (!Array.isArray(scheduleData)) {
            setAlert({ message: 'Dados de horário inválidos.', type: 'error' });
            return;
        }
        const classData = scheduleData.flatMap((course) => Array.isArray(course.classes) ? course.classes : []).find((classItem) => classItem.id === classId);
        if (!classData) {
            setAlert({ message: 'Turma não encontrada.', type: 'error' });
            return;
        }
        const turnId = classData.turnId;
        const targetHour = hoursData[turnId]?.find((h) => h.hourStart === targetStartTime);
        if (!targetHour) {
            setAlert({ message: 'Horário inválido.', type: 'error' });
            return;
        }
        const isSlotOccupied = classData.disciplines.some(
            (d) => d.day === targetDay && d.startTime === targetStartTime
        );
        if (isSlotOccupied) {
            setAlert({ message: 'O horário selecionado já está ocupado.', type: 'error' });
            return;
        }
        const newDiscipline = {
            id: disciplineId,
            code: disciplineCode,
            description: disciplineName,
            professor1: {
                id: professorId,
                name: professorName,
                initials: professorShort || getProfessorInitials(professorName),
            },
            day: targetDay,
            startTime: targetStartTime,
            endTime: targetHour.hourEnd,
            preferences: preferences || [],
            observation: observation || '',
            hasConflict: false,
        };
        const updatedScheduleData = scheduleData.map((course) => ({
            ...course,
            classes: Array.isArray(course.classes) ? course.classes.map((classItem) => {
                if (classItem.id === classId) {
                    return {
                        ...classItem,
                        disciplines: [...classItem.disciplines, newDiscipline],
                    };
                }
                return { ...classItem };
            }) : [],
        }));
        setScheduleData(updatedScheduleData);
        const newAssignment = {
            disciplineId,
            professorId,
            professorName,
            disciplineName,
            disciplineCode,
            professorNameCode: professorShort || getProfessorInitials(professorName),
            professorObservation: observation || '',
        };
        setPendingChanges((prev) => {
            const existingChange = prev.find((change) => change.classId === classId);
            if (existingChange) {
                return prev.map((change) =>
                    change.classId === classId
                        ? { ...change, assignments: [...change.assignments, newAssignment] }
                        : change
                );
            }
            return [...prev, { classId, assignments: [newAssignment] }];
        });
        const hasConflicts = handleConflicts(updatedScheduleData, setConflicts, setAlert, setPreferenceError);
        if (!hasConflicts) {
            setAlert({ message: 'Disciplina duplicada com sucesso.', type: 'success' });
        }
        setDuplicateMode((prev) => ({ ...prev, [classId]: false }));
        setSelectedSlot(null);
    };

    const handleSwapDiscipline = (targetDiscipline, classId, targetDay, targetStartTime) => {
        if (!selectedCell) return;
        if (!Array.isArray(scheduleData)) {
            setAlert({ message: 'Dados de horário inválidos.', type: 'error' });
            return;
        }
        const { classId: sourceClassId, disciplineId: sourceDisciplineId, day: sourceDay, startTime: sourceStartTime } = selectedCell;
        const updatedScheduleData = scheduleData.map((course) => ({
            ...course,
            classes: Array.isArray(course.classes) ? course.classes.map((classItem) => {
                if (classItem.id === classId) {
                    const newDisciplines = [...classItem.disciplines];
                    const sourceIndex = newDisciplines.findIndex(
                        (d) => d.id === sourceDisciplineId && d.day === sourceDay && d.startTime === sourceStartTime
                    );
                    const targetIndex = newDisciplines.findIndex(
                        (d) => d.id === targetDiscipline.id && d.day === targetDay && d.startTime === targetStartTime
                    );
                    if (sourceIndex !== -1 && targetIndex !== -1) {
                        const temp = { ...newDisciplines[sourceIndex] };
                        newDisciplines[sourceIndex] = {
                            ...newDisciplines[sourceIndex],
                            day: newDisciplines[targetIndex].day,
                            startTime: newDisciplines[targetIndex].startTime,
                            endTime: newDisciplines[targetIndex].endTime,
                        };
                        newDisciplines[targetIndex] = {
                            ...newDisciplines[targetIndex],
                            day: temp.day,
                            startTime: temp.startTime,
                            endTime: temp.endTime,
                        };
                    } else if (sourceIndex !== -1 && targetDiscipline.id === 'unallocated') {
                        const turnId = classItem.turnId;
                        const targetEndTime = hoursData[turnId].find((h) => h.hourStart === targetStartTime)?.hourEnd;
                        newDisciplines[sourceIndex] = {
                            ...newDisciplines[sourceIndex],
                            day: targetDay,
                            startTime: targetStartTime,
                            endTime: targetEndTime,
                        };
                    }
                    return { ...classItem, disciplines: newDisciplines };
                }
                return classItem;
            }) : [],
        }));
        setScheduleData(updatedScheduleData);
        setPendingChanges((prev) => {
            const existingChange = prev.find((change) => change.classId === classId);
            const newAssignment = {
                disciplineId: sourceDisciplineId,
                day: targetDay,
                startTime: targetStartTime,
            };
            const targetAssignment = targetDiscipline.id !== 'unallocated' ? {
                disciplineId: targetDiscipline.id,
                day: sourceDay,
                startTime: sourceStartTime,
            } : null;
            if (existingChange) {
                const updatedAssignments = [...existingChange.assignments, newAssignment];
                if (targetAssignment) updatedAssignments.push(targetAssignment);
                return prev.map((change) =>
                    change.classId === classId ? { ...change, assignments: updatedAssignments } : change
                );
            }
            return [...prev, { classId, assignments: [newAssignment, ...(targetAssignment ? [targetAssignment] : [])] }];
        });
        handleConflicts(updatedScheduleData, setConflicts, setAlert, setPreferenceError);
        setSwapMode(false);
        setSelectedCell(null);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setSelectedDiscipline(null);
        setSelectedClass(null);
    };

    const handleConfirmDelete = () => {
        if (selectedDiscipline && selectedClass) {
            handleDisciplineDeleted(selectedDiscipline.id, selectedClass.id, selectedDiscipline.day, selectedDiscipline.startTime);
        }
    };

    const doTimeRangesOverlap = (start1, end1, start2, end2) => {
        const dateString = '2000-01-01T';
        const d1Start = new Date(dateString + start1);
        const d1End = new Date(dateString + end1);
        const d2Start = new Date(dateString + start2);
        const d2End = new Date(dateString + end2);
        return d1Start < d2End && d2Start < d1End;
    };

    const checkConflicts = useCallback((data) => {
        const newConflicts = [];
        const professorSchedules = {};

        if (!Array.isArray(data)) {
            return newConflicts;
        }

        data.forEach((course) => {
            if (Array.isArray(course.classes)) {
                course.classes.forEach((classItem) => {
                    classItem.disciplines.forEach((discipline) => {
                        if (discipline.professor1?.name && discipline.day && discipline.startTime && discipline.endTime) {
                            if (!professorSchedules[discipline.professor1.name]) {
                                professorSchedules[discipline.professor1.name] = {};
                            }
                            if (!professorSchedules[discipline.professor1.name][discipline.day]) {
                                professorSchedules[discipline.professor1.name][discipline.day] = [];
                            }
                            professorSchedules[discipline.professor1.name][discipline.day].push({
                                classId: classItem.id,
                                disciplineId: discipline.id,
                                startTime: discipline.startTime,
                                endTime: discipline.endTime,
                            });
                        }
                    });
                });
            }
        });

        Object.entries(professorSchedules).forEach(([professor, days]) => {
            Object.entries(days).forEach(([day, schedules]) => {
                schedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
                for (let i = 0; i < schedules.length - 1; i++) {
                    const schedule1 = schedules[i];
                    const schedule2 = schedules[i + 1];
                    if (doTimeRangesOverlap(schedule1.startTime, schedule1.endTime, schedule2.startTime, schedule2.endTime)) {
                        newConflicts.push({
                            classId1: schedule1.classId,
                            disciplineId1: schedule1.disciplineId,
                            classId2: schedule2.classId,
                            disciplineId2: schedule2.disciplineId,
                            professor,
                            day,
                            startTime: schedule1.startTime,
                            type: 'same_day',
                        });
                    }
                }
            });
        });

        return newConflicts;
    }, [daysOfWeek]);

    const handleToggleEdit = (classId) => {
        setEditMode((prev) => {
            const newEditMode = { ...prev, [classId]: !prev[classId] };
            if (!newEditMode[classId]) {
                setScheduleData(savedScheduleData);
                setPendingChanges((prev) => prev.filter((change) => change.classId !== classId));
                toggleMode(null);
            }
            return newEditMode;
        });
    };

    const saveNewSchedules = async (calendarId, payload, classData, classId) => {
        try {
            await api.post(`/hour-grid/${calendarId}`, payload);
            setSavedScheduleData((prevData) =>
                prevData.map((course) => ({
                    ...course,
                    classes: Array.isArray(course.classes) ? course.classes.map((classItem) => {
                        if (classItem.id === classId) {
                            return {
                                ...classItem,
                                disciplines: [...classData.disciplines],
                            };
                        }
                        return classItem;
                    }) : [],
                }))
            );
            setPendingChanges((prev) => prev.filter((change) => change.classId !== classId));
            setEditMode((prev) => ({ ...prev, [classId]: false }));
            setIsPostCompleted((prev) => ({ ...prev, [classId]: true }));
            setAlert({
                message: `Horários salvos com sucesso para a turma ${classData.code}.`,
                type: 'success',
            });
        } catch (error) {
            handleApiError(error, setAlert, setPreferenceError);
            throw error;
        }
    };

    const updateSchedules = async (calendarId, payload, classData, classId) => {
        try {
            await api.put(`/hour-grid/save-anyway/${calendarId}`, payload);
            setSavedScheduleData((prevData) =>
                prevData.map((course) => ({
                    ...course,
                    classes: Array.isArray(course.classes) ? course.classes.map((classItem) => {
                        if (classItem.id === classId) {
                            return {
                                ...classItem,
                                disciplines: [...classData.disciplines],
                            };
                        }
                        return classItem;
                    }) : [],
                }))
            );
            setPendingChanges((prev) => prev.filter((change) => change.classId !== classId));
            setEditMode((prev) => ({ ...prev, [classId]: false }));
            setIsPostCompleted((prev) => ({ ...prev, [classId]: true }));
            setAlert({
                message: `Horários editados com sucesso para a turma ${classData.code}.`,
                type: 'success',
            });
        } catch (error) {
            handleApiError(error, setAlert, setPreferenceError);
            throw error;
        }
    };

    const handleSaveChanges = async (classId) => {
        setIsLoading(true);
        setAlert(null);
        setPreferenceError(null);
        try {
            if (!Array.isArray(scheduleData)) {
                setAlert({
                    message: 'Dados de horário inválidos.',
                    type: 'error',
                });
                return;
            }
            const classData = scheduleData.flatMap(course => Array.isArray(course.classes) ? course.classes : []).find(classItem => classItem.id === classId);
            if (!classData) {
                setAlert({
                    message: 'Turma não encontrada.',
                    type: 'error',
                });
                return;
            }
            const classConflicts = checkConflicts(scheduleData).filter(
                (conflict) => conflict.classId1 === classId || conflict.classId2 === classId
            );
            if (classConflicts.length > 0) {
                setConflicts(classConflicts);
                const message = [...new Set(classConflicts.map((c) => CONFLICT_MESSAGES[c.type]))].join(' ');
                setAlert({
                    message,
                    type: 'error',
                });
                return;
            }
            const payload = {
                data: {
                    id: classData.semesterId,
                    classId: classData.id,
                    code: classData.code,
                    courseId: scheduleData.find(course => Array.isArray(course.classes) && course.classes.some(c => c.id === classId))?.id,
                    assignments: classData.disciplines
                        .filter(d => d.id !== 'unallocated')
                        .map(discipline => ({
                            disciplineId: discipline.id,
                            professorId: discipline.professor1.id,
                            professorName: discipline.professor1.name,
                            disciplineName: discipline.description,
                            disciplineCode: discipline.code,
                            professorNameCode: discipline.professor1.initials,
                            professorObservation: discipline.observation,
                            day: discipline.day,
                            time: {
                                id: hoursData[classData.turnId]?.find(h => h.hourStart === discipline.startTime)?.id,
                                hourStart: discipline.startTime,
                                hourEnd: discipline.endTime,
                                turnId: classData.turnId,
                            },
                            preferences: discipline.preferences.map(pref => ({
                                dayId: daysOfWeek.find(day => day.name === pref.name)?.id,
                                name: pref.name,
                            })),
                        })),
                },
            };
            setSelectedCell((prev) => ({ ...prev, classId }));

            if (isPostCompleted[classId]) {
                await updateSchedules(calendarId, payload, classData, classId);
            } else {
                await saveNewSchedules(calendarId, payload, classData, classId);
            }
        } catch (error) {
            // Erro já tratado por handleApiError
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAnyway = async (classId) => {
        console.log('handleSaveAnyway called - classId:', classId, 'scheduleData:', scheduleData); // Debugging
        if (!classId) {
            setAlert({
                message: 'Nenhuma turma selecionada para salvar.',
                type: 'error',
            });
            return;
        }
        setIsLoading(true);
        setAlert(null);
        setPreferenceError(null);

        try {
            if (!Array.isArray(scheduleData)) {
                console.error('scheduleData is not an array:', scheduleData); // Debugging
                setAlert({
                    message: 'Dados de horário inválidos.',
                    type: 'error',
                });
                return;
            }
            const classData = scheduleData.flatMap((course) => Array.isArray(course.classes) ? course.classes : []).find((classItem) => classItem.id === classId);
            if (!classData) {
                setAlert({
                    message: 'Turma não encontrada.',
                    type: 'error',
                });
                return;
            }

            const payload = {
                data: {
                    id: classData.semesterId,
                    classId: classData.id,
                    code: classData.code,
                    courseId: scheduleData.find((course) => Array.isArray(course.classes) && course.classes.some((c) => c.id === classId))?.id,
                    assignments: classData.disciplines
                        .filter((d) => d.id !== 'unallocated')
                        .map((discipline) => ({
                            disciplineId: discipline.id,
                            professorId: discipline.professor1.id,
                            professorName: discipline.professor1.name,
                            disciplineName: discipline.description,
                            disciplineCode: discipline.code,
                            professorNameCode: discipline.professor1.initials,
                            professorObservation: discipline.observation,
                            day: discipline.day,
                            time: {
                                id: classData.turnIds
                                    .flatMap((turnId) => hoursData[turnId] || [])
                                    .find((h) => h.hourStart === discipline.startTime)?.id,
                                hourStart: discipline.startTime,
                                hourEnd: discipline.endTime,
                                turnId: classData.turnId,
                            },
                            preferences: discipline.preferences.map((pref) => ({
                                dayId: daysOfWeek.find((day) => day.name === pref.name)?.id,
                                name: pref.name,
                            })),
                        })),
                },
            };

            if (isPostCompleted[classId]) {
                await api.put(`/hour-grid/save-anyway/${calendarId}`, payload);
                setSavedScheduleData((prevData) =>
                    prevData.map((course) => ({
                        ...course,
                        classes: Array.isArray(course.classes) ? course.classes.map((classItem) => {
                            if (classItem.id === classId) {
                                return {
                                    ...classItem,
                                    disciplines: [...classData.disciplines],
                                };
                            }
                            return classItem;
                        }) : [],
                    }))
                );
                setAlert({
                    message: `Horários editados com sucesso para a turma ${classData.code}, ignorando preferências!`,
                    type: 'success',
                });
            } else {
                await api.post(`/hour-grid/${calendarId}`, payload);
                setSavedScheduleData((prevData) =>
                    prevData.map((course) => ({
                        ...course,
                        classes: Array.isArray(course.classes) ? course.classes.map((classItem) => {
                            if (classItem.id === classId) {
                                return {
                                    ...classItem,
                                    disciplines: [...classData.disciplines],
                                };
                            }
                            return classItem;
                        }) : [],
                    }))
                );
                setAlert({
                    message: `Horários salvos com sucesso para a turma ${classData.code}, ignorando preferências!`,
                    type: 'success',
                });
            }

            setPendingChanges((prev) => prev.filter((change) => change.classId !== classId));
            setEditMode((prev) => ({ ...prev, [classId]: false }));
            setIsPostCompleted((prev) => ({ ...prev, [classId]: true }));
            setSwapMode({});
            setSelectedCell(null);
            setPreferenceError(null);
        } catch (error) {
            console.error('Error in handleSaveAnyway:', error); // Debugging
            handleApiError(error, setAlert, setPreferenceError);
        } finally {
            setIsLoading(false);
        }
    };

    const mapDisciplinesToGrid = useCallback(
        (disciplines, turnId) => {
            const grid = {};
            const uniqueDisciplineDetails = {};
            const currentTurnHours = hoursData[turnId] || [];
            const dayNames = new Set(daysOfWeek.map(day => day.name));

            daysOfWeek.forEach((day) => {
                grid[day.name] = {};
                currentTurnHours.forEach((slot) => {
                    grid[day.name][slot.hourStart] = [{
                        id: 'unallocated',
                        code: '-',
                        description: 'Horário não alocado',
                        professor1: { id: null, name: '', initials: '' },
                        startTime: slot.hourStart,
                        endTime: slot.hourEnd,
                        hasConflict: false,
                    }];
                });
            });
            if (Array.isArray(disciplines)) {
                disciplines.forEach((disc) => {
                    if (dayNames.has(disc.day)) {
                        const matchingSlot = currentTurnHours.find((slot) =>
                            doTimeRangesOverlap(slot.hourStart, slot.hourEnd, disc.startTime, disc.endTime)
                        );
                        if (matchingSlot) {
                            const assignedProfessorId = disc.professor1?.id || null;
                            const assignedProfessorName = disc.professor1?.name || 'N/A';
                            const assignedProfessorInitials = disc.professor1?.initials || getProfessorInitials(assignedProfessorName);
                            grid[disc.day][matchingSlot.hourStart] = [{
                                id: disc.id,
                                code: disc.code,
                                description: disc.description,
                                professor1: {
                                    id: assignedProfessorId,
                                    name: assignedProfessorName,
                                    initials: assignedProfessorInitials,
                                },
                                startTime: disc.startTime,
                                endTime: disc.endTime,
                                hasConflict: conflicts.some(
                                    (conflict) =>
                                        (conflict.classId1 === disc.classId || conflict.classId2 === disc.classId) &&
                                        conflict.disciplineId1 === disc.id &&
                                        conflict.day === disc.day &&
                                        doTimeRangesOverlap(
                                            conflict.startTime,
                                            disc.endTime,
                                            disc.startTime,
                                            disc.endTime
                                        )
                                ),
                                preferences: disc.preferences || [],
                                observation: disc.observation || '',
                            }];
                            if (!uniqueDisciplineDetails[disc.code]) {
                                uniqueDisciplineDetails[disc.code] = {
                                    description: disc.description,
                                    professorName: assignedProfessorName,
                                    professorNameCode: assignedProfessorInitials,
                                    preferences: disc.preferences || [],
                                    observation: disc.observation || '',
                                };
                            }
                        }
                    }
                });
            }
            return { grid, uniqueDisciplineDetails };
        },
        [daysOfWeek, hoursData, conflicts]
    );

    const hasEmptySlots = useCallback(
        (classItem) => {
            const { grid } = mapDisciplinesToGrid(classItem.disciplines, classItem.turnId);
            return Object.values(grid).some((day) =>
                Object.values(day).some((slots) => slots.some((slot) => slot.id === 'unallocated'))
            );
        },
        [mapDisciplinesToGrid]
    );

    const hasPendingChanges = (classId) => {
        return pendingChanges.some((change) => change.classId === classId);
    };

    const handleOpenObservationsDialog = (professorName, observation) => {
        setSelectedProfessor({ name: professorName, observation: observation || 'Não há observações.' });
        setOpenObservationsDialog(true);
    };

    const handleCloseObservationsDialog = () => {
        setOpenObservationsDialog(false);
        setSelectedProfessor({ name: '', observation: '' });
    };

    return (
        <ThemeProvider theme={customTheme}>
            <Box sx={{ mx: { xs: 4, sm: 4 }, mt: { xs: 6, sm: 2 } }}>
                {alert && (
                    <AlertMessage
                        message={alert.message}
                        type={alert.type}
                        onClose={handleCloseAlert}
                    />
                )}
                {preferenceError && (
                    <PreferenceErrorDialog
                        open={!!preferenceError}
                        message={preferenceError}
                        onClose={handleClosePreferenceError}
                        onSendAnyway={selectedCell?.classId ? () => handleSaveAnyway(selectedCell.classId) : null}
                        isOutsidePreferences={
                            preferenceError?.includes('fora de suas preferências') ||
                            preferenceError?.includes('não está entre suas preferências de dias')
                        }
                    />
                )}
                <DisciplineDeleteDialog
                    open={deleteDialogOpen}
                    onClose={handleCloseDeleteDialog}
                    discipline={selectedDiscipline}
                    classItem={selectedClass}
                    onConfirmDelete={handleConfirmDelete}
                />
                <ObservationsTeacherDialog
                    open={openObservationsDialog}
                    observation={selectedProfessor.observation}
                    professorName={selectedProfessor.name}
                    handleClose={handleCloseObservationsDialog}
                />
                <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 4 } }}>
                    <Typography
                        variant={isMobile ? 'h6' : 'h5'}
                        align="center"
                        sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.2, fontSize: { xs: 18, sm: 25 } }}
                    >
                        Horários Gerados - Planejamento
                    </Typography>
                    <Typography
                        variant={isMobile ? 'body1' : 'h6'}
                        align="center"
                        sx={{ color: '#333', mt: 0.5, fontSize: { xs: 15, sm: 18 } }}
                    >
                        {calendarName}
                    </Typography>
                    <Typography
                        variant={isMobile ? 'body1' : 'h6'}
                        align="center"
                        sx={{ color: 'red', mt: 0.5, fontSize: { xs: 15, sm: 15 } }}
                    >
                        Atenção: Salve os horários de todas as turmas antes de sair para que possam ser publicados posteriormente.
                    </Typography>
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        mb: 3,
                        gap: { xs: 2, sm: 2 },
                        px: { xs: 0, sm: 0 },
                    }}
                >
                    <FilterByShift
                        value={selectedShift}
                        onChange={(newValue) => setSelectedShift(newValue)}
                        sx={{ width: { xs: '100%', sm: '220px' } }}
                    />
                </Box>
                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                        <Typography variant="h6" color="text.secondary">
                            Carregando horários. Aguarde...
                        </Typography>
                    </Box>
                )}
                {!isLoading && daysOfWeek.length === 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '200px',
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant="h6" color="text.secondary">
                            Nenhum dia da semana encontrado.
                        </Typography>
                    </Box>
                )}
                {!isLoading && scheduleData.length === 0 && daysOfWeek.length > 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '200px',
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant="h6" color="text.secondary">
                            Nenhum horário encontrado para este calendário.
                        </Typography>
                    </Box>
                )}
                {!isLoading && scheduleData.length > 0 && daysOfWeek.length > 0 && (
                    <Box>
                        {scheduleData.map((course) => (
                            <CourseClassSection
                                key={course.id}
                                course={course}
                                selectedShift={selectedShift}
                                daysOfWeek={daysOfWeek}
                                hoursData={hoursData}
                                conflicts={conflicts}
                                expandedClasses={expandedClasses}
                                setExpandedClasses={setExpandedClasses}
                                isMobile={isMobile}
                                deleteMode={deleteMode}
                                duplicateMode={duplicateMode}
                                swapMode={swapMode}
                                selectedCell={selectedCell}
                                setSelectedCell={setSelectedCell}
                                selectedSlot={selectedSlot}
                                setSelectedSlot={setSelectedSlot}
                                isLoading={isLoading}
                                isPostCompleted={isPostCompleted}
                                editMode={editMode}
                                pendingChanges={pendingChanges}
                                handleToggleEdit={handleToggleEdit}
                                handleToggleDeleteMode={handleToggleDeleteMode}
                                handleToggleDuplicateMode={handleToggleDuplicateMode}
                                handleCellClick={handleCellClick}
                                handleSaveChanges={handleSaveChanges}
                                mapDisciplinesToGrid={mapDisciplinesToGrid}
                                hasEmptySlots={hasEmptySlots}
                                hasPendingChanges={hasPendingChanges}
                                handleOpenObservationsDialog={handleOpenObservationsDialog}
                            />
                        ))}
                    </Box>
                )}
            </Box>
        </ThemeProvider>
    );
};

export default PreviewGeneratedSchedules;