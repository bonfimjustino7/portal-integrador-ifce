import { TextField, Container, Button, Typography, Paper, Box, CircularProgress, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../service/api';
import AlertMessage from '../components/AlertMessage';

const ResetPassword = () => {
    const navigate = useNavigate();
    const { expires, encodedEmail } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAlert({ show: false, message: '', type: '' });

        if (!password || !confirmPassword) {
            setAlert({ show: true, message: 'Preencha todos os campos obrigatórios.', type: 'error' });
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setAlert({ show: true, message: 'A senha deve ter pelo menos 8 caracteres.', type: 'error' });
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setAlert({ show: true, message: 'As senhas não coincidem.', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            await api.post('/password/change', { expires, encodedEmail, password });
            setAlert({
                show: true,
                message: 'Senha redefinida com sucesso.',
                type: 'success',
            });
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error("Erro na requisição:", err);
            const apiErrorMessage = err.response?.data?.message || 'Falha ao redefinir senha. Tente novamente.';
            setAlert({
                show: true,
                message: apiErrorMessage,
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword((prev) => !prev);
    };

    const handleCloseAlert = () => {
        setAlert({ show: false, message: '', type: '' });
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
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
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center', width: '100%' }}>
                        Nova Senha
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary', width: '100%' }}>
                        Informe uma nova senha e recupere o seu acesso.
                    </Typography>
                    <Box component="form" onSubmit={handleResetPassword} sx={{ width: '100%' }}>
                        <TextField
                            fullWidth
                            margin="normal"
                            id="password"
                            label="Nova Senha (Obrigatório)"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={togglePasswordVisibility} edge="end">
                                            {showPassword ? <Visibility /> : <VisibilityOff />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#10641c',
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#10641c',
                                },
                                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#0e5517',
                                },
                            }}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            id="confirm-password"
                            label="Confirmar Nova Senha (Obrigatório)"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={toggleConfirmPasswordVisibility} edge="end">
                                            {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#10641c',
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#10641c',
                                },
                                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#0e5517',
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
                                type="button"
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
                                disabled={loading}
                                sx={{
                                    py: 1,
                                    px: 4,
                                    bgcolor: '#10641c',
                                    '&:hover': { bgcolor: '#0e5517' },
                                    textTransform: 'none',
                                    minWidth: '80px',
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Salvar'}
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
}

export default ResetPassword;