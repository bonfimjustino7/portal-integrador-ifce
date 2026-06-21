import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Paper, IconButton, Button, Box, useMediaQuery,
    useTheme, Dialog, DialogContent, Card, CardContent, styled, Divider,
    Tooltip
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import api from '../../service/api';
import { getToken } from '../../service/auth';
import SearchInput from '../../components/SearchInput';
import RegisterUser from './RegisterUser';
import UserDelete from './UserDelete';
import UserEdit from './UserEdit';
import AlertMessage from '../../components/AlertMessage';

const ActionIconsContainerMobile = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(1),
    gap: theme.spacing(1),
}));

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (token) {
            try {
                const response = await api.get('/users', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setUsers(response.data);
            } catch (error) {
                console.error('Erro ao buscar usuários:', error);
                setError('Erro ao carregar a lista de usuários.');
                setAlert({ show: true, message: 'Erro ao carregar a lista de usuários.', type: 'error' });
            } finally {
                setLoading(false);
            }
        } else {
            console.warn('Usuário não autenticado.');
            setError('Usuário não autenticado.');
            setAlert({ show: true, message: 'Usuário não autenticado.', type: 'warning' });
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenDialog = (user = null) => {
        setEditingUser(user);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingUser(null);
    };

    const handleUserRegistered = () => {
        fetchUsers();
        handleCloseDialog();
    };

    const handleOpenDeleteDialog = (user) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const handleUserDeleted = () => {
        fetchUsers();
        handleCloseDeleteDialog();
        setAlert({ show: true, message: 'Usuário excluído com sucesso!', type: 'success' });
    };

    const handleCloseAlert = () => {
        setAlert({ ...alert, show: false });
    };

    const formatRole = (role) => {
        const lowerCaseRole = role?.toLowerCase();
        if (lowerCaseRole === 'admin') return 'Admin';
        if (lowerCaseRole === 'professor') return 'Professor';
        if (lowerCaseRole === 'coordenador') return 'Coordenador';
        if (lowerCaseRole === 'diretor_ensino') return 'Diretor Ensino';
        return role || 'Não informado';
    };

    const normalizeString = (str) => {
        if (typeof str !== 'string') return '';
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    const filteredUsers = users.filter((user) => {
        const normalizedSearchTerm = normalizeString(searchTerm);
        const nameMatches = normalizeString(user.name).includes(normalizedSearchTerm);
        return nameMatches;
    });

    const groupedUsers = filteredUsers.reduce((acc, user) => {
        const key = formatRole(user.role);
        if (!acc[key]) {
            acc[key] = {
                role: key,
                users: [],
            };
        }
        acc[key].users.push(user);
        return acc;
    }, {});

    const groupedUsersArray = Object.values(groupedUsers).sort((a, b) =>
        a.role.localeCompare(b.role)
    );

    if (loading) return <Typography variant="body1">Carregando lista de usuários...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box sx={{ mx: { xs: 2, sm: 4 }, mt: { xs: 4, sm: 2 } }}>
            <Typography
                variant={isMobile ? 'h6' : 'h5'}
                gutterBottom
                align="center"
                sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 4 }, color: '#333' }}
            >
                Lista de Usuários
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', mb: 3, gap: 2 }}>
                <SearchInput
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar usuário por nome..."
                    sx={{ width: { xs: '100%', sm: 'auto' }, maxWidth: { xs: '100%', sm: 400 } }}
                />
                <Button
                    variant="contained"
                    onClick={() => handleOpenDialog(null)}
                    sx={{
                        height: '40px',
                        backgroundColor: '#2e7d32',
                        '&:hover': { backgroundColor: '#1b5e20' },
                        textTransform: 'none',
                        width: { xs: '100%', sm: 'auto' },
                    }}
                >
                    Cadastrar Usuário
                </Button>
            </Box>

            {isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {groupedUsersArray.length > 0 ? (
                        groupedUsersArray.map((group, groupIndex) => (
                            <Card
                                key={groupIndex}
                                sx={{
                                    mb: 4,
                                    p: 2,
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f1f8f0ff 100%)',
                                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: '#1a3c34',
                                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                            }}
                                        >
                                            <span style={{ fontWeight: 600 }}>Cargo:</span> {group.role}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ background: 'linear-gradient(to right, #2e7d32, #4caf50)', height: '2px', mb: 2 }} />
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {group.users.map((user) => (
                                            <Card
                                                key={user.registration}
                                                sx={{
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: '8px',
                                                    bgcolor: '#fdfdfd',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                                }}
                                            >
                                                <CardContent>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            color: '#1a3c34',
                                                            fontSize: { xs: '0.9rem', sm: '0.95rem' }
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: 600 }}>Nome:</span> {user.name}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                                        <strong>Código do Nome:</strong> {user.nameCode}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                                        <strong>Email:</strong> {user.email}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                                        <strong>Cargo:</strong> {formatRole(user.role)}
                                                    </Typography>
                                                    <ActionIconsContainerMobile>
                                                        <Tooltip title="Editar" arrow>
                                                            <IconButton
                                                                aria-label="edit"
                                                                sx={{ color: '#2e7d32' }}
                                                                onClick={() => handleOpenDialog(user)}
                                                            >
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </ActionIconsContainerMobile>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Typography align="center" variant="h6" color="text.secondary">
                            Nenhum usuário encontrado.
                        </Typography>
                    )}
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {groupedUsersArray.length > 0 ? (
                        groupedUsersArray.map((group, groupIndex) => (
                            <Card
                                key={groupIndex}
                                sx={{
                                    mb: 4,
                                    p: 1,
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f1f8f0ff 100%)',
                                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                                    border: '1px solid #e8ebe5ff',
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: '#1a3c34',
                                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                            }}
                                        >
                                            <span style={{ fontWeight: 600 }}>Cargo:</span> {group.role}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ background: 'linear-gradient(to right, #2e7d32, #4caf50)', height: '2px', mb: 2 }} />
                                    <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '8px' }}>
                                        <Table sx={{ minWidth: 650 }} aria-label="user table">
                                            <TableHead>
                                                <TableRow sx={{ height: '40px' }}>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Nome</TableCell>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Código do Nome</TableCell>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Email</TableCell>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Cargo</TableCell>
                                                    <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Ações</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {group.users.map((user, index) => (
                                                    <TableRow
                                                        key={user.registration}
                                                        sx={{
                                                            backgroundColor: index % 2 === 0 ? '#FFF' : '#F4F7FC',
                                                            height: 50,
                                                        }}
                                                    >
                                                        <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{user.name}</TableCell>
                                                        <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{user.nameCode}</TableCell>
                                                        <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{user.email}</TableCell>
                                                        <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{formatRole(user.role)}</TableCell>
                                                        <TableCell align="center" sx={{ py: 0.5 }}>
                                                            <Tooltip title="Editar" arrow>
                                                                <IconButton
                                                                    aria-label="edit"
                                                                    sx={{ color: '#2e7d32', p: 0.5 }}
                                                                    onClick={() => handleOpenDialog(user)}
                                                                >
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Typography align="center" variant="h6" color="text.secondary">
                            Nenhum usuário encontrado.
                        </Typography>
                    )}
                </Box>
            )}

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                fullWidth
                maxWidth={isMobile ? 'xs' : 'sm'}
                sx={{
                    '& .MuiDialog-paper': {
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        width: { xs: '90%', sm: '100%' },
                        margin: { xs: 2, sm: 4 },
                    },
                }}
            >
                <DialogContent sx={{ p: { xs: 2, sm: 4 } }}>
                    {editingUser ? (
                        <UserEdit
                            userId={editingUser.id}
                            onUserRegistered={handleUserRegistered}
                            onClose={handleCloseDialog}
                            setAlert={setAlert}
                        />
                    ) : (
                        <RegisterUser
                            onUserRegistered={handleUserRegistered}
                            onClose={handleCloseDialog}
                            setAlert={setAlert}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {userToDelete && (
                <UserDelete
                    open={deleteDialogOpen}
                    onClose={handleCloseDeleteDialog}
                    user={userToDelete}
                    onUserDeleted={handleUserDeleted}
                    setAlert={setAlert}
                />
            )}

            {alert.show && (
                <AlertMessage message={alert.message} type={alert.type} onClose={handleCloseAlert} />
            )}
        </Box>
    );
};

export default UserList;