import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, Stack, IconButton, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const ObservationsTeacherDialog = ({ open, observation, professorName, handleClose }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '10px',
                }
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2 }}>
                <Stack direction="row" alignItems="center">
                    <Typography
                        variant={isMobile ? "body1" : "h6"}
                        sx={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '18px' }}
                        component="span"
                    >
                        Observações
                    </Typography>
                </Stack>
                {handleClose ? (
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'red',
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                ) : null}
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    <Typography variant="body1">
                        <Typography component="span" sx={{ fontWeight: 'bold', color: '#555', fontSize: '15px' }}>
                            Professor:
                        </Typography>{' '}
                        {professorName}
                    </Typography>
                    <Typography variant="body1">
                        <Typography component="span" sx={{ fontWeight: 'bold', color: '#555', fontSize: '15px' }}>
                            Observações:
                        </Typography>{' '}
                        {observation || 'Não há observações.'}
                    </Typography>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default ObservationsTeacherDialog;