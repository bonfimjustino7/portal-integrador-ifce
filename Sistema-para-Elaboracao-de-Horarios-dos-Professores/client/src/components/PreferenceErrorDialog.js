import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const PreferenceErrorDialog = ({ open, message, onClose, onSendAnyway, isOutsidePreferences }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ color: '#d32f2f', textAlign: 'center' }}>
                Atenção
            </DialogTitle>
            <DialogContent>
                <Typography align="center" color="error">
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                {isOutsidePreferences ? (
                    <>
                        <Button
                            onClick={onClose}
                            variant="outlined"
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
                            Cancelar
                        </Button>

                        <Button
                            onClick={onSendAnyway}
                            variant="contained"
                            sx={{
                                backgroundColor: '#2e7d32',
                                '&:hover': { backgroundColor: '#1b5e20' },
                                textTransform: 'none',
                                minWidth: '150px',
                            }}
                        >
                            Salvar Mesmo Assim
                        </Button>

                    </>
                ) : (
                    <Button
                        onClick={onClose}
                        variant="contained"
                        sx={{
                            backgroundColor: '#2e7d32',
                            '&:hover': { backgroundColor: '#1b5e20' },
                            textTransform: 'none',
                            minWidth: '100px',
                        }}
                    >
                        OK
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default PreferenceErrorDialog;
