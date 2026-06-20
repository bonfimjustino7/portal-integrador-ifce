import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Paper, IconButton, Button, Box, useMediaQuery,
    useTheme, Card, CardContent, styled, Divider,
    Tooltip
} from '@mui/material';
import { Edit, Delete, School } from '@mui/icons-material';
import api from '../../service/api';
import { getToken } from '../../service/auth';
import SearchInput from '../../components/SearchInput';
import AlertMessage from '../../components/AlertMessage';
import RegisterCalendar from './RegisterCalendar';
import CalendarDelete from './CalendarDelete';

const ActionIconsContainerMobile = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(1),
}));

const adjustDate = (dateString) => {
    const date = new Date(dateString);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
};

const CalendarList = () => {
    const [calendars, setCalendars] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCalendarToEdit, setSelectedCalendarToEdit] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [calendarToDelete, setCalendarToDelete] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchCalendars = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            setError('Usuário não autenticado.');
            setAlert({ show: true, message: 'Usuário não autenticado.', type: 'warning' });
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('calendar/', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const normalizedData = response.data.map(calendar => ({
                id: calendar.id,
                name: calendar.name,
                startDate: calendar.dateStart,
                endDate: calendar.dateEnd,
                closingDate: calendar.dateClose,
                period: calendar.period,
                type: calendar.type,
                typeLearn: calendar.typeLearn.map(tl => tl.name).join('/'),
                typeLearnId: calendar.typeLearn.map(tl => tl.id),
            }));
            setCalendars(normalizedData);
        } catch (error) {
            console.error('Erro ao buscar calendários:', error);
            setError('Erro ao buscar calendários.');
            setAlert({ show: true, message: 'Erro ao buscar calendários.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCalendars();
    }, [fetchCalendars]);

    const handleOpenRegisterModal = useCallback(() => {
        setSelectedCalendarToEdit(null);
        setIsRegisterModalOpen(true);
    }, []);

    const handleCloseRegisterModal = useCallback(() => {
        setIsRegisterModalOpen(false);
        fetchCalendars();
    }, [fetchCalendars]);

    const handleOpenEditModal = useCallback((calendar) => {
        setSelectedCalendarToEdit(calendar);
        setIsEditModalOpen(true);
    }, []);

    const handleCloseEditModal = useCallback(() => {
        setIsEditModalOpen(false);
        setSelectedCalendarToEdit(null);
        fetchCalendars();
    }, [fetchCalendars]);

    const handleOpenDeleteDialog = useCallback((calendar) => {
        setCalendarToDelete(calendar);
        setDeleteDialogOpen(true);
    }, []);

    const handleCloseDeleteDialog = useCallback(() => {
        setDeleteDialogOpen(false);
        setCalendarToDelete(null);
    }, []);

    const handleCalendarDeleted = useCallback(() => {
        fetchCalendars();
    }, [fetchCalendars]);

    const handleCloseAlert = useCallback(() => {
        setAlert({ ...alert, show: false });
    }, [alert]);

    const normalizeString = (str) =>
        str?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const filteredCalendars = calendars.filter((calendar) => {
        const normalizedSearchTerm = normalizeString(searchTerm);
        return (
            normalizeString(calendar.name)?.includes(normalizedSearchTerm)
        );
    });

    const groupedCalendars = filteredCalendars.reduce((acc, calendar) => {
        const key = calendar.type;
        if (!acc[key]) {
            acc[key] = { type: key, calendars: [] };
        }
        acc[key].calendars.push(calendar);
        return acc;
    }, {});

    const groupedCalendarsArray = Object.values(groupedCalendars)
        .sort((a, b) => a.type.localeCompare(b.type));

    if (loading) {
        return <Typography variant="body1">Carregando lista de calendários...</Typography>;
    }

    return (
        <Box sx={{ mx: { xs: 2, sm: 4 }, mt: { xs: 6, sm: 0 } }}>
            <Typography
                variant={isMobile ? 'h6' : 'h5'}
                gutterBottom
                align="center"
                sx={{ fontWeight: 'bold', color: '#333', mb: { xs: 2, sm: 4 } }}
            >
                Lista de Calendários Acadêmicos
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
                    placeholder="Buscar calendário por nome..."
                    sx={{ width: { xs: '100%', sm: 'auto', maxWidth: 400 } }}
                />
                <Button
                    variant="contained"
                    onClick={handleOpenRegisterModal}
                    sx={{
                        height: '40px',
                        backgroundColor: '#2e7d32',
                        '&:hover': { backgroundColor: '#1b5e20' },
                        textTransform: 'none',
                        width: { xs: '100%', sm: 'auto' },
                    }}
                >
                    Cadastrar Calendário
                </Button>
            </Box>

            {isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {groupedCalendarsArray.length > 0 ? (
                        groupedCalendarsArray.map((group, groupIndex) => (
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
                                        <School sx={{ mr: 0.5, color: '#2e7d32', fontSize: '1.4rem' }} />
                                        <Typography
                                            variant="h6"
                                            sx={{ color: '#1a3c34', fontSize: { xs: '0.9rem', sm: '1rem' } }}
                                        >
                                            <span style={{ fontWeight: 600 }}>Tipo:</span> {group.type}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ background: 'linear-gradient(to right, #2e7d32, #4caf50)', height: '2px', mb: 2 }} />
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {group.calendars.map((calendar) => (
                                            <Card
                                                key={calendar.id}
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
                                                        sx={{ color: '#1a3c34', fontSize: { xs: '0.9rem', sm: '0.95rem' } }}
                                                    >
                                                        <span style={{ fontWeight: 600 }}>Nome:</span> {calendar.name}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                                        <strong>Data de Início:</strong> {adjustDate(calendar.startDate).toLocaleDateString('pt-BR')}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                                        <strong>Data de Fim:</strong> {adjustDate(calendar.endDate).toLocaleDateString('pt-BR')}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                                        <strong>Data de Fechamento:</strong> {adjustDate(calendar.closingDate).toLocaleDateString('pt-BR')}
                                                    </Typography>
                                                    <ActionIconsContainerMobile>
                                                        <Tooltip title="Editar">
                                                            <IconButton
                                                                aria-label="edit"
                                                                sx={{ color: '#2e7d32' }}
                                                                onClick={() => handleOpenEditModal(calendar)}
                                                            >
                                                                <Edit />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Excluir">
                                                            <IconButton
                                                                aria-label="delete"
                                                                sx={{ color: '#d32f2f' }}
                                                                onClick={() => handleOpenDeleteDialog(calendar)}
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
                            Nenhum calendário encontrado.
                        </Typography>
                    )}
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {groupedCalendarsArray.length > 0 ? (
                        groupedCalendarsArray.map((group, groupIndex) => (
                            <Card
                                key={groupIndex}
                                sx={{
                                    mb: 4,
                                    p: 2,
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
                                            sx={{ color: '#1a3c34', fontSize: { xs: '0.9rem', sm: '1rem' } }}
                                        >
                                            <span style={{ fontWeight: 600 }}>Calendário:</span> {group.type}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ background: 'linear-gradient(to right, #2e7d32, #4caf50)', height: '2px', mb: 2 }} />
                                    <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '8px' }}>
                                        <Table sx={{ minWidth: 650 }} aria-label="calendar table">
                                            <TableHead>
                                                <TableRow sx={{ height: '40px' }}>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Nome</TableCell>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Data de Início</TableCell>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Data de Fim</TableCell>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Data de Fechamento</TableCell>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Ações</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {group.calendars.map((calendar, index) => (
                                                    <TableRow
                                                        key={calendar.id}
                                                        sx={{
                                                            backgroundColor: index % 2 === 0 ? '#FFF' : '#F4F7FC',
                                                            height: 50,
                                                        }}
                                                    >
                                                        <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{calendar.name}</TableCell>
                                                        <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{adjustDate(calendar.startDate).toLocaleDateString('pt-BR')}</TableCell>
                                                        <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{adjustDate(calendar.endDate).toLocaleDateString('pt-BR')}</TableCell>
                                                        <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{adjustDate(calendar.closingDate).toLocaleDateString('pt-BR')}</TableCell>
                                                        <TableCell align="center" sx={{ py: 0.5 }}>
                                                            <Tooltip title="Editar">
                                                                <IconButton
                                                                    aria-label="edit"
                                                                    sx={{ color: '#2e7d32', p: 0.5 }}
                                                                    onClick={() => handleOpenEditModal(calendar)}
                                                                >
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Excluir">
                                                                <IconButton
                                                                    aria-label="delete"
                                                                    sx={{ color: '#d32f2f', p: 0.5 }}
                                                                    onClick={() => handleOpenDeleteDialog(calendar)}
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
                            Nenhum calendário encontrado.
                        </Typography>
                    )}
                </Box>
            )}

            {alert.show && (
                <AlertMessage message={alert.message} type={alert.type} onClose={handleCloseAlert} />
            )}

            <RegisterCalendar
                open={isRegisterModalOpen || isEditModalOpen}
                onClose={isRegisterModalOpen ? handleCloseRegisterModal : handleCloseEditModal}
                refreshCalendars={fetchCalendars}
                setAlert={setAlert}
                calendarData={selectedCalendarToEdit}
            />

            <CalendarDelete
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                calendarEntry={calendarToDelete}
                onCalendarEntryDeleted={handleCalendarDeleted}
                setAlert={setAlert}
            />
        </Box>
    );
};

export default CalendarList;