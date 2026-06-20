import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from '@mui/material';

const DisciplineDeleteDialog = ({ open, onClose, discipline, classItem, onConfirmDelete }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ color: 'red', textAlign: 'center' }}>
                Confirmar Exclusão da Disciplina
            </DialogTitle>
            <DialogContent>
                <Typography align="center">
                    Deseja realmente excluir a disciplina <strong> {discipline?.description}</strong><br />
                    da turma <strong>{classItem?.code}</strong>?
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
                        textTransform: 'none',
                        minWidth: '100px',
                    }}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={onConfirmDelete}
                    variant="contained"
                    sx={{
                        backgroundColor: 'red',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: '#c62828',
                        },
                        textTransform: 'none',
                        minWidth: '100px',
                        ml: 2,
                    }}
                >
                    Excluir
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DisciplineDeleteDialog;