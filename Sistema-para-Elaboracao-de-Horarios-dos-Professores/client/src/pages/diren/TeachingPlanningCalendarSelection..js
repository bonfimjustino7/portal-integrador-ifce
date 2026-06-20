import React, { useState, useEffect } from 'react';
import {
    Typography,
    Box,
    useMediaQuery,
    useTheme,
    Grid,
    Card,
    CardActionArea,
    CardContent,
    CircularProgress
} from '@mui/material';
import {
    CalendarMonthOutlined,
    EventBusy
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../service/api';

import Paginate from '../../components/Paginate';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const CustomCalendarSelectionCard = ({ icon, title, dateStart, dateEnd, dateClose, active, onClick }) => {
    const theme = useTheme();
    return (
        <Card
            sx={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: theme.shape.borderRadius * 0.5,
                marginBottom: '15px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '250px',
                width: '320px',
                transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)',
                    transform: 'translateY(-5px)',
                },
            }}
        >
            <CardActionArea onClick={onClick} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                {icon}
                <CardContent sx={{ textAlign: 'center', p: 0, pt: 2 }}>
                    <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#333', fontSize: '15px' }}>
                        {title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Início: {formatDate(dateStart)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Fim: {formatDate(dateEnd)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Fechamento: {formatDate(dateClose)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ color: active ? 'green' : 'red', fontWeight: 'bold' }}>
                        Status: {active ? 'Ativo' : 'Inativo'}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

const TeachingPlanningCalendarSelection = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const userRole = localStorage.getItem('role');

    const [calendarsWithPlanning, setCalendarsWithPlanning] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    useEffect(() => {
        const fetchCalendars = async () => {
            try {
                setLoading(true);
                const response = await api.get('/calendar/planning');
                const data = response.data;
                setCalendarsWithPlanning(data);
            } catch (err) {
                const message = err.response
                    ? `Erro ${err.response.status}: ${err.response.statusText || 'Algo deu errado no servidor.'}`
                    : 'Erro de conexão: Verifique sua rede.';
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchCalendars();
    }, []);

    const formatUserRoleForUrl = (role) => {
        return role ? role.toLowerCase().replace(/ /g, '_') : '';
    };

    const handleCalendarClick = (calendarId, calendarName) => {
        const user = formatUserRoleForUrl(userRole);
        navigate(`/${user}/planejamento-docente/${calendarId}`, { state: { calendarName } });
    };

    const totalPages = Math.ceil(calendarsWithPlanning.length / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCalendars = calendarsWithPlanning.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress sx={{ color: '#2e7d32', mr: 2 }} />
                <Typography variant="h6" color="text.secondary">
                    Carregando calendários com planejamento...
                </Typography>
            </Box>
        );
    }
    return (
        <Box sx={{ mx: { xs: 4, sm: 4 }, mt: { xs: 6, sm: 2 }, flexGrow: 1 }}>
            <Typography
                variant={isMobile ? 'h6' : 'h5'}
                gutterBottom
                align="center"
                sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 4 }, fontSize: { xs: 18, sm: 28 }, color: '#333' }}
            >
                Seleção de Planejamento Docente
            </Typography>

            {calendarsWithPlanning.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 6 }}>
                    <EventBusy sx={{ fontSize: 60, color: '#999', mb: 2 }} />
                    <Typography
                        variant="body1"
                        align="center"
                        sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555' }}
                    >
                        Nenhum planejamento foi encontrado para os calendários ativos.
                    </Typography>
                    <Typography
                        variant="body1"
                        align="center"
                        sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555', mt: 1 }}
                    >
                        É necessário que os coordenadores de curso realizem o planejamento para que ele seja exibido.
                    </Typography>
                </Box>
            ) : (
                <>
                    <Typography variant="body1" align="center" sx={{ mb: 4, fontSize: { xs: 15, sm: 17 }, color: '#555' }}>
                        Escolha o calendário para visualizar e gerenciar os planejamentos docentes de cada curso.
                    </Typography>

                    <Grid
                        container
                        spacing={isMobile ? 2 : 4}
                        justifyContent="center"
                        sx={{ mt: 2 }}
                    >
                        {currentCalendars.map((calendar) => (
                            <Grid item xs={12} sm="auto" md="auto" key={calendar.id}>
                                <CustomCalendarSelectionCard
                                    icon={<CalendarMonthOutlined sx={{ fontSize: 60, color: '#1D942B' }} />}
                                    title={calendar.name}
                                    dateStart={calendar.dateStart}
                                    dateEnd={calendar.dateEnd}
                                    dateClose={calendar.dateClose}
                                    active={calendar.active}
                                    onClick={() => handleCalendarClick(calendar.id, calendar.name)}
                                />
                            </Grid>
                        ))}
                    </Grid>

                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Paginate
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default TeachingPlanningCalendarSelection;