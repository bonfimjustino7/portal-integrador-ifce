import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  IconButton,
  Button,
  Box,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  styled,
  Dialog,
  DialogContent,
  Tooltip,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import api from '../../service/api';
import { getToken, getUserId } from '../../service/auth';
import SearchInput from '../../components/SearchInput';
import Paginate from '../../components/Paginate';
import AlertMessage from '../../components/AlertMessage';
import RegisterDiscipline from './RegisterDiscipline';
import DisciplineDelete from './DisciplineDelete';

const DISCIPLINES_PER_PAGE = 8;

const ActionIconsContainerMobile = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: theme.spacing(1),
  gap: theme.spacing(1),
}));

const DisciplineList = () => {
  const [disciplines, setDisciplines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [disciplineToDelete, setDisciplineToDelete] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [page, setPage] = useState(1);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchDisciplines = async () => {
    setLoading(true);
    setError(null);
    const token = getToken();

    if (token) {
      try {
        const response = await api.get(`/disciplines/coordination/${getUserId()}`);
        setDisciplines(response.data);
      } catch (error) {
        console.error('Erro ao buscar disciplinas:', error);
        setError('Erro ao carregar a lista de disciplinas.');
        setAlert({ show: true, message: 'Erro ao carregar a lista de disciplinas.', type: 'error' });
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
    fetchDisciplines();
  }, []);

  const handleOpenDialog = (discipline = null) => {
    setEditingDiscipline(discipline);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDiscipline(null);
  };

  const handleCloseDialogDelete = () => {
    setDeleteDialogOpen(false);
    setDisciplineToDelete(null);
  };

  const handleOpenDeleteDialog = (discipline) => {
    setDisciplineToDelete(discipline);
    setDeleteDialogOpen(true);
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, show: false });
  };

  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };

  const normalizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    const normalizedValue = normalizeString(value);
    setSearchTerm(normalizedValue);
    setPage(1);
  };

  const filteredDisciplines = disciplines.filter((discipline) => {
    const normalizedSearchTerm = normalizeString(searchTerm);
    const nameMatches = normalizeString(discipline.name).includes(normalizedSearchTerm);
    const codeMatches = normalizeString(discipline.code).includes(normalizedSearchTerm);
    return nameMatches || codeMatches;
  });

  const totalPages = Math.ceil(filteredDisciplines.length / DISCIPLINES_PER_PAGE);
  const disciplinesOnCurrentPage = filteredDisciplines.slice(
    (page - 1) * DISCIPLINES_PER_PAGE,
    page * DISCIPLINES_PER_PAGE
  );

  if (loading) return <Typography variant="body1">Carregando lista de disciplinas...</Typography>;

  return (
    <Box sx={{ mx: { xs: 2, sm: 4 }, mt: { xs: 6, sm: 2 } }}>
      <Typography
        variant={isMobile ? 'h6' : 'h5'}
        gutterBottom
        align="center"
        sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 4 }, color: '#333' }}
      >
        Lista de Disciplinas
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <SearchInput
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Buscar disciplina..."
          sx={{ width: { xs: '100%', sm: 'auto', maxWidth: 400 } }}
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
          Cadastrar Disciplina
        </Button>
      </Box>

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredDisciplines.length > 0 ? (
            disciplinesOnCurrentPage.map((discipline) => (
              <Card
                key={discipline.id}
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
                      fontSize: { xs: '0.9rem', sm: '0.95rem' },
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>Nome:</span> {discipline.name}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                    <strong>Código:</strong> {discipline.code}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                    <strong>Carga Horária:</strong> {discipline.workload}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                    <strong>Créditos:</strong> {discipline.credit}
                  </Typography>
                  <ActionIconsContainerMobile>
                    <Tooltip title="Editar">
                      <IconButton
                        aria-label="edit"
                        sx={{ color: '#2e7d32' }}
                        onClick={() => handleOpenDialog(discipline)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton
                        aria-label="delete"
                        sx={{ color: '#d32f2f' }}
                        onClick={() => handleOpenDeleteDialog(discipline)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </ActionIconsContainerMobile>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography align="center" variant="h6" color="text.secondary">
              Nenhuma disciplina encontrada.
            </Typography>
          )}
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '8px' }}>
          <Table sx={{ minWidth: 650 }} aria-label="discipline table">
            <TableHead>
              <TableRow sx={{ height: '40px' }}>
                <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Nome</TableCell>
                <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Código</TableCell>
                <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>CH</TableCell>
                <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>CR</TableCell>
                <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDisciplines.length > 0 ? (
                disciplinesOnCurrentPage.map((discipline, index) => (
                  <TableRow
                    key={discipline.id}
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#FFF' : '#F4F7FC',
                      height: 50,
                    }}
                  >
                    <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{discipline.name}</TableCell>
                    <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{discipline.code}</TableCell>
                    <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{discipline.workload}</TableCell>
                    <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>{discipline.credit}</TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Tooltip title="Editar">
                        <IconButton
                          aria-label="edit"
                          sx={{ color: '#2e7d32', p: 0.5 }}
                          onClick={() => handleOpenDialog(discipline)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          aria-label="delete"
                          sx={{ color: '#d32f2f', p: 0.5 }}
                          onClick={() => handleOpenDeleteDialog(discipline)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Nenhuma disciplina encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {totalPages > 1 && filteredDisciplines.length > 0 && (
        <Paginate count={totalPages} page={page} onChange={handlePageChange} />
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
      >
        <DialogContent>
          <RegisterDiscipline
            open={openDialog}
            onClose={handleCloseDialog}
            initialDiscipline={editingDiscipline}
            onCreated={fetchDisciplines}
            onUpdated={fetchDisciplines}
            setAlert={setAlert}
          />
        </DialogContent>
      </Dialog>

      <DisciplineDelete
        onClose={handleCloseDialogDelete}
        open={deleteDialogOpen}
        setAlert={setAlert}
        discipline={disciplineToDelete}
        onDisciplineDeleted={fetchDisciplines}
      />

      {alert.show && (
        <AlertMessage message={alert.message} type={alert.type} onClose={handleCloseAlert} />
      )}
    </Box>
  );
};

export default DisciplineList;