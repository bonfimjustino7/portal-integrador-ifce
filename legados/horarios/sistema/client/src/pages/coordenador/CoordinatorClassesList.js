import React, { useState, useEffect } from 'react';
import {
    Typography, Box, useMediaQuery, useTheme, Divider, createTheme, ThemeProvider,
    Grid, Table, TableContainer, TableCell, TableBody, TableHead, TableRow,
    Collapse, IconButton, Paper, Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { SchoolOutlined, Group } from '@mui/icons-material';
import { useParams, useLocation } from 'react-router-dom';
import { AlertMessage } from '../../components/AlertMessage';
import api from '../../service/api';
import { getUserId } from '../../service/auth';
import FilterByShift from '../../components/FilterByShift';

const getProfessorInitials = (name) => {
    if (!name) return 'N/A';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return parts.map(p => p[0]).join('').toUpperCase();
};

const customTheme = createTheme({
    palette: {
        primary: { main: '#2e7d32' },
        background: { default: '#ffffff' },
        text: { primary: '#212121', secondary: '#757575' },
    },
    components: {
        MuiCard: { styleOverrides: { root: { borderRadius: 8, border: '1px solid #408349', backgroundColor: '#ffffff' } } },
        MuiTableCell: {
            styleOverrides: {
                root: { padding: '10px', borderBottom: '1px solid #e0e0e0' },
                head: { fontWeight: 600, backgroundColor: '#f5f5f5' },
            },
        },
        MuiTypography: { styleOverrides: { root: { color: '#212121' } } },
    },
});

const CoordinatorClassesList = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { calendarId } = useParams();
    const { state } = useLocation();
    const calendarName = state?.calendarName || 'Não Informado';

    const [selectedShift, setSelectedShift] = useState(null);
    const [scheduleData, setScheduleData] = useState([]);
    const [daysOfWeek, setDaysOfWeek] = useState([]);
    const [hoursData, setHoursData] = useState({});
    const [alert, setAlert] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedClasses, setExpandedClasses] = useState({});

    const transformHoursData = (apiHours) => {
        const transformed = {};
        const allHours = [];
        apiHours.forEach((hour) => {
            const turnId = hour.turn.id;
            if (!transformed[turnId]) {
                transformed[turnId] = [];
            }
            const hourEntry = {
                hourStart: hour.hourStart,
                hourEnd: hour.hourEnd,
                id: hour.id,
                turnId: turnId,
                turnName: hour.turn.name,
            };
            transformed[turnId].push(hourEntry);
            allHours.push(hourEntry);
        });

        allHours.sort((a, b) => a.hourStart.localeCompare(b.hourStart));
        transformed['all'] = allHours;
        return transformed;
    };

    const transformApiData = (apiData) => {
        if (!apiData || !apiData.courses) return [];

        const coursesMap = {};

        apiData.courses.forEach(course => {
            if (!coursesMap[course.id]) {
                coursesMap[course.id] = {
                    courseId: course.id,
                    name: course.name,
                    semesters: {}
                };
            }

            course.classes.forEach(cls => {
                const semesterKey = cls.id;

                coursesMap[course.id].semesters[semesterKey] = {
                    classId: cls.id,
                    code: cls.code,
                    assignments: cls.lessons.map(lesson => ({
                        disciplineId: lesson.discipline.id,
                        disciplineCode: lesson.discipline.code,
                        disciplineName: lesson.discipline.name,
                        professorName: lesson.teacher.name,
                        professorId: lesson.teacher.id,
                        professorNameCode: lesson.teacher.nameCode,
                        observation: lesson.teacher.prefsDays?.find(pref => pref.id === lesson.day.id)?.preferencesDay?.observation || '',
                        day: lesson.day.name,
                        time: lesson.hour,
                        preferences: lesson.teacher.prefsDays?.map(pref => ({
                            dayId: pref.id,
                            name: pref.name,
                            observation: pref.preferencesDay?.observation || ''
                        })) || [],
                    }))
                };
            });
        });

        return Object.values(coursesMap).map(course => ({
            id: course.courseId,
            name: course.name,
            classes: Object.entries(course.semesters).map(([semesterKey, semester]) => ({
                id: semester.classId,
                name: `Turma ${semester.code}`,
                code: semester.code,
                disciplines: semester.assignments.map(assignment => ({
                    id: assignment.disciplineId,
                    code: assignment.disciplineCode,
                    description: assignment.disciplineName,
                    professor1: {
                        id: assignment.professorId,
                        name: assignment.professorName,
                        initials: assignment.professorNameCode || getProfessorInitials(assignment.professorName),
                    },
                    day: assignment.day,
                    startTime: assignment.time?.hourStart,
                    endTime: assignment.time?.hourEnd,
                    preferences: assignment.preferences || [],
                    observation: assignment.observation || '',
                    turnId: assignment.time?.turnId,
                })),
                turnId: semester.assignments[0]?.time?.turnId,
            }))
        }));
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setAlert(null);

            try {
                const userId = getUserId();
                if (!userId) {
                    throw new Error('Usuário não autenticado.');
                }
                const [daysResponse, scheduleResponse, hoursResponse] = await Promise.all([
                    api.get('/daysOfWeek'),
                    calendarId ? api.get(`/users/teaching-plan/${userId}/${calendarId}`) : Promise.resolve(null),
                    api.get('/hours').catch(() => ({ data: [] })),
                ]);

                const days = daysResponse.data.map((day) => ({
                    name: day.name,
                    id: day.id,
                }));
                setDaysOfWeek(days);

                const transformedHours = transformHoursData(hoursResponse.data || []);
                setHoursData(transformedHours);

                if (!calendarId) {
                    setAlert({
                        message: 'ID do calendário não fornecido.',
                        type: 'error',
                    });
                    setScheduleData([]);
                } else {
                    const transformedData = transformApiData(scheduleResponse.data);
                    setScheduleData(transformedData);

                    const initialExpandedState = {};
                    transformedData.forEach((course) => {
                        course.classes.forEach((classItem) => {
                            initialExpandedState[classItem.id] = true;
                        });
                    });
                    setExpandedClasses(initialExpandedState);

                    if (transformedData.length === 0) {
                        setAlert({
                            message: 'Nenhum horário encontrado para este calendário.',
                            type: 'info',
                        });
                    }
                }
            } catch (error) {

            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [calendarId]);

    const handleCloseAlert = () => setAlert(null);

    const doTimeRangesOverlap = (start1, end1, start2, end2) => {
        const dateString = '2000-01-01T';
        const d1Start = new Date(dateString + start1);
        const d1End = new Date(dateString + end1);
        const d2Start = new Date(dateString + start2);
        const d2End = new Date(dateString + end2);
        return d1Start < d2End && d2Start < d1End;
    };

    const mapDisciplinesToGrid = (disciplines) => {
        const grid = {};
        const uniqueDisciplineDetails = {};

        const activeTurnIds = [...new Set(disciplines.map(disc => disc.turnId))];

        const filteredDisciplines = selectedShift
            ? disciplines.filter(disc => disc.turnId === selectedShift.id)
            : disciplines;

        let currentTurnHours = [];
        if (selectedShift) {
            currentTurnHours = hoursData[selectedShift.id] || [];
        } else {
            activeTurnIds.forEach(turnId => {
                if (hoursData[turnId]) {
                    currentTurnHours.push(...hoursData[turnId]);
                }
            });
            currentTurnHours.sort((a, b) => a.hourStart.localeCompare(b.hourStart));
        }

        daysOfWeek.forEach((day) => {
            grid[day.name] = {};
            currentTurnHours.forEach((slot) => {
                grid[day.name][slot.hourStart] = [];
            });
        });

        filteredDisciplines.forEach((disc) => {
            if (daysOfWeek.map(day => day.name).includes(disc.day)) {
                const matchingSlot = currentTurnHours.find((slot) =>
                    doTimeRangesOverlap(slot.hourStart, slot.hourEnd, disc.startTime, disc.endTime)
                );
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
                        preferences: disc.preferences || [],
                        observation: disc.observation || '',
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
            currentTurnHours.forEach((slot) => {
                if (grid[day.name][slot.hourStart].length === 0) {
                    grid[day.name][slot.hourStart].push({
                        id: 'unallocated',
                        code: '-',
                        description: 'Horário não alocado',
                        professorName: '',
                        professorShort: '',
                        startTime: slot.hourStart,
                        endTime: slot.hourEnd,
                    });
                }
            });
        });

        return { grid, uniqueDisciplineDetails, currentTurnHours };
    };

    const renderProfessorInfo = (professorName, preferences, observation) => {
        if (!professorName) return null;

        const preferredDays = preferences && Array.isArray(preferences)
            ? preferences.map(day => day.name).join(', ')
            : 'Nenhum dia preferencial.';

        return (
            <>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', mr: 0.5, whiteSpace: 'nowrap' }}>
                    - Prof. {professorName}
                </Typography>
                <Tooltip
                    title={
                        <Box>
                            <Typography variant="caption" color="inherit">
                                Observações: {observation || 'Não há observações.'}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="inherit">
                                Dias Preferenciais: {preferredDays}
                            </Typography>
                        </Box>
                    }
                    arrow
                >
                    <IconButton size="small" sx={{ verticalAlign: 'middle' }}>
                        <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </>
        );
    };

    const handleCollapseToggle = (classId) => {
        setExpandedClasses((prev) => ({
            ...prev,
            [classId]: !prev[classId],
        }));
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

                <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 4 } }}>
                    <Typography
                        variant={isMobile ? 'h6' : 'h5'}
                        align="center"
                        sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.2, fontSize: { xs: 18, sm: 25 } }}
                    >
                        Horários do Curso
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
                        justifyContent: 'flex-start',
                        mb: 3,
                        gap: { xs: 2, sm: 2 },
                        px: { xs: 0, sm: 0 },
                        width: '100%',
                    }}
                >
                    <FilterByShift
                        value={selectedShift}
                        onChange={(newValue) => setSelectedShift(newValue)}
                        sx={{ width: { xs: '100%', sm: '220px' } }}
                    />
                </Box>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                        <Typography variant="h6" color="text.secondary">
                            Carregando horários...
                        </Typography>
                    </Box>
                ) : daysOfWeek.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 6 }}>
                        <Typography
                            variant="body1"
                            align="center"
                            sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555' }}
                        >
                            Nenhum dia da semana encontrado.
                        </Typography>
                        <Typography
                            variant="body1"
                            align="center"
                            sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555' }}
                        >
                            Verifique a configuração do calendário.
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        {scheduleData.length === 0 ? (
                            <Box sx={{ textAlign: 'center', mt: 6 }}>
                                <Typography
                                    variant="body1"
                                    align="center"
                                    sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555' }}
                                >
                                    Nenhum horário encontrado para este calendário.
                                </Typography>
                                <Typography
                                    variant="body1"
                                    align="center"
                                    sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555' }}
                                >
                                    Verifique se há horários publicados disponíveis.
                                </Typography>
                            </Box>
                        ) : (
                            (() => {
                                const filteredData = scheduleData;
                                const hasClasses = filteredData.some((course) =>
                                    selectedShift
                                        ? course.classes.some((classItem) =>
                                            classItem.disciplines.some((disc) => disc.turnId === selectedShift.id)
                                        )
                                        : course.classes.length > 0
                                );

                                if (!hasClasses) {
                                    return (
                                        <Box sx={{ textAlign: 'center', mt: 6 }}>
                                            <Typography
                                                variant="body1"
                                                align="center"
                                                sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555' }}
                                            >
                                                {selectedShift
                                                    ? 'Nenhum horário encontrado para o turno selecionado.'
                                                    : 'Nenhum horário encontrado para o curso.'}
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                align="center"
                                                sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555' }}
                                            >
                                                Verifique se há horários publicados disponíveis.
                                            </Typography>
                                        </Box>
                                    );
                                }

                                return (
                                    <Box>
                                        {filteredData.map((course) => {
                                            const filteredClasses = selectedShift
                                                ? course.classes.filter((classItem) =>
                                                    classItem.disciplines.some((disc) => disc.turnId === selectedShift.id)
                                                )
                                                : course.classes;

                                            if (filteredClasses.length === 0) {
                                                return null;
                                            }

                                            return (
                                                <React.Fragment key={course.id}>
                                                    <Box
                                                        sx={{
                                                            mb: 4,
                                                            p: 2,
                                                            borderRadius: '12px',
                                                            background: 'linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%)',
                                                            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <SchoolOutlined sx={{ mr: 0.5, color: '#2e7d32', fontSize: '1.4rem' }} />
                                                            <Typography
                                                                variant="h6"
                                                                sx={{
                                                                    color: '#1a3c34',
                                                                    fontSize: { xs: '0.9rem', sm: '1rem' },
                                                                }}
                                                            >
                                                                <span style={{ fontWeight: 600 }}>Curso:</span> {course.name}
                                                            </Typography>
                                                        </Box>
                                                        <Divider sx={{ background: 'linear-gradient(to right, #2e7d32, #4caf50)', height: '2px', mb: 2 }} />

                                                        <Grid container spacing={3} direction="column">
                                                            {filteredClasses.map((classItem) => {
                                                                const { grid: classScheduleGrid, uniqueDisciplineDetails, currentTurnHours } =
                                                                    mapDisciplinesToGrid(classItem.disciplines);
                                                                const disciplineLegend = Object.entries(uniqueDisciplineDetails).map(
                                                                    ([code, details]) => ({
                                                                        code,
                                                                        description: details.description,
                                                                        professorName: details.professorName,
                                                                        preferences: details.preferences,
                                                                        observation: details.observation,
                                                                    })
                                                                );
                                                                const isExpanded = expandedClasses[classItem.id] || false;

                                                                return (
                                                                    <Grid key={classItem.id}>
                                                                        <Box
                                                                            sx={{
                                                                                mb: 1,
                                                                                border: '1px solid #e0e0e0',
                                                                                borderRadius: '8px',
                                                                                p: 2,
                                                                                bgcolor: '#fdfdfd',
                                                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                                                                width: isMobile ? '100%' : 'auto',
                                                                                maxWidth: isMobile ? '280px' : 'none',
                                                                                transition: 'all 0.3s ease',
                                                                            }}
                                                                        >
                                                                            <Box
                                                                                sx={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'space-between',
                                                                                    mb: 1.5,
                                                                                }}
                                                                            >
                                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                    <Group sx={{ mr: 0.7, color: '#2e7d32', fontSize: '1.3rem' }} />
                                                                                    <Typography
                                                                                        variant="h6"
                                                                                        sx={{
                                                                                            color: '#1a3c34',
                                                                                            fontSize: { xs: '0.9rem', sm: '0.95rem' },
                                                                                        }}
                                                                                    >
                                                                                        <span style={{ fontWeight: 600 }}>Turma:</span> {classItem.code}
                                                                                    </Typography>
                                                                                </Box>
                                                                                <IconButton
                                                                                    onClick={() => handleCollapseToggle(classItem.id)}
                                                                                    sx={{
                                                                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                                        transition: 'transform 0.3s ease-in-out',
                                                                                        color: '#2e7d32',
                                                                                    }}
                                                                                >
                                                                                    <ExpandMoreIcon />
                                                                                </IconButton>
                                                                            </Box>
                                                                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                                                <Box sx={{ paddingTop: '20px', borderTop: '1px solid #a5d6a7' }}>
                                                                                    <Box sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                                                                        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '8px' }}>
                                                                                            <Table size="small">
                                                                                                <TableHead>
                                                                                                    <TableRow>
                                                                                                        <TableCell
                                                                                                            sx={{
                                                                                                                color: '#fff',
                                                                                                                backgroundColor: '#245c28ff',
                                                                                                                textAlign: 'center',
                                                                                                            }}
                                                                                                        >
                                                                                                            Horário
                                                                                                        </TableCell>
                                                                                                        {daysOfWeek.map((day) => (
                                                                                                            <TableCell
                                                                                                                key={day.name}
                                                                                                                align="center"
                                                                                                                sx={{
                                                                                                                    color: '#fff',
                                                                                                                    backgroundColor: '#245c28ff',
                                                                                                                    padding: '10px 10px',
                                                                                                                    flex: 1,
                                                                                                                    minWidth: '120px',
                                                                                                                    whiteSpace: 'nowrap',
                                                                                                                }}
                                                                                                            >
                                                                                                                {day.name}
                                                                                                            </TableCell>
                                                                                                        ))}
                                                                                                    </TableRow>
                                                                                                </TableHead>
                                                                                                <TableBody>
                                                                                                    {currentTurnHours.map((slot, index) => (
                                                                                                        <TableRow key={index}>
                                                                                                            <TableCell sx={{ fontWeight: 600, color: '#424242', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                                                                                {`${slot.hourStart.substring(0, 5)} - ${slot.hourEnd.substring(0, 5)}`}
                                                                                                            </TableCell>
                                                                                                            {daysOfWeek.map((day) => (
                                                                                                                <TableCell
                                                                                                                    key={day.name}
                                                                                                                    align="center"
                                                                                                                    sx={{
                                                                                                                        bgcolor: '#ffffff',
                                                                                                                        border: '1px solid #e0e0e0',
                                                                                                                        whiteSpace: 'nowrap',
                                                                                                                    }}
                                                                                                                >
                                                                                                                    {classScheduleGrid[day.name][slot.hourStart]?.map((disc, idx) => (
                                                                                                                        disc.id === 'unallocated' ? (
                                                                                                                            <Typography key={idx} variant="body2" sx={{ color: '#757575', fontStyle: 'italic' }}>
                                                                                                                                -
                                                                                                                            </Typography>
                                                                                                                        ) : (
                                                                                                                            <Box
                                                                                                                                key={idx}
                                                                                                                                sx={{
                                                                                                                                    display: 'flex',
                                                                                                                                    flexDirection: 'column',
                                                                                                                                    alignItems: 'center',
                                                                                                                                    justifyContent: 'center',
                                                                                                                                    p: 0.5,
                                                                                                                                    borderRadius: '4px',
                                                                                                                                    backgroundColor: '#ffffff',
                                                                                                                                    mb: 0.5,
                                                                                                                                }}
                                                                                                                            >
                                                                                                                                <Tooltip title={`${disc.description} - Prof. ${disc.professorName}`}>
                                                                                                                                    <Typography
                                                                                                                                        variant="caption"
                                                                                                                                        sx={{ fontWeight: 'bold', color: '#1b5e20' }}
                                                                                                                                    >
                                                                                                                                        {disc.code}
                                                                                                                                    </Typography>
                                                                                                                                </Tooltip>
                                                                                                                                <Typography
                                                                                                                                    variant="caption"
                                                                                                                                    sx={{ color: '#424242' }}
                                                                                                                                >
                                                                                                                                    {disc.professorShort}
                                                                                                                                </Typography>
                                                                                                                            </Box>
                                                                                                                        )
                                                                                                                    ))}
                                                                                                                </TableCell>
                                                                                                            ))}
                                                                                                        </TableRow>
                                                                                                    ))}
                                                                                                </TableBody>
                                                                                            </Table>
                                                                                        </TableContainer>
                                                                                    </Box>
                                                                                    {disciplineLegend.length > 0 && (
                                                                                        <Box sx={{ mt: 3, bgcolor: '#f5f5f5', borderRadius: '8px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                                                                                            <Box sx={{ p: 2, overflowX: 'auto', maxWidth: '100%' }}>
                                                                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                                                                                                    Legenda:
                                                                                                </Typography>
                                                                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                                                                    {disciplineLegend.map((item, index) => (
                                                                                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                                                                                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mr: 0.5 }}>
                                                                                                                {item.code}:
                                                                                                            </Typography>
                                                                                                            <Typography variant="body2" sx={{ color: '#555', mr: 1 }}>
                                                                                                                {item.description}
                                                                                                            </Typography>
                                                                                                            {renderProfessorInfo(item.professorName, item.preferences, item.observation)}
                                                                                                        </Box>
                                                                                                    ))}
                                                                                                </Box>
                                                                                            </Box>
                                                                                        </Box>
                                                                                    )}
                                                                                </Box>
                                                                            </Collapse>
                                                                        </Box>
                                                                    </Grid>
                                                                );
                                                            })}
                                                        </Grid>
                                                    </Box>
                                                </React.Fragment>
                                            );
                                        })}
                                    </Box>
                                );
                            })()
                        )}
                    </Box>
                )}
            </Box>
        </ThemeProvider>
    );
};

export default CoordinatorClassesList;