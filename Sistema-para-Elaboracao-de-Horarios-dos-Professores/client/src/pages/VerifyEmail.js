import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    CircularProgress,
} from '@mui/material';
import api from '../service/api';
import AlertMessage from '../components/AlertMessage';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    const handleValidEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAlert({ show: false, message: '', type: '' });

        try {
            const response = await api.post('/password/verify', { email });
            setAlert({
                show: true,
                message: response.data.message || 'Link de redefinição enviado com sucesso! Por favor, verifique seu e-mail.',
                type: 'success',
            });
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error("Erro na requisição:", err);
            const apiErrorMessage = err.response?.data?.message || 'Falha ao enviar o link de redefinição. Tente novamente.';
            setAlert({
                show: true,
                message: apiErrorMessage,
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const isEmailValid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const handleCloseAlert = () => {
        setAlert({ show: false, message: '', type: '' });
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f5f5',
            }}
        >
            <Paper
                elevation={6}
                sx={{
                    display: 'flex',
                    width: '100%',
                    maxWidth: 450,
                    borderRadius: 4,
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        flex: 1,
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        bgcolor: 'white',
                    }}
                >
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                        Redefinir Senha
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Informe seu e-mail e enviaremos um link para você redefinir sua senha.
                    </Typography>
                    <Box component="form" onSubmit={handleValidEmail} sx={{ width: '100%' }}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={!!email && !isEmailValid()}
                            helperText={!!email && !isEmailValid() ? 'Email inválido' : ''}
                            margin="normal"
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#10641c',
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#10641c',
                                },
                            }}
                        />

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 3,
                                mt: 3,
                            }}
                        >
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/login')}
                                sx={{
                                    py: 1,
                                    px: 3,
                                    borderColor: 'red',
                                    color: 'red',
                                    '&:hover': {
                                        borderColor: '#d32f2f',
                                        bgcolor: 'rgba(244, 67, 54, 0.08)',
                                    },
                                    textTransform: 'none',
                                    minWidth: '80px',
                                }}
                            >
                                Cancelar
                            </Button>

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading || !isEmailValid()}
                                sx={{
                                    py: 1,
                                    px: 4,
                                    bgcolor: '#10641c',
                                    '&:hover': { bgcolor: '#0e5517' },
                                    textTransform: 'none',
                                    minWidth: '80px',
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar'}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {alert.show && (
                <AlertMessage
                    message={alert.message}
                    type={alert.type}
                    onClose={handleCloseAlert}
                />
            )}
        </Box>
    );
};

export default VerifyEmail;