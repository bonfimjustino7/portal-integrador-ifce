import React, { useState, useEffect } from 'react';
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
import AlertMessage from '../../components/AlertMessage';

const UserDelete = ({ open, onClose, user, onUserDeleted }) => {
    const [error, setError] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('');

    useEffect(() => {
        if (alertMessage) {
            const timer = setTimeout(() => {
                setAlertMessage('');
                setAlertType('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [alertMessage]);

    const handleDelete = async () => {
        setError('');
        setAlertMessage('');
        setAlertType('');

        const token = getToken();

        if (!token) {
            setAlertMessage('Usuário não autenticado.');
            setAlertType('error');
            return;
        }

        try {
            const response = await api.delete(`/users/${user.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 200 || response.status === 204) {
                setAlertMessage('Usuário excluído com sucesso!');
                setAlertType('success');
                if (onUserDeleted) onUserDeleted();
                setTimeout(onClose, 3000);
            } else {
                setAlertMessage('Erro ao excluir o usuário.');
                setAlertType('error');
            }
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            let errorMessage = 'Erro ao comunicar com o servidor.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            setAlertMessage(errorMessage);
            setAlertType('error');
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle sx={{ color: 'red', textAlign: 'center' }}>
                Confirmar Exclusão
            </DialogTitle>
            <DialogContent>
                <Typography align="center">
                    Deseja realmente excluir o usuário <strong>{user?.name}</strong>?<br />
                    Esta ação não poderá ser desfeita.
                </Typography>
                {alertMessage && (
                    <AlertMessage
                        message={alertMessage}
                        type={alertType}
                        onClose={() => {
                            setAlertMessage('');
                            setAlertType('');
                        }}
                    />
                )}
                {error && !alertMessage && (
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

export default UserDelete;