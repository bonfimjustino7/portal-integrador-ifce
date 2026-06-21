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
import { Edit } from '@mui/icons-material';
import api from '../../service/api';
import { getToken } from '../../service/auth';
import SearchInput from '../../components/SearchInput';
import Paginate from '../../components/Paginate';
import AlertMessage from '../../components/AlertMessage';
import RegisterTeacher from './RegisterTeacher';

const TEACHERS_PER_PAGE = 8;

const ActionIconsContainerMobile = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(1),
    gap: theme.spacing(1),
}));

const TeacherList = () => {
    const [teachers, setTeachers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [page, setPage] = useState(1);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchTeachers = async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (token) {
            try {
                const response = await api.get('/users/teachers', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTeachers(response.data);
            } catch (error) {
                console.error('Erro ao buscar professores:', error);
                let errorMessage = 'Erro ao buscar professores.';
                if (error.response && error.response.status === 401) {
                    errorMessage = 'Sessão expirada. Faça login novamente.';
                }
                setAlert({ show: true, message: errorMessage, type: 'error' });
            } finally {
                setLoading(false);
            }
        } else {
            console.warn('Usuário não autenticado.');
            setError('Usuário não autenticado.');
            setAlert({ show: true, message: 'Usuário não autenticado. Faça login novamente.', type: 'warning' });
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const handleOpenDialog = (teacher = null) => {
        setEditingTeacher(teacher);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingTeacher(null);
    };

    const handleTeacherRegistered = () => {
        fetchTeachers();
        handleCloseDialog();
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const handleCloseAlert = () => {
        setAlert({ ...alert, show: false });
    };

    const handleSearchChange = (event) => {
        const value = event.target.value;
        const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
        setSearchTerm(lettersOnly);
        setPage(1);
    };

    const filteredTeachers = teachers.filter((teacher) =>
        teacher.name
            ?.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .includes(
                searchTerm
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
            )
    );

    const totalPages = Math.ceil(filteredTeachers.length / TEACHERS_PER_PAGE);
    const teachersOnCurrentPage = filteredTeachers.slice(
        (page - 1) * TEACHERS_PER_PAGE,
        page * TEACHERS_PER_PAGE
    );

    if (loading) return <Typography variant="body1">Carregando lista de professores...</Typography>;

    return (
        <Box sx={{ mx: { xs: 2, sm: 4 }, mt: { xs: 6, sm: 0 } }}>
            <Typography
                variant={isMobile ? 'h6' : 'h5'}
                gutterBottom
                align="center"
                sx={{ fontWeight: 'bold', color: '#333', mb: { xs: 2, sm: 4 } }}
            >
                Lista de Professores
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
                    onChange={handleSearchChange}
                    placeholder="Buscar professor por nome..."
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
                        width: { xs: '100%', sm: 'auto', marginBottom: '10px' },
                    }}
                >
                    Cadastrar Professor
                </Button>
            </Box>

            {isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredTeachers.length > 0 ? (
                        teachersOnCurrentPage.map((teacher) => (
                            <Card
                                key={teacher.id}
                                sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    bgcolor: '#fdfdfd',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'center' }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: '#1a3c34',
                                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                                textAlign: 'center'
                                            }}
                                        >
                                            <span style={{ fontWeight: 600 }}>Nome:</span> {teacher.name}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ background: 'linear-gradient(to right, #2e7d32, #4caf50)', height: '2px', mb: 2 }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                        <strong>Código do Nome:</strong> {teacher.nameCode}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                        <strong>Email:</strong> {teacher.email}
                                    </Typography>
                                    <ActionIconsContainerMobile>
                                        <Tooltip title="Editar">
                                            <IconButton
                                                aria-label="edit"
                                                sx={{ color: '#2e7d32' }}
                                                onClick={() => handleOpenDialog(teacher)}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                    </ActionIconsContainerMobile>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Typography align="center" variant="h6" color="text.secondary">
                            Nenhum professor encontrado.
                        </Typography>
                    )}
                </Box>
            ) : (
                <Box sx={{ mb: 4 }}>
                    <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '8px' }}>
                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                            <TableHead>
                                <TableRow sx={{ height: '40px' }}>
                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Nome</TableCell>
                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Código do Nome</TableCell>
                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Email</TableCell>
                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTeachers.length > 0 ? (
                                    teachersOnCurrentPage.map((teacher, index) => (
                                        <TableRow
                                            key={teacher.id}
                                            sx={{
                                                backgroundColor: index % 2 === 0 ? '#FFF' : '#F4F7FC',
                                                height: 50,
                                            }}
                                        >
                                            <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{teacher.name}</TableCell>
                                            <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{teacher.nameCode}</TableCell>
                                            <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{teacher.email}</TableCell>
                                            <TableCell align="center" sx={{ py: 0.5 }}>
                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        aria-label="edit"
                                                        sx={{ color: '#2e7d32', p: 0.5 }}
                                                        onClick={() => handleOpenDialog(teacher)}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 2, fontSize: '0.9rem', color: 'text.secondary' }}>
                                            Nenhum professor encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {totalPages > 1 && filteredTeachers.length > 0 && (
                <Paginate count={totalPages} page={page} onChange={handlePageChange} />
            )}

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
            >
                <DialogContent sx={{ p: { xs: 2, sm: 4 } }}>
                    <RegisterTeacher
                        onTeacherRegistered={handleTeacherRegistered}
                        onClose={handleCloseDialog}
                        setAlert={setAlert}
                        teacherData={editingTeacher}
                    />
                </DialogContent>
            </Dialog>

            {alert.show && (
                <AlertMessage message={alert.message} type={alert.type} onClose={handleCloseAlert} />
            )}
        </Box>
    );
};

export default TeacherList;