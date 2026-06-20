import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from '@mui/material';
import api from '../../service/api';
import { getToken } from '../../service/auth';

const CalendarDelete = ({ open, onClose, calendarEntry, onCalendarEntryDeleted, setAlert }) => {
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setError('');

        const token = getToken();

        if (!token) {
            setAlert({ show: true, message: 'Usuário não autenticado.', type: 'error' });
            onClose();
            return;
        }

        try {
            const response = await api.delete(`/calendar/${calendarEntry.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 200 || response.status === 204) {
                setAlert({ show: true, message: 'Calendário excluído com sucesso.', type: 'success' });
                if (onCalendarEntryDeleted) onCalendarEntryDeleted();
                onClose();
            } else {
                setAlert({ show: true, message: 'Erro ao excluir calendário.', type: 'error' });
                onClose();
            }
        } catch (error) {
            console.error('Erro ao excluir calendário:', error);
            let errorMessage = 'Erro ao comunicar com o servidor.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle sx={{ color: 'red', textAlign: 'center' }}>
                Confirmar Exclusão
            </DialogTitle>
            <DialogContent>
                <Typography align="center">
                    Deseja realmente excluir o calendário <br /> <strong>{calendarEntry?.name}</strong>?<br />
                    Esta ação não poderá ser desfeita.
                </Typography>
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
                    sx={{
                        color: '#000',
                        borderColor: '#ccc',
                        '&:hover': {
                            backgroundColor: '#f5f5f5',
                            borderColor: '#aaa',
                        },
                    }}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleDelete}
                    variant="contained"
                    sx={{
                        backgroundColor: 'red',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: '#c62828',
                        },
                        ml: 2,
                    }}
                >
                    Excluir
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CalendarDelete;