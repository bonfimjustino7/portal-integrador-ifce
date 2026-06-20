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

const TeachingPlanningDelete = ({ open, onClose, planningInfo, onPlanningDeleted, setAlert }) => {

    const handleDelete = async () => {
        const token = getToken();

        if (!token) {
            setAlert({ show: true, message: 'Usuário não autenticado.', type: 'error' });
            onClose();
            return;
        }

        if (!planningInfo || !planningInfo.id) {
            setAlert({ show: true, message: 'Informações do planejamento ausentes.', type: 'error' });
            onClose();
            return;
        }

        try {
            const response = await api.delete(`/coordination/${planningInfo.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 200 || response.status === 204) {
                setAlert({ show: true, message: 'Planejamento excluído com sucesso!', type: 'success' });
                if (onPlanningDeleted) {
                    onPlanningDeleted();
                }
            } else {
                setAlert({ show: true, message: 'Erro ao excluir planejamento.', type: 'error' });
            }
        } catch (error) {
            console.error('Erro ao excluir planejamento:', error);
            let errorMessage = 'Erro ao comunicar com o servidor.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            setAlert({ show: true, message: errorMessage, type: 'error' });
        } finally {
            onClose();
        }
    };

    const className = planningInfo?.class;
    const academicYear = planningInfo?.academicYear;

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle sx={{ color: 'red', textAlign: 'center' }}>
                Confirmar Exclusão
            </DialogTitle>
            <DialogContent>
                <Typography align="center">
                    Deseja realmente excluir o planejamento da turma: <strong>{className} - {academicYear}? </strong>
                    <br />
                    Essa ação não poderá ser desfeita.
                </Typography>
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

export default TeachingPlanningDelete;