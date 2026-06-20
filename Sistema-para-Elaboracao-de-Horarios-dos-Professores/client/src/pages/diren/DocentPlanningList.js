import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography,
    Box,
    useMediaQuery,
    useTheme,
    Divider,
    IconButton,
    Tooltip,
    Button,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Collapse,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import { Group, ExpandMore, ExpandLess } from '@mui/icons-material';
import { AlertMessage } from '../../components/AlertMessage';
import api from '../../service/api';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import FilterByShift from '../../components/FilterByShift';
import FilterByCourse from '../../components/FilterByCourse';
import GenerateScheduleDialog from './GenerateScheduleDialog';
import ObservationsTeacherDialog from '../coordenador/ObservationsTeacherDialog';

const DocentPlanningList = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [selectedShift, setSelectedShift] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [academicData, setAcademicData] = useState([]);
    const [filteredAcademicData, setFilteredAcademicData] = useState([]);
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedClasses, setExpandedClasses] = useState({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [hoursData, setHoursData] = useState({});
    const { calendarId } = useParams();
    const location = useLocation();
    const calendarName = location.state?.calendarName || 'Não Informado';
    const navigate = useNavigate();
    const [hasGeneratedSchedule, setHasGeneratedSchedule] = useState(false);
    const [openObservationsDialog, setOpenObservationsDialog] = useState(false);
    const [selectedProfessor, setSelectedProfessor] = useState({ name: '', observation: '' });

    const formatUserRoleForUrl = (role) => {
        return role ? role.toLowerCase().replace(/ /g, '_') : 'diretor_ensino';
    };

    const userRole = localStorage.getItem('role') || 'diretor_ensino';
    const user = formatUserRoleForUrl(userRole);

    const transformHoursData = (apiHours) => {
        const transformed = {};
        apiHours.forEach((hour) => {
            const turnId = hour.turn.id;
            if (!transformed[turnId]) {
                transformed[turnId] = [];
            }
            transformed[turnId].push({
                id: hour.id,
                hourStart: hour.hourStart,
                hourEnd: hour.hourEnd,
                turnId: hour.turn.id,
            });
        });
        return transformed;
    };

    const fetchPlanningData = useCallback(async () => {
        setLoading(true);
        setAcademicData([]);
        setFilteredAcademicData([]);
        setAlert(null);

        try {
            if (!calendarId) {
                setAlert({ message: "ID do calendário não fornecido.", type: 'error' });
                setLoading(false);
                return;
            }

            const [planningResponse, hoursResponse, hasGeneratedResponse] = await Promise.all([
                api.get(`/coordination/planning/${calendarId}`),
                api.get('/hours'),
                calendarId ? api.get(`/hour-grid/has-generated/${calendarId}`) : Promise.resolve({ data: { result: false } }),
            ]);

            setHasGeneratedSchedule(hasGeneratedResponse.data.result);

            if (planningResponse.data && Array.isArray(planningResponse.data)) {
                const processedData = planningResponse.data.map(courseItem => {
                    const filteredSemesters = courseItem.course.semesters
                        .map(semesterItem => {
                            const sortedDisciplines = [...semesterItem.disciplines].sort((a, b) => {
                                const countA = a.teachersPreferences?.length || 0;
                                const countB = b.teachersPreferences?.length || 0;
                                return countA - countB;
                            });

                            return {
                                ...semesterItem,
                                disciplines: sortedDisciplines
                            };
                        });

                    return {
                        ...courseItem,
                        course: {
                            ...courseItem.course,
                            semesters: filteredSemesters
                        }
                    };
                });

                setAcademicData(processedData);
            } else {
                setAcademicData([]);
            }

            const transformedHours = transformHoursData(hoursResponse.data);
            setHoursData(transformedHours);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAcademicData([]);
            setHoursData({});
            setAlert({ message: "Erro ao carregar dados do planejamento ou horários.", type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [calendarId]);

    useEffect(() => {
        fetchPlanningData();
    }, [fetchPlanningData]);

    useEffect(() => {
        let currentFilteredData = academicData;

        if (selectedCourse) {
            currentFilteredData = currentFilteredData.filter(
                (item) => item.course.id === selectedCourse.id
            );
        }

        if (selectedShift) {
            const lowerCaseSelectedShiftName = selectedShift.name.trim().toLowerCase();

            currentFilteredData = currentFilteredData.map(courseItem => {
                const filteredSemesters = courseItem.course.semesters
                    .map(semesterItem => {
                        const classesForShift = semesterItem.classes.filter(
                            classItem => classItem.turn &&
                                classItem.turn.name &&
                                classItem.turn.name.trim().toLowerCase() === lowerCaseSelectedShiftName
                        );

                        if (classesForShift.length > 0) {
                            return {
                                ...semesterItem,
                                classes: classesForShift,
                            };
                        }
                        return null;
                    })
                    .filter(Boolean);

                if (filteredSemesters.length > 0) {
                    return {
                        ...courseItem,
                        course: {
                            ...courseItem.course,
                            semesters: filteredSemesters
                        }
                    };
                }
                return null;
            }).filter(Boolean);
        }

        setFilteredAcademicData(currentFilteredData);
        const initialExpandedState = {};
        currentFilteredData.forEach(courseData => {
            courseData.course.semesters.forEach(semester => {
                semester.classes.forEach(classItem => {
                    initialExpandedState[classItem.id] = true;
                });
            });
        });
        setExpandedClasses(initialExpandedState);
    }, [academicData, selectedShift, selectedCourse]);

    const handleGenerateSchedule = () => {
        if (filteredAcademicData.length === 0) {
            setAlert({ message: "Nenhum dado encontrado para gerar o horário com os filtros selecionados.", type: 'warning' });
            return;
        }
        setOpenDialog(true);
    };

    const handleCloseAlert = () => {
        setAlert(null);
    };

    const handleToggleExpand = (classId) => {
        setExpandedClasses(prev => ({
            ...prev,
            [classId]: !prev[classId],
        }));
    };

    const handleOpenObservationsDialog = (teacher) => {
        const observation = teacher.prefsDays?.find(day => day.observation?.observation)?.observation?.observation || 'Não há observações.';
        setSelectedProfessor({ name: teacher.name, observation });
        setOpenObservationsDialog(true);
    };

    const handleCloseObservationsDialog = () => {
        setOpenObservationsDialog(false);
        setSelectedProfessor({ name: '', observation: '' });
    };

    const renderProfessorInfo = (teacher) => {
        if (!teacher) return null;

        const preferredDays = teacher.prefsDays && Array.isArray(teacher.prefsDays)
            ? teacher.prefsDays.map(day => day.name).join(', ')
            : 'Nenhum dia preferencial.';

        const hasObservation = teacher.prefsDays && teacher.prefsDays.some(day => day.observation?.observation);

        return (
            <Box display="flex" alignItems="center">
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{teacher.name}</Typography>
                <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <Tooltip
                        title={
                            <Box>
                                <Typography variant="caption" color="inherit">
                                    Dias Preferenciais: {preferredDays}
                                </Typography>
                            </Box>
                        }
                        arrow
                    >
                        <IconButton size="small" sx={{ ml: 0.5, color: '#2e7d32' }}>
                            <InfoOutlinedIcon fontSize="small" onClick={() => handleOpenObservationsDialog(teacher)} />
                        </IconButton>
                    </Tooltip>
                    {hasObservation && (
                        <Box
                            onClick={() => handleOpenObservationsDialog(teacher)}
                            sx={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                width: 13,
                                height: 13,
                                backgroundColor: '#d32f2f',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                            }}
                        >
                            1
                        </Box>
                    )}
                </Box>
            </Box>
        );
    };

    return (
        <Box sx={{ mx: { xs: 2, sm: 4 }, mt: { xs: 6, sm: 0 } }}>
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
                    sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.2 }}
                >
                    Planejamento Docente
                </Typography>
                <Typography
                    variant={isMobile ? 'body1' : 'h6'}
                    align="center"
                    sx={{ color: '#333', mt: 0.5 }}
                >
                    {calendarName}
                </Typography>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    gap: { xs: 2, sm: 2 },
                    px: { xs: 0, sm: 0 },
                    width: '100%',
                }}
            >
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    width: { xs: '100%', sm: 'auto' }
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

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGenerateSchedule}
                    disabled={isGenerating || hasGeneratedSchedule}
                    sx={{
                        height: '40px',
                        backgroundColor: '#2e7d32',
                        '&:hover': { backgroundColor: '#1b5e20' },
                        textTransform: 'none',
                        width: { xs: '100%', sm: '150px' },
                    }}
                >
                    {isGenerating ? <CircularProgress size={24} color="inherit" /> : 'Gerar Horário'}
                </Button>
            </Box>

            <GenerateScheduleDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                calendarName={calendarName}
                calendarId={calendarId}
                user={user}
                fetchPlanningData={fetchPlanningData}
                navigate={navigate}
                setAlert={(alert) => setAlert(alert)}
                setIsGenerating={setIsGenerating}
            />

            <ObservationsTeacherDialog
                open={openObservationsDialog}
                observation={selectedProfessor.observation}
                professorName={selectedProfessor.name}
                handleClose={handleCloseObservationsDialog}
            />

            {loading ? (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '200px',
                        textAlign: 'center',
                    }}
                >
                    <CircularProgress color="primary" />
                    <Typography variant="h6" color="text.secondary" sx={{ ml: 2 }}>
                        Carregando planejamento...
                    </Typography>
                </Box>
            ) : filteredAcademicData.length > 0 ? (
                filteredAcademicData.map((courseData, courseIndex) => (
                    <React.Fragment key={courseData.course.id}>
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
                                <SchoolOutlinedIcon sx={{ mr: 0.5, color: '#2e7d32', fontSize: '1.4rem' }} />
                                <Typography variant="h6" sx={{
                                    color: '#1a3c34',
                                    fontSize: {
                                        xs: '0.9rem',
                                        sm: '1rem',
                                    }
                                }}>
                                    <span style={{ fontWeight: 600 }}>Curso:</span> {courseData.course.name}
                                </Typography>
                            </Box>
                            <Divider sx={{ background: 'linear-gradient(to right, #2e7d32, #4caf50)', height: '2px', mb: 2 }} />

                            {courseData.course.semesters.map((semester) => (
                                <Box key={semester.id} sx={{ mb: 3 }}>
                                    {semester.classes.map((classItem) => (
                                        <Box
                                            key={classItem.id}
                                            sx={{
                                                mb: 3,
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '8px',
                                                p: 2,
                                                bgcolor: '#fdfdfd',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    mb: 1.5,
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => handleToggleExpand(classItem.id)}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Group sx={{ mr: 0.7, color: '#2e7d32', fontSize: '1.3rem' }} />
                                                    <Typography variant="h6" sx={{
                                                        color: '#1a3c34', fontSize: {
                                                            xs: '0.9rem',
                                                            sm: '0.95rem',
                                                        }
                                                    }}>
                                                        <span style={{ fontWeight: 600 }}>Turma:</span> {classItem.code} - {classItem.turn.name}
                                                    </Typography>
                                                </Box>
                                                <IconButton size="small">
                                                    {expandedClasses[classItem.id] ? <ExpandLess /> : <ExpandMore />}
                                                </IconButton>
                                            </Box>
                                            <Collapse in={expandedClasses[classItem.id]} timeout="auto" unmountOnExit>
                                                <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '8px' }}>
                                                    <Table size="small">
                                                        <TableHead sx={{ backgroundColor: '#245c28ff', height: '10px' }}>
                                                            <TableRow sx={{ height: '40px' }}>
                                                                <TableCell sx={{ fontWeight: 'bold', color: '#ffffffff', fontSize: '0.9rem', width: isMobile ? '100%' : '40%' }}>
                                                                    Disciplinas
                                                                </TableCell>
                                                                {!isMobile && (
                                                                    <TableCell sx={{ fontWeight: 'bold', color: '#ffffffff', fontSize: '0.9rem', width: '60%' }}>
                                                                        Professores
                                                                    </TableCell>
                                                                )}
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {semester.disciplines.map((discipline, disciplineIndex) => {
                                                                const isLastDiscipline = disciplineIndex === semester.disciplines.length - 1;
                                                                return (
                                                                    <TableRow
                                                                        key={discipline.id}
                                                                        sx={{
                                                                            '&:last-child td, &:last-child th': { border: 0 },
                                                                            ...(isLastDiscipline && { pb: 2 })
                                                                        }}
                                                                    >
                                                                        {isMobile ? (
                                                                            <TableCell component="th" scope="row" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                                                                <Typography variant="body1" sx={{
                                                                                    fontWeight: 'bold', mb: 0.5, fontSize: {
                                                                                        xs: '0.8rem',
                                                                                        sm: '0.95rem',
                                                                                    }
                                                                                }}>
                                                                                    {discipline.name}
                                                                                </Typography>
                                                                                {discipline.teachersPreferences.length > 0 ? (
                                                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                                                        {discipline.teachersPreferences.map((teacher, teacherIndex) => (
                                                                                            <Box key={teacher.id} sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                                <Typography
                                                                                                    variant="body2"
                                                                                                    sx={{
                                                                                                        fontWeight: 600,
                                                                                                        color: '#2e7d32',
                                                                                                        mr: 0.8,
                                                                                                        fontSize: {
                                                                                                            xs: '0.8rem',
                                                                                                            sm: '0.85rem',
                                                                                                        },
                                                                                                        textTransform: 'uppercase',
                                                                                                        whiteSpace: 'nowrap',
                                                                                                    }}
                                                                                                >
                                                                                                    {teacherIndex + 1}ª opção:
                                                                                                </Typography>
                                                                                                {renderProfessorInfo(teacher)}
                                                                                            </Box>
                                                                                        ))}
                                                                                    </Box>
                                                                                ) : (
                                                                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#666', fontSize: '0.8rem' }}>
                                                                                        Nenhum professor.
                                                                                    </Typography>
                                                                                )}
                                                                            </TableCell>
                                                                        ) : (
                                                                            <>
                                                                                <TableCell component="th" scope="row" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                                                                    {discipline.name}
                                                                                </TableCell>
                                                                                <TableCell sx={{ fontSize: '0.85rem', color: '#333' }}>
                                                                                    {discipline.teachersPreferences.length > 0 ? (
                                                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                                                            {discipline.teachersPreferences.map((teacher, teacherIndex) => (
                                                                                                <Box key={teacher.id} sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32', mr: 0.8, fontSize: '0.8rem' }}>
                                                                                                        {teacherIndex + 1}ª opção:
                                                                                                    </Typography>
                                                                                                    {renderProfessorInfo(teacher)}
                                                                                                </Box>
                                                                                            ))}
                                                                                        </Box>
                                                                                    ) : (
                                                                                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#666', fontSize: '0.8rem' }}>
                                                                                            Nenhum professor.
                                                                                        </Typography>
                                                                                    )}
                                                                                </TableCell>
                                                                            </>
                                                                        )}
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Collapse>
                                        </Box>
                                    ))}
                                </Box>
                            ))}
                        </Box>
                    </React.Fragment>
                ))
            ) : (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                        {selectedShift && !selectedCourse
                            ? "Nenhum planejamento encontrado para o turno selecionado."
                            : !selectedShift && selectedCourse
                                ? "Nenhum planejamento encontrado para o curso selecionado."
                                : "Nenhum planejamento encontrado para os filtros selecionados."}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default DocentPlanningList;