import React, { useState, useEffect } from 'react';
import {
    Typography, Box, useMediaQuery, useTheme, createTheme, ThemeProvider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Card, CardContent, Divider
} from '@mui/material';
import { School, EventBusy } from '@mui/icons-material';
import api from '../../service/api';
import { getUserId } from '../../service/auth';

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
        MuiTableCell: {
            styleOverrides: {
                root: {
                    padding: '10px',
                    borderBottom: '1px solid #e0e0e0',
                },
                head: {
                    fontWeight: 600,
                    backgroundColor: '#245c28ff',
                    color: '#fff',
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

const TeacherSchedule = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [allAssignments, setAllAssignments] = useState([]);
    const [daysOfWeek, setDaysOfWeek] = useState([]);
    const [hoursData, setHoursData] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const transformHoursData = (apiHours) => {
        const allHours = (apiHours || []).map((hour) => ({
            hourStart: hour.hourStart,
            hourEnd: hour.hourEnd,
            id: hour.id,
            turnId: hour.turn?.id ?? hour.turnId ?? hour.turn,
        }));
        return allHours.sort((a, b) => a.hourStart.localeCompare(b.hourStart));
    };

    const transformApiData = (apiData) => {
        if (!apiData || !Array.isArray(apiData)) {
            return [];
        }

        const assignments = [];
        apiData.forEach((entry) => {
            entry.assignments.forEach((assignment) => {
                const dayMapping = daysOfWeek.find(day => day.name === assignment.day);
                const dayId = dayMapping ? dayMapping.id : assignment.day;

                assignments.push({
                    disciplineId: assignment.disciplineId,
                    disciplineCode: assignment.disciplineCode,
                    disciplineName: assignment.disciplineName,
                    classCode: entry.classCode,
                    courseName: entry.courseName,
                    day: dayId,
                    startTime: assignment.time.hourStart,
                    endTime: assignment.time.hourEnd,
                });
            });
        });

        return assignments;
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setErrorMessage(null);
            try {
                const userId = getUserId();
                if (!userId) {
                    throw new Error('Usuário não autenticado.');
                }
                const [daysResponse, hoursResponse, scheduleResponse] = await Promise.all([
                    api.get('/daysOfWeek'),
                    api.get('/hours'),
                    api.get(`/users/${userId}/schedule`),
                ]);
                const days = (daysResponse.data || []).map((day) => ({
                    name: day.name,
                    id: day.id,
                }));
                setDaysOfWeek(days);
                const transformedHours = transformHoursData(hoursResponse.data || []);
                setHoursData(transformedHours);
                const transformedData = transformApiData(scheduleResponse.data.data || []);
                setAllAssignments(transformedData);
                if (transformedData.length === 0) {
                    setErrorMessage('Nenhum horário encontrado.');
                }
            } catch (error) {
                setErrorMessage(error.message || 'Erro ao carregar dados.');
                setAllAssignments([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const mapAssignmentsToGrid = (assignments) => {
        const grid = {};
        const dayNames = daysOfWeek.map(day => day.name);

        dayNames.forEach((dayName) => {
            grid[dayName] = {};
            hoursData.forEach((slot) => {
                grid[dayName][slot.hourStart] = [];
            });
        });

        assignments.forEach((ass) => {
            const dayName = daysOfWeek.find(day => String(day.id) === String(ass.day))?.name || ass.day;
            if (dayName && hoursData.some(slot => String(slot.hourStart) === String(ass.startTime))) {
                grid[dayName][ass.startTime].push(ass);
            }
        });

        dayNames.forEach((dayName) => {
            hoursData.forEach((slot) => {
                if (grid[dayName][slot.hourStart].length === 0) {
                    grid[dayName][slot.hourStart].push({ disciplineCode: '-', classCode: '', courseName: 'Horário livre' });
                } else if (grid[dayName][slot.hourStart].length > 1) {
                    grid[dayName][slot.hourStart].forEach(ass => {
                        ass.hasConflict = true;
                    });
                }
            });
        });

        return grid;
    };

    const gridData = mapAssignmentsToGrid(allAssignments);

    const disciplineMap = new Map();
    const courseMap = new Map();
    const classMap = new Map();

    allAssignments.forEach((ass) => {
        const disciplineKey = `${ass.disciplineCode}_${ass.disciplineName}`;
        if (!disciplineMap.has(disciplineKey)) {
            disciplineMap.set(disciplineKey, {
                code: ass.disciplineCode,
                description: ass.disciplineName,
            });
        }

        const courseKey = `${ass.courseName}`;
        if (!courseMap.has(courseKey)) {
            const courseCode = ass.classCode.split('-')[1]?.split('-')[0] || ass.courseName.substring(0, 3).toUpperCase();
            courseMap.set(courseKey, {
                code: courseCode,
                name: ass.courseName,
            });
        }

        const classKey = `${ass.classCode}`;
        if (!classMap.has(classKey)) {
            classMap.set(classKey, {
                code: ass.classCode,
            });
        }
    });

    const disciplines = Array.from(disciplineMap.values());
    const courses = Array.from(courseMap.values());
    const classes = Array.from(classMap.values());

    const shifts = [
        { id: 1, name: 'Matutino' },
        { id: 2, name: 'Vespertino' },
        { id: 3, name: 'Noturno' },
    ];
    const hoursByShift = shifts.map(shift => ({
        ...shift,
        hours: hoursData.filter(hour => hour.turnId === shift.id),
    }));

    return (
        <ThemeProvider theme={customTheme}>
            <Box sx={{ mx: { xs: 2, sm: 4 }, mt: { xs: 6, sm: 0 } }}>
                <Typography
                    variant={isMobile ? 'h6' : 'h5'}
                    align="center"
                    sx={{
                        fontWeight: 'bold',
                        color: '#1a3c34',
                        mb: 4,
                        lineHeight: 1.2,
                        fontSize: { xs: 18, sm: 25 },
                    }}
                >
                    Meus Horários
                </Typography>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4 }}>
                        <CircularProgress sx={{ color: '#2e7d32', mr: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            Carregando horários...
                        </Typography>
                    </Box>
                ) : errorMessage || allAssignments.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 6 }}>
                        <EventBusy sx={{ fontSize: 60, color: '#999', mb: 2 }} />
                        <Typography
                            variant="body1"
                            align="center"
                            sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555' }}
                        >
                            Nenhum horário foi encontrado para os calendários ativos.
                        </Typography>
                        <Typography
                            variant="body1"
                            align="center"
                            sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555' }}
                        >
                            Verifique com a Diren se há horários publicados.
                        </Typography>
                    </Box>
                ) : (
                    <Card
                        sx={{
                            p: 2,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f1f8f0ff 100%)',
                            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e8ebe5ff',
                        }}
                    >
                        <CardContent>
                            {hoursByShift.map((shift, index) => (
                                shift.hours.length > 0 && (
                                    <Box key={shift.id} sx={{ mb: 4 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'center' }}>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    color: '#1a3c34',
                                                    fontSize: { xs: '0.9rem', sm: '1rem' },
                                                }}
                                            >
                                                <span style={{ fontWeight: 600 }}>{shift.name}</span>
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ background: 'linear-gradient(to right, #2e7d32, #4caf50)', height: '2px', mb: 2 }} />
                                        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '8px', overflowX: 'auto' }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ color: '#fff', backgroundColor: '#245c28ff', textAlign: 'center', fontWeight: 600 }}>
                                                            Horário
                                                        </TableCell>
                                                        {daysOfWeek.map((day) => (
                                                            <TableCell
                                                                key={day.id}
                                                                align="center"
                                                                sx={{
                                                                    color: '#fff',
                                                                    backgroundColor: '#245c28ff',
                                                                    padding: '10px 10px',
                                                                    minWidth: isMobile ? '100px' : '120px',
                                                                    whiteSpace: 'nowrap',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {day.name}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {shift.hours.map((hour, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell sx={{ fontWeight: 600, color: '#424242', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                                {`${hour.hourStart.substring(0, 5)} - ${hour.hourEnd.substring(0, 5)}`}
                                                            </TableCell>
                                                            {daysOfWeek.map((day) => (
                                                                <TableCell
                                                                    key={day.id}
                                                                    align="center"
                                                                    sx={{
                                                                        border: '1px solid #e0e0e0',
                                                                        whiteSpace: 'nowrap',
                                                                        backgroundColor: (gridData[day.name]?.[hour.hourStart] || []).some(ass => ass.hasConflict) ? '#ffebee' : '#ffffff',
                                                                    }}
                                                                >
                                                                    {(gridData[day.name]?.[hour.hourStart] || []).map((ass, idx) => (
                                                                        ass.disciplineCode === '-' ? (
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
                                                                                    p: 0.5,
                                                                                    borderRadius: '4px',
                                                                                    backgroundColor: ass.hasConflict ? '#ffebee' : '#ffffff',
                                                                                    mb: 0.5,
                                                                                }}
                                                                            >
                                                                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>
                                                                                    {ass.disciplineCode}
                                                                                </Typography>
                                                                                <Typography variant="caption" sx={{ color: '#424242' }}>
                                                                                    {ass.classCode}
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
                                )
                            ))}
                            {(disciplines.length > 0 || courses.length > 0 || classes.length > 0) && (
                                <Box sx={{
                                    mt: 3,
                                    p: 2,
                                    bgcolor: '#f5f5f5',
                                    borderRadius: '8px',
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                                    maxWidth: '100%',
                                    overflowX: isMobile ? 'auto' : 'visible',
                                }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                                        Legenda:
                                    </Typography>
                                    {disciplines.length > 0 && (
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, color: '#333' }}>
                                                Disciplinas:
                                            </Typography>
                                            {disciplines.map((item, index) => (
                                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5, whiteSpace: 'nowrap' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mr: 0.5 }}>
                                                        {item.code}:
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#555' }}>
                                                        {item.description}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                    {courses.length > 0 && (
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, color: '#333' }}>
                                                Cursos:
                                            </Typography>
                                            {courses.map((item, index) => (
                                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5, whiteSpace: 'nowrap' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mr: 0.5 }}>
                                                        {item.code}:
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#555' }}>
                                                        {item.name}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                )}
            </Box>
        </ThemeProvider>
    );
};

export default TeacherSchedule;