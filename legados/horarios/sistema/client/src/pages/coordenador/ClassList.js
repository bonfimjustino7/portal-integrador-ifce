import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Paper, IconButton, Button, Box, useMediaQuery,
  useTheme, Card, CardContent, styled, Tooltip, Divider
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import api from '../../service/api';
import { getToken } from '../../service/auth';
import SearchInput from '../../components/SearchInput';
import AlertMessage from '../../components/AlertMessage';
import RegisterClass from './RegisterClass';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { jwtDecode } from 'jwt-decode';

const ActionIconsContainerMobile = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: theme.spacing(1),
  '& > *:not(:last-child)': {
    marginRight: theme.spacing(1),
  },
}));

const ClassList = () => {
  const [classes, setClasses] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openClassDialog, setOpenClassDialog] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [coordinatorId, setCoordinatorId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    const token = getToken();

    if (!token) {
      setError('Usuário não autenticado.');
      setAlert({ show: true, message: 'Usuário não autenticado.', type: 'warning' });
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const coordinatorId = decoded.id;
      const userRole = decoded.role;

      setCoordinatorId(coordinatorId);
      setUserRole(userRole);

      if (userRole === 'Coordenador') {
        const response = await api.get(`/classes/coordinator/${coordinatorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClasses(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar turmas:", err);
      setError('Erro ao carregar turmas.');
      setAlert({ show: true, message: 'Erro ao carregar turmas.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleOpenClassDialog = async (classe = null) => {
    if (classe) {
      try {
        const token = getToken();
        if (!token) {
          setAlert({ show: true, message: 'Usuário não autenticado.', type: 'warning' });
          return;
        }

        const response = await api.get(`/classes/${classe.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEditingClass(response.data);
      } catch (err) {
        console.error('Erro ao buscar dados da turma:', err);
        setAlert({
          show: true,
          message: err.response?.data?.error || 'Erro ao carregar dados da turma.',
          type: 'error',
        });
        return;
      }
    } else {
      setEditingClass(null);
    }
    setOpenClassDialog(true);
  };

  const handleToggleInactive = () => {
    setShowInactive((prev) => !prev);
  };

  const handleCloseClassDialog = () => {
    setOpenClassDialog(false);
    setEditingClass(null);
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, show: false });
  };

  const normalizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const filteredClasses = classes.filter((c) => {
    if (userRole === 'Coordenador' && !c.course) {
      return false;
    }

    if (showInactive && c.active) return false;
    if (!showInactive && !c.active) return false;
    const normalizedSearchTerm = normalizeString(searchTerm);
    return normalizeString(c.code).includes(normalizedSearchTerm);
  });

  const groupedClasses = filteredClasses.reduce((acc, classe) => {
    const key = classe.calendar?.name;
    if (!acc[key]) {
      acc[key] = {
        calendar: key,
        classes: [],
      };
    }
    acc[key].classes.push(classe);
    return acc;
  }, {});

  const groupedClassesArray = Object.values(groupedClasses).sort((a, b) =>
    a.calendar.localeCompare(b.calendar)
  );

  if (loading) return <Typography variant="body1">Carregando lista de turmas...</Typography>;

  return (
    <Box sx={{ mx: { xs: 2, md: 4 }, mt: { xs: 6, md: 0 } }}>
      <Typography
        variant={isMobile ? 'h6' : 'h5'}
        gutterBottom
        align="center"
        sx={{ fontWeight: 'bold', color: '#333', mb: { xs: 2, md: 4 } }}
      >
        {showInactive ? 'Lista de Turmas Desativadas' : 'Lista de Turmas Ativas'}
      </Typography>

      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        gap: 2,
      }}>
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar turma por código..."
          sx={{ width: { xs: '100%', md: 'auto', maxWidth: 400 } }}
        />

        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          <Button
            variant="contained"
            onClick={handleToggleInactive}
            sx={{
              height: '40px',
              backgroundColor: showInactive ? '#d32f2f' : '#2e7d32',
              '&:hover': { backgroundColor: showInactive ? '#b71c1c' : '#1b5e20' },
              textTransform: 'none',
              flexGrow: { xs: 1, md: 0 },
            }}
          >
            {showInactive ? 'Turmas Ativas' : 'Turmas Desativadas'}
          </Button>

          <Button
            variant="contained"
            onClick={() => handleOpenClassDialog(null)}
            sx={{
              height: '40px',
              backgroundColor: '#2e7d32',
              '&:hover': { backgroundColor: '#1b5e20' },
              textTransform: 'none',
              flexGrow: { xs: 1, md: 0 },
            }}
          >
            Cadastrar Turma
          </Button>
        </Box>
      </Box>

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {groupedClassesArray.length > 0 ? (
            groupedClassesArray.map((group, groupIndex) => (
              <Card
                key={groupIndex}
                sx={{
                  mb: 4,
                  p: 2,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#1a3c34',
                        fontSize: '1rem',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Calendário:</span> {group.calendar}
                    </Typography>
                  </Box>
                  <Divider sx={{ background: 'linear-gradient(to right, #2e7d32, #4baf4fff)', height: '2px', mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {group.classes.map((classe) => (
                      <Card
                        key={classe.id}
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
                              fontSize: '0.95rem'
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>Turma:</span> {classe.code}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                            <strong>Matriz Curricular:</strong> {classe.gridCourse?.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                            <strong>Turno:</strong> {classe.turn?.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                            <strong>Status:</strong>{' '}
                            <Box component="span" sx={{ color: classe.active ? 'green' : 'red' }}>
                              {classe.active ? (
                                <Tooltip title="Ativa" arrow>
                                  <CheckCircle sx={{ verticalAlign: 'middle', color: '#2e7d32' }} />
                                </Tooltip>
                              ) : (
                                <Tooltip title="Inativa" arrow>
                                  <Cancel sx={{ verticalAlign: 'middle', color: '#d32f2f' }} />
                                </Tooltip>
                              )}
                            </Box>
                          </Typography>
                          <ActionIconsContainerMobile>
                            <Tooltip title="Editar">
                              <IconButton
                                aria-label="edit"
                                sx={{ color: '#2e7d32' }}
                                onClick={() => handleOpenClassDialog(classe)}
                              >
                                <Edit />
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
              Nenhuma turma encontrada.
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {groupedClassesArray.length > 0 ? (
            groupedClassesArray.map((group, groupIndex) => (
              <Card
                key={groupIndex}
                sx={{
                  mb: 4,
                  p: 2,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#1a3c34',
                        fontSize: '1rem',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Calendário:</span> {group.calendar}
                    </Typography>
                  </Box>
                  <Divider sx={{ background: 'linear-gradient(to right, #2e7d32, #4caf50)', height: '2px', mb: 2 }} />
                  <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '8px' }}>
                    <Table aria-label="simple table">
                      <TableHead>
                        <TableRow sx={{ height: '40px' }}>
                          <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Código</TableCell>
                          <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Matriz Curricular</TableCell>
                          <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Turno</TableCell>
                          <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Status</TableCell>
                          <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Ações</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {group.classes.map((classe, index) => (
                          <TableRow
                            key={classe.id}
                            sx={{
                              backgroundColor: index % 2 === 0 ? '#FFF' : '#F4F7FC',
                              height: 50,
                            }}
                          >
                            <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{classe.code}</TableCell>
                            <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{classe.gridCourse?.name}</TableCell>
                            <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{classe.turn?.name}</TableCell>
                            <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem' }}>
                              {classe.active ? (
                                <Tooltip title="Ativa" arrow>
                                  <CheckCircle sx={{ color: '#2e7d32', verticalAlign: 'middle' }} />
                                </Tooltip>
                              ) : (
                                <Tooltip title="Inativa" arrow>
                                  <Cancel sx={{ color: '#d32f2f', verticalAlign: 'middle' }} />
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell align="center" sx={{ py: 0.5 }}>
                              <Tooltip title="Editar">
                                <IconButton
                                  aria-label="edit"
                                  sx={{ color: '#2e7d32', p: 0.5 }}
                                  onClick={() => handleOpenClassDialog(classe)}
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
              Nenhuma turma encontrada.
            </Typography>
          )}
        </Box>
      )}

      {alert.show && (
        <AlertMessage message={alert.message} type={alert.type} onClose={handleCloseAlert} />
      )}
      <RegisterClass
        open={openClassDialog}
        onClose={handleCloseClassDialog}
        initialClass={editingClass}
        onCreated={fetchClasses}
        onUpdated={fetchClasses}
        setAlert={setAlert}
      />
    </Box>
  );
};

export default ClassList;