import React, { useState, useEffect } from 'react';
import {
    Typography,
    Button,
    Box,
    useMediaQuery,
    useTheme,
    Grid,
    Card,
    CardContent,
    Slide,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    CalendarMonthOutlined,
    AccessTimeOutlined,
    Person,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Paginate from '../../components/Paginate';
import AlertMessage from '../../components/AlertMessage';
import FilterAcademicYear from '../../components/FilterAcademicYear';
import api from '../../service/api';
import { getUserId } from '../../service/auth';
import TeachingPlanningDelete from './TeachingPlanningDelete';

const PLANNINGS_PER_PAGE = 8;

const CustomPlanningCard = ({ children, onClick, ...props }) => {
    const theme = useTheme();
    return (
        <Card
            onClick={onClick}
            sx={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: theme.shape.borderRadius * 0.5,
                marginBottom: '15px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '205px',
                transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                '&:hover': {
                    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)',
                    transform: 'translateY(-5px)',
                },
            }}
            {...props}
        >
            {children}
        </Card>
    );
};

const TeacherPlanningList = () => {
    const [plannings, setPlannings] = useState([]);
    const [searchTerm, setSearchTerm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [planningToDeleteInfo, setPlanningToDeleteInfo] = useState(null);

    const fetchPlannings = async () => {
        setLoading(true);
        setError(null);
        try {
            let response = await api.get(`classes/coordinator/${getUserId()}/planning`);
            const planningData = response.data.map(classes => ({
                id: classes.id,
                class: `S${classes.semester}${classes.type ? `-${classes.type}` : ''}`,
                shift: classes.turn.name,
                date: new Date(classes.createdAt).toLocaleDateString('pt-br'),
                academicYear: classes.calendar.name.split('-')[0].trim(),
            }));
            setPlannings(planningData);
        } catch (error) {
            console.error('Erro ao buscar planejamentos:', error);
            setPlannings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlannings();
    }, []);

    const handleOpenDeleteDialog = (planning, event) => {
        event.stopPropagation();
        setPlanningToDeleteInfo(planning);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setPlanningToDeleteInfo(null);
    };

    const handlePlanningDeleted = () => {
        fetchPlannings();
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const handleCloseAlert = () => {
        setAlert({ ...alert, show: false });
    };

    const handleRegisterPlanningClick = () => {
        navigate('/coordenador/planejamento-docente/cadastrar');
    };

    const filteredPlannings = plannings.filter((planning) => {
        if (!searchTerm) return true;
        return planning.academicYear === searchTerm;
    });

    const totalPages = Math.ceil(filteredPlannings.length / PLANNINGS_PER_PAGE);
    const planningsOnCurrentPage = filteredPlannings.slice((page - 1) * PLANNINGS_PER_PAGE, page * PLANNINGS_PER_PAGE);

    return (
        <Box sx={{ mx: { xs: 5, sm: 5 }, mt: { xs: 6, sm: 0 } }}>
            <Typography
                variant={isMobile ? 'h6' : 'h5'}
                gutterBottom
                align="center"
                sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 4 }, fontSize: { xs: 18, sm: 21 }, color: '#333' }}
            >
                Lista de Planejamento Docente
            </Typography>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    gap: 0,
                    px: { xs: 2, sm: 0 },
                    width: '100%',
                }}
            >
                <Box sx={{ width: '100%' }}>
                    <FilterAcademicYear
                        value={searchTerm}
                        onChange={(newValue) => setSearchTerm(newValue)}
                        placeholder="Ano acadêmico"
                        sx={{ width: { xs: '100%', sm: '25%' } }}
                    />
                </Box>
                <Button
                    variant="contained"
                    onClick={handleRegisterPlanningClick}
                    sx={{
                        height: '40px',
                        backgroundColor: '#2e7d32',
                        '&:hover': { backgroundColor: '#1b5e20' },
                        textTransform: 'none',
                        width: { xs: '100%', sm: '20%' },
                        marginRight: isMobile ? 0 : '27px',
                        maxWidth: { sm: 'auto' },
                        mt: { xs: 2, sm: 0 },
                    }}
                >
                    Cadastrar Planejamento
                </Button>
            </Box>
            <Grid container spacing={isMobile ? 2 : 4} sx={{ mt: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                {loading ? (
                    <Grid item xs={12}>
                        <Typography variant="h6" color="text.secondary" fontSize={15} align="center" sx={{ mt: 2 }}>
                            Carregando planejamentos...
                        </Typography>
                    </Grid>
                ) : planningsOnCurrentPage.length > 0 ? (
                    planningsOnCurrentPage.map((planning) => (
                        <Grid item xs={12} sm={6} md={4} key={planning.id}>
                            <CustomPlanningCard
                                onClick={() => navigate(`/coordenador/planejamento-docente/editar/${planning.id}`)}
                            >
                                <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Person sx={{ fontSize: '1.3rem', color: '#2e7d32', mr: 0.8 }} />
                                            <Typography variant="h6" component="div" sx={{ color: '#2e7d32', fontWeight: 'bold', lineHeight: 1.2, fontSize: '1.1rem' }}>
                                                Turma: {planning.class}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" sx={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '1rem' }}>
                                            {planning.academicYear}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flexGrow: 1, mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, color: '#555' }}>
                                            <AccessTimeOutlined sx={{ fontSize: '1rem', mr: 0.8, color: '#000000' }} />
                                            <Typography variant="body2" component="span" sx={{ fontSize: '0.9rem' }}>
                                                <Typography component="span" sx={{ fontWeight: 'bold' }}>Turno:</Typography> {planning.shift}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, color: '#555' }}>
                                            <CalendarMonthOutlined sx={{ fontSize: '1rem', mr: 0.8, color: '#000000' }} />
                                            <Typography variant="body2" component="span" sx={{ fontSize: '0.9rem' }}>
                                                <Typography component="span" sx={{ fontWeight: 'bold' }}>Data de Cadastro:</Typography> {planning.date}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                                <Box sx={{ display: 'flex', gap: 1, paddingLeft: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <Tooltip title="Excluir">
                                        <IconButton
                                            aria-label="Excluir"
                                            color="error"
                                            onClick={(event) => handleOpenDeleteDialog(planning, event)}
                                            sx={{
                                                padding: '8px',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
                                                    transform: 'translateY(-1px)',
                                                },
                                                borderRadius: '50%',
                                                transition: 'all 0.3s ease-in-out',
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </CustomPlanningCard>
                        </Grid>
                    ))
                ) : (
                    <Grid item xs={12}>
                        <Typography variant="h6" color="text.secondary" fontSize={15} align="center" sx={{ mt: 2 }}>
                            Nenhum planejamento encontrado.
                        </Typography>
                    </Grid>
                )}
            </Grid>

            {totalPages > 1 && filteredPlannings.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                    <Paginate
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                    />
                </Box>
            )}

            {alert.show && (
                <AlertMessage message={alert.message} type={alert.type} onClose={handleCloseAlert} />
            )}

            <TeachingPlanningDelete
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                planningInfo={planningToDeleteInfo}
                onPlanningDeleted={handlePlanningDeleted}
                setAlert={setAlert}
            />
        </Box>
    );
};

export default TeacherPlanningList;