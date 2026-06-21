import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography,
    Box,
    useMediaQuery,
    useTheme,
    createTheme,
    ThemeProvider,
    Button,
} from '@mui/material';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { AlertMessage } from '../../components/AlertMessage';
import HourDelete from './HourDelete';
import api from '../../service/api';
import FilterByShift from '../../components/FilterByShift';
import FilterByCourse from '../../components/FilterByCourse';
import PublishScheduleDialog from './PublishScheduleDialog';
import PrintConfirmationDialog from './PrintConfirmationDialog';
import CourseClassDisplay from './CourseClassDisplay';
import ChangeProfessorDialog from './ChangeProfessorDialog';
import ObservationsTeacherDialog from '../coordenador/ObservationsTeacherDialog';
import PreferenceErrorDialog from '../../components/PreferenceErrorDialog';
import { handleApiError } from '../../components/handleApiError';
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

const CONFLICT_MESSAGES = {
    same_day: 'O mesmo professor está alocado em mais de uma turma no mesmo horário.',
};

const GeneratedSchedules = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { calendarId } = useParams();
    const { state } = useLocation();
    const calendarName = state?.calendarName || 'Não Informado';
    const navigate = useNavigate();

    const [selectedShift, setSelectedShift] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [scheduleData, setScheduleData] = useState([]);
    const [savedScheduleData, setSavedScheduleData] = useState([]);
    const [daysOfWeek, setDaysOfWeek] = useState([]);
    const [hoursData, setHoursData] = useState({});
    const [shiftsData, setShiftsData] = useState([]);
    const [alert, setAlert] = useState(null);
    const [preferenceError, setPreferenceError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedClasses, setExpandedClasses] = useState({});
    const [swapMode, setSwapMode] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);
    const [pendingChanges, setPendingChanges] = useState([]);
    const [conflicts, setConflicts] = useState([]);
    const [editMode, setEditMode] = useState({});
    const [openPublishDialog, setOpenPublishDialog] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openPrintDialog, setOpenPrintDialog] = useState(false);
    const [openChangeProfessorDialog, setOpenChangeProfessorDialog] = useState(false);
    const [selectedClassCode, setSelectedClassCode] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [currentClassId, setCurrentClassId] = useState(null);
    const [openObservationsDialog, setOpenObservationsDialog] = useState(false);
    const [selectedProfessor, setSelectedProfessor] = useState({ name: '', observation: '' });

    const transformHoursData = (apiHours) => {
        const transformed = {};
        apiHours.forEach((hour) => {
            const turnId = hour.turn.id;
            if (!transformed[turnId]) {
                transformed[turnId] = [];
            }
            transformed[turnId].push({
                hourStart: hour.hourStart,
                hourEnd: hour.hourEnd,
                id: hour.id,
            });
        });
        return transformed;
    };

    const transformApiData = (apiData) => {
        if (!apiData || !Array.isArray(apiData)) return [];

        return apiData.map(course => ({
            id: course.id,
            name: course.name,
            classes: course.classes.map(cls => ({
                id: cls.id,
                code: cls.code,
                name: cls.name,
                turnId: cls.turnId,
                disciplines: cls.disciplines.map(disc => ({
                    id: disc.id,
                    code: disc.code,
                    description: disc.description,
                    professor1: {
                        id: disc.professor1?.id,
                        name: disc.professor1?.name,
                        initials: disc.professor1?.initials || getProfessorInitials(disc.professor1?.name),
                    },
                    day: disc.day,
                    startTime: disc.startTime,
                    endTime: disc.endTime,
                    hasConflict: false,
                    preferences: disc.preferences || [],
                    observation: disc.observation || '',
                    turnId: disc.turnId
                })),
                turnIds: [...new Set(cls.disciplines.map(d => d.turnId).filter(Boolean))]
            }))
        }));
    };

    const handleConflicts = (scheduleData, setConflicts, setAlert, setPreferenceError) => {
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

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setAlert(null);
            setPreferenceError(null);

            try {
                const [daysResponse, shiftsResponse, scheduleResponse, hoursResponse] = await Promise.all([
                    api.get('/daysOfWeek'),
                    api.get('/turns'),
                    calendarId ? api.get(`/hour-grid/view/${calendarId}`) : Promise.resolve(null),
                    api.get('/hours'),
                ]);

                const days = daysResponse.data.map((day) => ({
                    name: day.name,
                    id: day.id,
                }));
                setDaysOfWeek(days);

                const shifts = shiftsResponse.data.map((shift) => ({
                    id: shift.id,
                    name: shift.name,
                }));
                setShiftsData(shifts);

                if (calendarId) {
                    await fetchPublicationStatus(calendarId);
                }

                const transformedHours = transformHoursData(hoursResponse.data);
                setHoursData(transformedHours);

                if (!calendarId) {
                    setAlert({
                        message: 'ID do calendário não fornecido.',
                        type: 'error',
                    });
                    setScheduleData([]);
                    setSavedScheduleData([]);
                } else {
                    const transformedData = transformApiData(scheduleResponse.data);
                    setScheduleData(transformedData);
                    setSavedScheduleData(transformedData);

                    const initialExpandedState = {};
                    const initialEditState = {};
                    const totalClasses = transformedData.reduce((acc, course) => acc + course.classes.length, 0);
                    const maxClassesToExpand = 12;

                    transformedData.forEach((course) => {
                        course.classes.forEach((classItem) => {
                            initialExpandedState[classItem.id] = totalClasses <= maxClassesToExpand;
                            initialEditState[classItem.id] = false;
                        });
                    });
                    setExpandedClasses(initialExpandedState);
                    setEditMode(initialEditState);

                    handleConflicts(transformedData, setConflicts, setAlert, setPreferenceError);

                    if (transformedData.length === 0) {
                        setAlert({
                            message: 'Nenhum horário encontrado para este calendário.',
                            type: 'info',
                        });
                    }
                }
            } catch (error) {
                handleApiError(error, setAlert, setPreferenceError);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [calendarId]);

    const fetchPublicationStatus = async (id) => {
        try {
            const publicationResponse = await api.get(`/hour-grid/has-publication/${id}`);
            setIsPublished(publicationResponse.data.result);
        } catch (error) {
            handleApiError(error, setAlert, setPreferenceError);
        }
    };

    const handleOpenDeleteDialog = () => {
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
    };

    const handleClosePreferenceError = () => setPreferenceError(null);

    const handleHourEntryDeleted = () => {
        navigate('/diretor_ensino/horarios-gerados', {
            state: { message: 'Horário excluído com sucesso.', type: 'success' },
        });
    };

    const handleCloseAlert = () => setAlert(null);

    const handleOpenPrintDialog = () => {
        setOpenPrintDialog(true);
    };

    const handleClosePrintDialog = () => {
        setOpenPrintDialog(false);
    };

    const handleSwapProfessor = (classId) => {
        if (!editMode[classId]) return;
        setSwapMode({ mode: 'professor', classId });
        setSelectedCell(null);
    };

    const handleCellClick = (discipline, classId, day, startTime, classCode) => {
        if (!editMode[classId]) return;

        if (discipline.id === 'unallocated' && !swapMode) {
            return;
        }

        if (discipline.id === 'unallocated' && discipline.isNewShift && !swapMode) {
            handleAddDiscipline(classId, day, startTime);
            return;
        }

        if (!swapMode) {
            setSwapMode({ mode: 'discipline', classId });
            setSelectedCell({ classId, disciplineId: discipline.id, day, startTime, disciplineCode: discipline.code, disciplineName: discipline.description });
        } else if (swapMode.mode === 'discipline' && selectedCell) {
            if (selectedCell.classId === classId && selectedCell.disciplineId === discipline.id && selectedCell.day === day && selectedCell.startTime === startTime) {
                setSwapMode(null);
                setSelectedCell(null);
                return;
            }
            if (selectedCell.classId === classId) {
                handleSwapDiscipline(discipline, day, startTime);
            } else {
                setSwapMode(null);
                setSelectedCell(null);
            }
        } else if (swapMode.mode === 'professor' && swapMode.classId === classId && discipline.id !== 'unallocated') {
            handleChangeProfessor(classId, discipline.id, day, startTime, classCode, discipline.code, discipline.description);
        }
    };

    const handleChangeProfessor = (classId, disciplineId, day, startTime, classCode, disciplineCode, disciplineName) => {
        setSelectedClassCode(classCode);
        setOpenChangeProfessorDialog(true);
        setSelectedCell({ classId, disciplineId, day, startTime, disciplineCode, disciplineName });
    };

    const handleCloseChangeProfessorDialog = () => {
        setOpenChangeProfessorDialog(false);
        setSwapMode(null);
        setSelectedCell(null);
        setSelectedClassCode('');
    };

    const handleSwapDiscipline = (targetDiscipline, targetDay, targetStartTime) => {
        if (!selectedCell) return;

        const { classId, disciplineId: sourceDisciplineId, day: sourceDay, startTime: sourceStartTime } = selectedCell;

        if (sourceDisciplineId === 'unallocated' && targetDiscipline.id === 'unallocated') {
            setAlert({ message: 'Não é possível trocar dois horários vazios.', type: 'warning' });
            setSwapMode(null);
            setSelectedCell(null);
            return;
        }

        setScheduleData((prevData) => {
            return prevData.map((course) => {
                const updatedClasses = course.classes.map((classItem) => {
                    if (classItem.id !== classId) return classItem;
                    const newDisciplines = [...classItem.disciplines];
                    const sourceIndex = newDisciplines.findIndex((d) => d.id === sourceDisciplineId && d.day === sourceDay && d.startTime === sourceStartTime);
                    const targetIndex = newDisciplines.findIndex((d) => d.id === targetDiscipline.id && d.day === targetDay && d.startTime === targetStartTime);

                    if (sourceIndex !== -1 && targetIndex !== -1) {
                        const temp = { ...newDisciplines[sourceIndex] };
                        newDisciplines[sourceIndex] = { ...newDisciplines[sourceIndex], day: newDisciplines[targetIndex].day, startTime: newDisciplines[targetIndex].startTime, endTime: newDisciplines[targetIndex].endTime };
                        newDisciplines[targetIndex] = { ...newDisciplines[targetIndex], day: temp.day, startTime: temp.startTime, endTime: temp.endTime };
                    } else if (sourceIndex !== -1 && targetDiscipline.id === 'unallocated') {
                        const targetEndTime = classItem.turnIds.flatMap((turnId) => hoursData[turnId] || []).find((h) => h.hourStart === targetStartTime)?.hourEnd;
                        newDisciplines[sourceIndex] = { ...newDisciplines[sourceIndex], day: targetDay, startTime: targetStartTime, endTime: targetEndTime };
                    }

                    return { ...classItem, disciplines: newDisciplines };
                });
                return { ...course, classes: updatedClasses };
            });
        });

        setPendingChanges((prev) => [
            ...prev,
            {
                classId,
                disciplineId1: sourceDisciplineId,
                day1: sourceDay,
                startTime1: sourceStartTime,
                disciplineId2: targetDiscipline.id === 'unallocated' ? null : targetDiscipline.id,
                day2: targetDay,
                startTime2: targetStartTime,
            },
        ]);

        handleConflicts(scheduleData, setConflicts, setAlert, setPreferenceError);

        setSwapMode(null);
        setSelectedCell(null);
    };

    const handleAddShiftClick = (event, classId) => {
        setAnchorEl(event.currentTarget);
        setCurrentClassId(classId);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setCurrentClassId(null);
    };

    const handleAddShift = (shiftId) => {
        const selectedShift = shiftsData.find((shift) => shift.id === shiftId);
        if (!selectedShift) {
            setAlert({
                message: 'Turno inválido selecionado.',
                type: 'error',
            });
            handleCloseMenu();
            return;
        }

        setScheduleData((prevData) => {
            const updatedData = prevData.map((course) => ({
                ...course,
                classes: course.classes.map((classItem) => {
                    if (classItem.id === currentClassId) {
                        if (classItem.turnIds.includes(shiftId)) {
                            setAlert({
                                message: `O turno ${selectedShift.name} já está associado a esta turma.`,
                                type: 'warning',
                            });
                            return classItem;
                        }

                        const shiftHours = hoursData[shiftId] || [];
                        const newDisciplines = daysOfWeek.reduce((acc, day) => {
                            const slots = shiftHours.map((slot) => ({
                                id: `unallocated-${slot.id}-${day.id}`,
                                code: '-',
                                description: 'Horário não alocado',
                                professor1: {
                                    id: null,
                                    name: '',
                                    initials: '',
                                },
                                day: day.name,
                                startTime: slot.hourStart,
                                endTime: slot.hourEnd,
                                hasConflict: false,
                                preferences: [],
                                observation: '',
                                turnId: shiftId,
                                isNewShift: true,
                            }));
                            return [...acc, ...slots];
                        }, []);

                        return {
                            ...classItem,
                            turnIds: [...classItem.turnIds, shiftId],
                            disciplines: [...classItem.disciplines, ...newDisciplines],
                        };
                    }
                    return classItem;
                }),
            }));

            handleConflicts(updatedData, setConflicts, setAlert, setPreferenceError);
            return updatedData;
        });

        setPendingChanges((prev) => [
            ...prev,
            {
                classId: currentClassId,
                shiftAdded: selectedShift.name,
            },
        ]);

        handleCloseMenu();
    };

    const handleAddDiscipline = (classId, day, startTime) => {
        setAlert({
            message: `Funcionalidade de adicionar disciplina para ${day} às ${startTime} na turma ${classId} será implementada.`,
            type: 'info',
        });
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

        data.forEach((course) => {
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
                setSwapMode(null);
                setSelectedCell(null);

                setAlert({ message: 'Edição cancelada com sucesso.', type: 'success' });
                const hasConflicts = handleConflicts(savedScheduleData, setConflicts, setAlert, setPreferenceError);
                if (!hasConflicts) {
                    setAlert({ message: 'Edição cancelada com sucesso.', type: 'success' });
                }
            }
            return newEditMode;
        });
    };

    const handleSaveChanges = async (classId) => {
        setIsLoading(true);
        setAlert(null);
        setPreferenceError(null);

        try {
            const classData = scheduleData
                .flatMap((course) => course.classes)
                .find((classItem) => classItem.id === classId);

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
                    courseId: scheduleData.find((course) => course.classes.some((c) => c.id === classId)).id,
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
                                turnId: discipline.turnId,
                            },
                            preferences: discipline.preferences.map((pref) => ({
                                dayId: daysOfWeek.find((day) => day.name === pref.name)?.id,
                                name: pref.name,
                            })),
                        })),
                },
            };

            setSelectedCell((prev) => ({ ...prev, classId }));

            const response = await api.put(`hour-grid/${calendarId}`, payload);

            if (response.data.conflicts) {
                const newConflicts = response.data.conflicts.map((conflict) => ({
                    classId1: classId,
                    disciplineId1: payload.data.assignments.find(
                        (a) => a.day === conflict.day && a.time.hourStart === conflict.hourStart
                    )?.disciplineId,
                    professor: conflict.professorName,
                    day: conflict.day,
                    startTime: conflict.hourStart,
                    type: conflict.type,
                }));
                setConflicts((prev) => [...prev, ...newConflicts]);
            }

            setSavedScheduleData(scheduleData);
            setPendingChanges((prev) => prev.filter((change) => change.classId !== classId));
            setEditMode((prev) => ({ ...prev, [classId]: false }));
            setSwapMode(null);
            setSelectedCell(null);
            setAlert({
                message: `Horários salvos com sucesso para a turma ${classData.code}!`,
                type: 'success',
            });
        } catch (error) {
            handleApiError(error, setAlert, setPreferenceError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAnyway = async (classId) => {
        setIsLoading(true);
        setAlert(null);
        setPreferenceError(null);

        try {
            const classData = scheduleData
                .flatMap((course) => course.classes)
                .find((classItem) => classItem.id === classId);

            if (!classData) {
                setAlert({
                    message: 'Turma não encontrada.',
                    type: 'error',
                });
                setIsLoading(false);
                return;
            }

            const payload = {
                data: {
                    id: classData.semesterId,
                    classId: classData.id,
                    code: classData.code,
                    courseId: scheduleData.find((course) => course.classes.some((c) => c.id === classId)).id,
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
                                turnId: discipline.turnId,
                            },
                            preferences: discipline.preferences.map((pref) => ({
                                dayId: daysOfWeek.find((day) => day.name === pref.name)?.id,
                                name: pref.name,
                            })),
                        })),
                },
            };

            await api.put(`/hour-grid/save-anyway/${calendarId}`, payload);

            setSavedScheduleData(scheduleData);
            setPendingChanges((prev) => prev.filter((change) => change.classId !== classId));
            setEditMode((prev) => ({ ...prev, [classId]: false }));
            setSwapMode(null);
            setSelectedCell(null);
            setAlert({
                message: `Horários salvos com sucesso para a turma ${classData.code}, ignorando preferências!`,
                type: 'success',
            });
            setPreferenceError(null);
        } catch (error) {
            handleApiError(error, setAlert, setPreferenceError);
        } finally {
            setIsLoading(false);
        }
    };

    const mapDisciplinesToGrid = useCallback((disciplines, turnIds) => {
        const grid = {};
        const uniqueDisciplineDetails = {};
        const allHours = turnIds.flatMap((turnId) => hoursData[turnId] || []).sort((a, b) => a.hourStart.localeCompare(b.hourStart));

        const dayNames = new Set(daysOfWeek.map(day => day.name));

        daysOfWeek.forEach((day) => {
            grid[day.name] = {};
            allHours.forEach((slot) => {
                grid[day.name][slot.hourStart] = [];
            });
        });

        const classId = disciplines[0]?.classId;
        const classPendingChanges = pendingChanges.filter(change => change.classId === classId);
        const classConflicts = conflicts.filter(conflict => conflict.classId1 === classId || conflict.classId2 === classId);

        disciplines.forEach((disc) => {
            if (dayNames.has(disc.day)) {
                const matchingSlot = allHours.find((slot) => doTimeRangesOverlap(slot.hourStart, slot.hourEnd, disc.startTime, disc.endTime));
                if (matchingSlot) {
                    const assignedProfessorName = disc.professor1?.name || 'N/A';
                    const assignedProfessorInitials = disc.professor1?.initials || 'N/A';
                    grid[disc.day][matchingSlot.hourStart].push({
                        id: disc.id,
                        code: disc.code,
                        description: disc.description,
                        professorName: assignedProfessorName,
                        professorShort: assignedProfessorInitials,
                        startTime: disc.startTime,
                        endTime: disc.endTime,
                        hasConflict: classConflicts.some((conflict) => (conflict.classId1 === disc.classId || conflict.classId2 === disc.classId) && conflict.disciplineId1 === disc.id && conflict.day === disc.day && doTimeRangesOverlap(conflict.startTime, disc.endTime, disc.startTime, disc.endTime)),
                        preferences: disc.preferences || [],
                        observation: disc.observation || '',
                        turnId: disc.turnId,
                        isNewShift: disc.isNewShift || false,
                    });

                    if (!uniqueDisciplineDetails[disc.code]) {
                        uniqueDisciplineDetails[disc.code] = {
                            description: disc.description,
                            professorName: assignedProfessorName,
                            preferences: disc.preferences || [],
                            observation: disc.observation || '',
                        };
                    }
                }
            }
        });

        daysOfWeek.forEach((day) => {
            allHours.forEach((slot) => {
                if (grid[day.name][slot.hourStart].length === 0) {
                    const turnId = turnIds.find((tid) => (hoursData[tid] || []).some((h) => h.hourStart === slot.hourStart));
                    const shiftName = shiftsData.find((s) => s.id === turnId)?.name;
                    const isNewShift = classPendingChanges.some((change) => change.shiftAdded === shiftName);
                    grid[day.name][slot.hourStart].push({
                        id: 'unallocated',
                        code: '-',
                        description: 'Horário não alocado',
                        professorName: '',
                        professorShort: '',
                        startTime: slot.hourStart,
                        endTime: slot.hourEnd,
                        hasConflict: false,
                        turnId,
                        isNewShift,
                    });
                }
            });
        });

        return { grid, uniqueDisciplineDetails };
    }, [daysOfWeek, hoursData, conflicts, pendingChanges, shiftsData]);

    const handleCollapseToggle = (classId) => {
        setExpandedClasses((prev) => ({
            ...prev,
            [classId]: !prev[classId],
        }));
    };

    const handleOpenPublishDialog = () => {
        setOpenPublishDialog(true);
    };

    const handleClosePublishDialog = () => {
        setOpenPublishDialog(false);
    };

    const handleOpenObservationsDialog = (professorName, observation) => {
        setSelectedProfessor({ name: professorName, observation });
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
                        onSendAnyway={() => handleSaveAnyway(selectedCell?.classId)}
                        isOutsidePreferences={
                            preferenceError.includes('fora de suas preferências') ||
                            preferenceError.includes('não está entre suas preferências de dias')
                        }
                    />
                )}
                <PublishScheduleDialog
                    open={openPublishDialog}
                    onClose={handleClosePublishDialog}
                    calendarName={calendarName}
                    calendarId={calendarId}
                    setAlert={setAlert}
                    setIsLoading={setIsLoading}
                    onPublishSuccess={() => fetchPublicationStatus(calendarId)}
                />
                <HourDelete
                    open={openDeleteDialog}
                    onClose={handleCloseDeleteDialog}
                    calendarId={calendarId}
                    calendarName={calendarName}
                    hourEntry={{ id: calendarId }}
                    onHourEntryDeleted={handleHourEntryDeleted}
                    setAlert={setAlert}
                />
                <PrintConfirmationDialog
                    open={openPrintDialog}
                    onClose={handleClosePrintDialog}
                    scheduleData={scheduleData}
                    daysOfWeek={daysOfWeek}
                    selectedCourse={selectedCourse}
                    selectedShift={selectedShift}
                    calendarName={calendarName}
                    setAlert={setAlert}
                    mapDisciplinesToGrid={mapDisciplinesToGrid}
                    hoursData={hoursData}
                    shiftsData={shiftsData}
                />
                <ObservationsTeacherDialog
                    open={openObservationsDialog}
                    observation={selectedProfessor.observation}
                    professorName={selectedProfessor.name}
                    handleClose={handleCloseObservationsDialog}
                />
                <ChangeProfessorDialog
                    open={openChangeProfessorDialog}
                    onClose={handleCloseChangeProfessorDialog}
                    classId={selectedCell?.classId}
                    disciplineId={selectedCell?.disciplineId}
                    disciplineCode={selectedCell?.disciplineCode}
                    disciplineName={selectedCell?.disciplineName}
                    day={selectedCell?.day}
                    startTime={selectedCell?.startTime}
                    setAlert={setAlert}
                    setScheduleData={setScheduleData}
                    setPendingChanges={setPendingChanges}
                    setConflicts={setConflicts}
                    calendarId={calendarId}
                    className={selectedClassCode}
                    checkConflicts={checkConflicts}
                />
                <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 4 } }}>
                    <Typography
                        variant={isMobile ? 'h6' : 'h5'}
                        align="center"
                        sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.2, fontSize: { xs: 18, sm: 25 } }}
                    >
                        Horários Gerados
                    </Typography>
                    <Typography
                        variant={isMobile ? 'body1' : 'h6'}
                        align="center"
                        sx={{ color: '#333', mt: 0.5, fontSize: { xs: 15, sm: 18 } }}
                    >
                        {calendarName}
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
                        width: '100%',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2,
                            width: { xs: '100%', sm: 'auto' },
                        }}
                    >
                        <FilterByShift
                            value={selectedShift}
                            onChange={(newValue) => setSelectedShift(newValue)}
                            sx={{ width: { xs: '100%', sm: '220px' } }}
                        />
                        <FilterByCourse
                            value={selectedCourse}
                            onChange={(newValue) => setSelectedCourse(newValue)}
                            sx={{ width: { xs: '100%', sm: '400px' } }}
                        />
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2,
                        }}
                    >
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleOpenDeleteDialog}
                            disabled={isLoading || isPublished}
                            sx={{
                                height: '40px',
                                backgroundColor: '#d32f2f',
                                '&:hover': { backgroundColor: '#b71c1c' },
                                textTransform: 'none',
                                width: { xs: '100%', sm: '150px' },
                            }}
                        >
                            Excluir Horários
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleOpenPrintDialog}
                            disabled={isLoading || scheduleData.length === 0}
                            sx={{
                                height: '40px',
                                backgroundColor: '#0288d1',
                                '&:hover': { backgroundColor: '#01579b' },
                                textTransform: 'none',
                                width: { xs: '100%', sm: '150px' },
                            }}
                        >
                            Baixar PDF
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleOpenPublishDialog}
                            disabled={isLoading || isPublished || Object.values(editMode).some((isEditing) => isEditing)}
                            sx={{
                                height: '40px',
                                backgroundColor: '#2e7d32',
                                '&:hover': { backgroundColor: '#1b5e20' },
                                textTransform: 'none',
                                width: { xs: '100%', sm: '150px' },
                            }}
                        >
                            Publicar Horários
                        </Button>
                    </Box>
                </Box>

                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                        <Typography variant="h6" color="text.secondary">
                            Carregando horários...
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

                {!isLoading && daysOfWeek.length > 0 && (
                    <CourseClassDisplay
                        scheduleData={scheduleData}
                        selectedShift={selectedShift}
                        selectedCourse={selectedCourse}
                        daysOfWeek={daysOfWeek}
                        hoursData={hoursData}
                        conflicts={conflicts}
                        pendingChanges={pendingChanges}
                        shiftsData={shiftsData}
                        expandedClasses={expandedClasses}
                        editMode={editMode}
                        selectedCell={selectedCell}
                        swapMode={swapMode}
                        anchorEl={anchorEl}
                        currentClassId={currentClassId}
                        mapDisciplinesToGrid={mapDisciplinesToGrid}
                        handleCollapseToggle={handleCollapseToggle}
                        handleToggleEdit={handleToggleEdit}
                        handleSaveChanges={handleSaveChanges}
                        handleCellClick={handleCellClick}
                        handleAddShiftClick={handleAddShiftClick}
                        handleAddShift={handleAddShift}
                        handleCloseMenu={handleCloseMenu}
                        handleAddDiscipline={handleAddDiscipline}
                        handleSwapProfessor={handleSwapProfessor}
                        handleOpenObservationsDialog={handleOpenObservationsDialog}
                        isLoading={isLoading}
                        isMobile={isMobile}
                    />
                )}
            </Box>
        </ThemeProvider>
    );
};

export default GeneratedSchedules;