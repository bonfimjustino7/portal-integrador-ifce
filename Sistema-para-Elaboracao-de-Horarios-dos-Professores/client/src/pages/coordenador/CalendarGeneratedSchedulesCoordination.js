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
    CircularProgress,
} from '@mui/material';
import { CalendarMonthOutlined, EventBusy } from '@mui/icons-material';
import Paginate from '../../components/Paginate';
import api from '../../service/api';
import { AlertMessage } from '../../components/AlertMessage';
import { useNavigate, useLocation } from 'react-router-dom';

const CustomScheduleCard = ({ icon, title, createdAt, isPublished, onClick }) => {
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
                position: 'relative',
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
                '&:hover': {
                    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)',
                    transform: 'translateY(-5px)',
                },
            }}
        >
            <CardActionArea
                onClick={onClick}
                sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <CardContent sx={{ textAlign: 'center', p: 3, flexGrow: 1, width: '100%' }}>
                    {icon}
                    <Typography
                        gutterBottom
                        variant="h5"
                        component="div"
                        sx={{
                            fontSize: '15px',
                            fontWeight: 'bold',
                            color: '#333',
                            mt: 2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                        }}
                    >
                        {title}
                    </Typography>
                    {createdAt && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px', mt: 1 }}>
                            Horário Gerado: {new Date(createdAt).toLocaleDateString()}
                        </Typography>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

const CalendarGeneratedSchedulesCoordination = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const userRole = 'Coordenador';

    const [allCalendars, setAllCalendars] = useState([]);
    const [filteredCalendars, setFilteredCalendars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    useEffect(() => {
        if (location.state?.message && location.state?.type) {
            setAlert({
                message: location.state.message,
                type: location.state.type,
            });

            const timer = setTimeout(() => {
                setAlert(null);
                navigate(location.pathname, { replace: true, state: {} });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [location.state, navigate]);

    useEffect(() => {
        const fetchCalendars = async () => {
            setLoading(true);
            try {
                const response = await api.get('/calendar/hours/schedule/publicated');
                const data = response.data;

                const formattedCalendars = data.map((calendar) => ({
                    id: calendar.id,
                    name: calendar.name,
                    createdAt: calendar.createdAt,
                    isPublished: calendar.publicated,
                }));
                setAllCalendars(formattedCalendars);
                setFilteredCalendars(formattedCalendars);
            } catch (err) {
                const message = err.response
                    ? `Erro ${err.response.status}: ${err.response.statusText || 'Algo deu errado no servidor.'}`
                    : 'Erro de conexão: Verifique sua rede.';
            } finally {
                setLoading(false);
            }
        };

        fetchCalendars();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [allCalendars]);

    const formatUserRoleForUrl = () => {
        return 'coordenador';
    };

    const handleCalendarClick = (calendarId, calendarName) => {
        const user = formatUserRoleForUrl();
        navigate(`/${user}/horarios/${calendarId}`, { state: { calendarName } });
    };

    const totalPages = Math.ceil(filteredCalendars.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCalendars = filteredCalendars.slice(indexOfFirstItem, indexOfLastItem);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress sx={{ color: '#2e7d32', mr: 2 }} />
                <Typography variant="h6" color="text.secondary">
                    Carregando calendários...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ mx: { xs: 4, sm: 4 }, mt: { xs: 6, sm: 2 }, flexGrow: 1 }}>
            {alert && (
                <AlertMessage
                    message={alert.message}
                    type={alert.type}
                    onClose={() => setAlert(null)}
                />
            )}
            <Typography
                variant={isMobile ? 'h6' : 'h5'}
                gutterBottom
                align="center"
                sx={{
                    fontWeight: 'bold',
                    mb: { xs: 2, sm: 4 },
                    fontSize: { xs: 18, sm: 28 },
                    color: '#333',
                }}
            >
                Horários do Curso
            </Typography>

            {filteredCalendars.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 6 }}>
                    <EventBusy sx={{ fontSize: 60, color: '#999', mb: 2 }} />
                    <Typography
                        variant="body1"
                        align="center"
                        sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555' }}
                    >
                        Nenhum horário foi encontrado para os calendários ativos do seu curso.
                    </Typography>
                    <Typography
                        variant="body1"
                        align="center"
                        sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555' }}
                    >
                        Entre em contato com a Diren para verificar se há horários gerados.
                    </Typography>
                </Box>
            ) : (
                <>
                    <Typography
                        variant="body1"
                        align="center"
                        sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555', mt: 2, mb: 2 }}
                    >
                        Selecione um calendário abaixo para visualizar os horários do seu curso.
                    </Typography>
                    <Grid
                        container
                        columns={{ xs: 4, sm: 8, md: 12 }}
                        spacing={isMobile ? 2 : 4}
                        justifyContent="center"
                        sx={{ mt: 2 }}
                    >
                        {currentCalendars.map((calendar) => (
                            <Grid
                                key={calendar.id}
                                gridColumn={{ xs: 4, sm: 4, md: 4 }}
                                sx={{ display: 'flex', justifyContent: 'center' }}
                            >
                                <CustomScheduleCard
                                    icon={<CalendarMonthOutlined sx={{ fontSize: 60, color: '#1D942B' }} />}
                                    title={calendar.name}
                                    createdAt={calendar.createdAt}
                                    isPublished={calendar.isPublished}
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
                                onChange={(event, value) => setCurrentPage(value)}
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default CalendarGeneratedSchedulesCoordination;