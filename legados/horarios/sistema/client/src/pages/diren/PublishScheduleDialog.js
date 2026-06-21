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

const PublishScheduleDialog = ({ open, onClose, calendarName, calendarId, setAlert, setIsLoading, onPublishSuccess }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [dots, setDots] = useState('');

    useEffect(() => {
        let dotInterval;
        if (isProcessing) {
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
    }, [isProcessing]);

    const handlePublish = async () => {
        setIsProcessing(true);
        setIsLoading(true);
        setError('');
        setAlert(null);

        const token = getToken();
        if (!token) {
            setAlert({ message: 'Usuário não autenticado.', type: 'error' });
            setError('Usuário não autenticado.');
            setIsProcessing(false);
            setIsLoading(false);
            onClose();
            return;
        }

        try {
            if (!calendarId) {
                throw new Error('ID do calendário não fornecido.');
            }

            await api.post(`/hour-grid/public/${calendarId}`, null, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            onPublishSuccess();
            setAlert({ message: `Horários publicados com sucesso.`, type: 'success' });
            onClose();
        } catch (error) {
            const errorMessage =
                error.response?.data?.details ||
                error.response?.data?.error ||
                error.message ||
                'Erro desconhecido ao publicar horários.';
            setError(errorMessage);
            setAlert({ message: errorMessage, type: 'error' });
        } finally {
            setIsProcessing(false);
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ color: '#2e7d32', textAlign: 'center' }}>
                Publicar Horários
            </DialogTitle>
            <DialogContent>
                {isProcessing ? (
                    <Box sx={{ textAlign: 'center', mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <CircularProgress color="success" sx={{ mb: 2 }} />
                        <Typography variant="body1">Publicando Horários{dots}</Typography>
                    </Box>
                ) : (
                    <Typography align="center">
                        Tem certeza que deseja publicar os horários para o calendário <strong>{calendarName}</strong>?
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
                    disabled={isProcessing}
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
                    }}
                >
                    Não
                </Button>
                <Button
                    onClick={handlePublish}
                    variant="contained"
                    disabled={isProcessing}
                    sx={{
                        backgroundColor: '#2e7d32',
                        '&:hover': { backgroundColor: '#1b5e20' },
                        textTransform: 'none',
                        minWidth: '100px',
                        cursor: 'pointer',
                        ml: 2,
                    }}
                >
                    {isProcessing ? 'Publicando...' : 'Sim'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PublishScheduleDialog;