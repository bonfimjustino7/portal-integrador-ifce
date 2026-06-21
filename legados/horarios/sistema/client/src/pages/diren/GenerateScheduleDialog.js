import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress,
    Box,
} from '@mui/material';
import api from '../../service/api';
import { getToken } from '../../service/auth';

const GenerateScheduleDialog = ({ open, onClose, calendarName, calendarId, user, fetchPlanningData, navigate, setAlert, setIsGenerating }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [dots, setDots] = useState('');

    useEffect(() => {
        let dotInterval;
        if (isLoading) {
            dotInterval = setInterval(() => {
                setDots((prevDots) => {
                    if (prevDots.length < 3) {
                        return prevDots + '.';
                    }
                    return '';
                });
            }, 500);
        } else {
            setDots('');
        }
        return () => clearInterval(dotInterval);
    }, [isLoading]);


    const handleGenerate = async () => {
        setIsLoading(true);
        setIsGenerating(true);
        setError('');
        setAlert(null);

        const token = getToken();

        if (!token) {
            setAlert({ show: true, message: 'Usuário não autenticado.', type: 'error' });
            onClose();
            setIsLoading(false);
            setIsGenerating(false);
            return;
        }

        try {
            await api.get(`/hour-grid/${calendarId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            fetchPlanningData();
            navigate(`/${user}/horarios/pre-visualizacao/${calendarId}`, {
                state: { calendarName, successMessage: `Horário gerado com sucesso!` }
            });
            onClose();
        } catch (error) {
            let errorMessage = error.response?.data?.details || error.response?.data?.error || 'Erro desconhecido ao gerar horários.';
            onClose();
        } finally {
            setIsLoading(false);
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ color: '#2e7d32', textAlign: 'center' }}>
                Gerar Horário
            </DialogTitle>
            <DialogContent>
                {isLoading ? (
                    <Box sx={{ textAlign: 'center', mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <CircularProgress color="success" sx={{ mb: 2 }} />
                        <Typography variant="body1">
                            Gerando Horário. Aguarde{dots}
                        </Typography>
                    </Box>
                ) : (
                    <Typography align="center">
                        Tem certeza que deseja gerar o horário para o calendário <strong>{calendarName}</strong>?
                    </Typography>
                )}
                {error && (
                    <Typography color="error" align="center" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    disabled={isLoading}
                    sx={{
                        color: '#d32f2f',
                        borderColor: '#d32f2f',
                        backgroundColor: 'white',
                        '&:hover': {
                            backgroundColor: '#ffebee',
                            borderColor: '#b71c1c',
                        },
                        textTransform: 'none',
                        minWidth: '100px',
                        cursor: 'pointer',
                    }}>
                    Não
                </Button>
                <Button
                    onClick={handleGenerate}
                    variant="contained"
                    disabled={isLoading}
                    sx={{
                        backgroundColor: '#2e7d32',
                        '&:hover': { backgroundColor: '#1b5e20' },
                        textTransform: 'none',
                        minWidth: '100px',
                        cursor: 'pointer',
                        ml: 2,
                    }}
                >
                    {isLoading ? 'Gerando...' : 'Sim'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GenerateScheduleDialog;