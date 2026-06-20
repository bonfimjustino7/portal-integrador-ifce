import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Paper,
    IconButton,
    Button,
    Box,
    useMediaQuery,
    useTheme,
    Dialog,
    DialogContent,
    Card,
    CardContent,
    styled,
    Divider,
    Tooltip,
} from '@mui/material';
import { Edit, Delete, School } from '@mui/icons-material';
import api from '../../service/api';
import { getToken } from '../../service/auth';
import SearchInput from '../../components/SearchInput';
import RegisterCourse from './RegisterCourse';
import AlertMessage from '../../components/AlertMessage';
import CourseDelete from './CourseDelete';

const ActionIconsContainerMobile = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(1),
}));

const CourseList = () => {
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchCourses = async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (token) {
            try {
                const response = await api.get('/courses', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCourses(response.data);
            } catch (error) {
                console.error('Erro ao buscar cursos:', error);
                setError('Erro ao carregar a lista de cursos.');
                setAlert({ show: true, message: 'Erro ao carregar a lista de cursos.', type: 'error' });
            } finally {
                setLoading(false);
            }
        } else {
            console.warn('Usuário não autenticado.');
            setError('Usuário não autenticado.');
            setAlert({ show: true, message: 'Usuário não autenticado.', type: 'warning' });
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleOpenDialog = (course = null) => {
        setEditingCourse(course);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCourse(null);
    };

    const handleCourseCreated = () => {
        fetchCourses();
        handleCloseDialog();
    };

    const handleCourseUpdated = () => {
        fetchCourses();
        handleCloseDialog();
    };

    const handleOpenDeleteDialog = (course) => {
        setCourseToDelete(course);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setCourseToDelete(null);
    };

    const handleCourseDeleted = () => {
        fetchCourses();
        handleCloseDeleteDialog();
    };

    const handleCloseAlert = () => {
        setAlert({ ...alert, show: false });
    };

    const getCoordinatorName = (course) => {
        return course.coordinator ? course.coordinator.name : 'Não informado';
    };

    const normalizeString = (str) => {
        if (typeof str !== 'string') return '';
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    const filteredCourses = courses.filter((course) => {
        const normalizedSearchTerm = normalizeString(searchTerm);
        const nameMatches = normalizeString(course.name).includes(normalizedSearchTerm);

        return nameMatches;
    });

    const groupedCourses = filteredCourses.reduce((acc, course) => {
        const key = course.typeLearn?.name;
        if (!acc[key]) {
            acc[key] = {
                typeLearn: key,
                courses: [],
            };
        }
        acc[key].courses.push(course);
        return acc;
    }, {});

    const groupedCoursesArray = Object.values(groupedCourses).sort((a, b) =>
        a.typeLearn.localeCompare(b.typeLearn)
    );

    if (loading) return <Typography variant="body1">Carregando lista de cursos...</Typography>;

    return (
        <Box sx={{ mx: { xs: 2, sm: 4 }, mt: { xs: 6, sm: 0 } }}>
            <Typography
                variant={isMobile ? 'h6' : 'h5'}
                gutterBottom
                align="center"
                sx={{ fontWeight: 'bold', color: '#333', mb: { xs: 2, sm: 4 } }}
            >
                Lista de Cursos
            </Typography>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    gap: 2,
                }}
            >
                <SearchInput
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar curso por nome..."
                    sx={{ width: { xs: '100%', sm: 'auto', maxWidth: 400 } }}
                />
                <Button
                    variant="contained"
                    onClick={() => handleOpenDialog(null)}
                    sx={{
                        height: '40px',
                        backgroundColor: '#2e7d32',
                        '&:hover': { backgroundColor: '#1b5e20' },
                        textTransform: 'none',
                        width: { xs: '100%', sm: 'auto' },
                    }}
                >
                    Cadastrar Curso
                </Button>
            </Box>

            {isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {groupedCoursesArray.length > 0 ? (
                        groupedCoursesArray.map((group, groupIndex) => (
                            <Card
                                key={groupIndex}
                                sx={{
                                    mb: 4,
                                    p: 2,
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f1f8f0ff 100%)',
                                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: '#1a3c34',
                                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                            }}
                                        >
                                            <span style={{ fontWeight: 600 }}>Modalidade:</span> {group.typeLearn}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ background: 'linear-gradient(to right, #2e7d32, #4caf50)', height: '2px', mb: 2 }} />
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {group.courses.map((course) => (
                                            <Card
                                                key={course.id}
                                                sx={{
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: '8px',
                                                    bgcolor: '#fdfdfd',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                                }}
                                            >
                                                <CardContent>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            color: '#1a3c34',
                                                            fontSize: { xs: '0.9rem', sm: '0.95rem' }
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: 600 }}>Nome:</span> {course.name}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                                        <strong>Código:</strong> {course.code}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                                        <strong>Semestres:</strong> {course.duration}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                                        <strong>Coordenador:</strong> {getCoordinatorName(course)}
                                                    </Typography>
                                                    <ActionIconsContainerMobile>
                                                        <Tooltip title="Editar">
                                                            <IconButton
                                                                aria-label="edit"
                                                                sx={{ color: '#2e7d32' }}
                                                                onClick={() => handleOpenDialog(course)}
                                                            >
                                                                <Edit />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Excluir">
                                                            <IconButton
                                                                aria-label="delete"
                                                                sx={{ color: '#d32f2f' }}
                                                                onClick={() => handleOpenDeleteDialog(course)}
                                                            >
                                                                <Delete />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </ActionIconsContainerMobile>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Typography align="center" variant="h6" color="text.secondary">
                            Nenhum curso encontrado.
                        </Typography>
                    )}
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {groupedCoursesArray.length > 0 ? (
                        groupedCoursesArray.map((group, groupIndex) => (
                            <Card
                                key={groupIndex}
                                sx={{
                                    mb: 4,
                                    p: 1,
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f1f8f0ff 100%)',
                                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                                    border: '1px solid #e8ebe5ff',
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: '#1a3c34',
                                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                            }}
                                        >
                                            <span style={{ fontWeight: 600 }}>Modalidade:</span> {group.typeLearn}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ background: 'linear-gradient(to right, #2e7d32, #4caf50)', height: '2px', mb: 2 }} />
                                    <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '8px' }}>
                                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                                            <TableHead>
                                                <TableRow sx={{ height: '40px' }}>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Nome</TableCell>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Código</TableCell>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Semestres</TableCell>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Coordenador</TableCell>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Ações</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {group.courses.map((course, index) => (
                                                    <TableRow
                                                        key={course.id}
                                                        sx={{
                                                            backgroundColor: index % 2 === 0 ? '#FFF' : '#F4F7FC',
                                                            height: 50,
                                                        }}
                                                    >
                                                        <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{course.name}</TableCell>
                                                        <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{course.code}</TableCell>
                                                        <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{course.duration}</TableCell>
                                                        <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{getCoordinatorName(course)}</TableCell>
                                                        <TableCell align="center" sx={{ py: 0.5 }}>
                                                            <Tooltip title="Editar">
                                                                <IconButton
                                                                    aria-label="edit"
                                                                    sx={{ color: '#2e7d32', p: 0.5 }}
                                                                    onClick={() => handleOpenDialog(course)}
                                                                >
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Excluir">
                                                                <IconButton
                                                                    aria-label="delete"
                                                                    sx={{ color: '#d32f2f', p: 0.5 }}
                                                                    onClick={() => handleOpenDeleteDialog(course)}
                                                                >
                                                                    <Delete fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Typography align="center" variant="h6" color="text.secondary">
                            Nenhum curso encontrado.
                        </Typography>
                    )}
                </Box>
            )}

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                fullWidth
                maxWidth={isMobile ? 'xs' : 'sm'}
                sx={{
                    '& .MuiDialog-paper': {
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        width: { xs: '90%', sm: '100%' },
                        margin: { xs: 2, sm: 4 },
                    },
                }}
            >
                <DialogContent sx={{ p: { xs: 2, sm: 4 } }}>
                    <RegisterCourse
                        initialCourse={editingCourse}
                        onCourseUpdated={handleCourseUpdated}
                        onCourseCreated={handleCourseCreated}
                        onClose={handleCloseDialog}
                        setAlert={setAlert}
                    />
                </DialogContent>
            </Dialog>

            <CourseDelete
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                course={courseToDelete}
                onCourseDeleted={handleCourseDeleted}
                setAlert={setAlert}
            />

            {alert.show && (
                <AlertMessage message={alert.message} type={alert.type} onClose={handleCloseAlert} />
            )}
        </Box>
    );
};

export default CourseList;