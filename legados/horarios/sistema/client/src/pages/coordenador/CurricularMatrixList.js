import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent
} from '@mui/material';
import { AutoStories as AutoStoriesIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { EventBusy } from '@mui/icons-material';
import Paginate from '../../components/Paginate';
import api from '../../service/api';
import { getToken } from '../../service/auth';
import { jwtDecode } from 'jwt-decode';
import { AlertMessage } from '../../components/AlertMessage';
import { useNavigate, useLocation } from 'react-router-dom';
import RegisterCurricularMatrix from './RegisterCurricularMatrix';
import CurricularMatrixDelete from './CurricularMatrixDelete';

const getUserIdFromToken = () => {
  const token = getToken();
  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }
  const decoded = jwtDecode(token);
  const userId = decoded.id;
  if (!userId) {
    throw new Error('ID do usuário não encontrado no token');
  }
  return userId;
};

const CustomMatrixCard = ({ icon, title, updateAt, onClick, onEdit, onDelete }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: theme.shape.borderRadius * 0.5,
        marginBottom: '15px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: { xs: '100%', sm: '280px' },
        width: { xs: '100%', sm: '320px' },
        maxWidth: '320px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
        '&:hover': {
          boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)',
          transform: 'translateY(-5px)',
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        aria-label={`Ver matriz curricular ${title}`}
        sx={{
          width: '100%',
          height: '80%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CardContent sx={{ textAlign: 'center', p: 3, flexGrow: 1, width: '100%' }}>
          {icon}
          <Typography
            gutterBottom
            variant="h5"
            component="div"
            sx={{
              fontSize: '15px',
              fontWeight: 'bold',
              color: '#333',
              mt: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {title}
          </Typography>
          {updateAt && new Date(updateAt).toString() !== 'Invalid Date' && (
            <Typography
              variant="body2"
              sx={{ fontSize: '13px', color: '#555', mt: 1 }}
            >
              Última Atualização: {new Date(updateAt).toLocaleDateString()}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
        <Tooltip title="Editar">
          <IconButton
            aria-label="Editar"
            onClick={onEdit}
            sx={{
              color: '#2e7d32',
              '&:hover': {
                backgroundColor: 'rgba(46, 125, 50, 0.08)',
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
                transform: 'translateY(-1px)',
              },
              padding: '8px',
              borderRadius: '50%',
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton
            aria-label="Excluir"
            color="error"
            onClick={onDelete}
            sx={{
              padding: '8px',
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
                transform: 'translateY(-1px)',
              },
              borderRadius: '50%',
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
};

const CurricularMatrixList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const validRoles = ['Coordenador'];
  const userRole = localStorage.getItem('role') && validRoles.includes(localStorage.getItem('role'))
    ? localStorage.getItem('role')
    : 'Coordenador';

  const [allMatrices, setAllMatrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [coordinatorId, setCoordinatorId] = useState(null);
  const [editingMatrix, setEditingMatrix] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [matrixToDelete, setMatrixToDelete] = useState(null);
  const userId = getUserIdFromToken();
  const itemsPerPage = 3;

  useEffect(() => {
    if (location.state?.message && location.state?.type) {
      setAlert({
        message: location.state.message,
        type: location.state.type,
      });

      const timer = setTimeout(() => {
        setAlert(null);
        navigate(location.pathname, { replace: true, state: {} });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const fetchMatrices = async () => {
      setLoading(true);
      try {
        setCoordinatorId(userId);
        const token = getToken();
        const response = await api.get(`/course-grid/coordination/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        const formattedMatrices = data.map((matrix) => ({
          id: matrix.id,
          name: matrix.name,
          updateAt: matrix.updatedAt,
          courseId: matrix.courseId,
        }));
        setAllMatrices(formattedMatrices);
      } catch (err) {
        const message = err.message || 'Erro ao carregar matrizes curriculares.';
        setAlert({ message, type: 'error' });
        console.error('Error fetching matrices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatrices();
  }, [userRole]);

  useEffect(() => {
    setCurrentPage(1);
  }, [allMatrices]);

  const formatUserRoleForUrl = (role) => {
    return role ? role.toLowerCase().replace(/ /g, '_') : 'diretor_ensino';
  };

  const handleMatrixClick = (matrixId, matrixName, courseId) => {
    const user = formatUserRoleForUrl(userRole);
    if (!courseId) {
      setAlert({
        message: 'ID do curso não encontrado para esta matriz. Tente novamente.',
        type: 'error',
      });
      return;
    }
    navigate(`/${user}/matrizes-curriculares/${matrixId}`, {
      state: { matrixName, userId, matrixId, courseId },
    });
  };

  const handleCreateMatrix = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMatrix(null);
  };

  const handleMatrixCreated = () => {
    setOpenDialog(false);
    const fetchMatrices = async () => {
      try {
        const token = getToken();
        const response = await api.get(`/course-grid/coordination/${coordinatorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        const formattedMatrices = data.map((matrix) => ({
          id: matrix.id,
          name: matrix.name,
          updateAt: matrix.updatedAt,
          courseId: matrix.courseId,
        }));
        setAllMatrices(formattedMatrices);
      } catch (err) {
        setAlert({ message: 'Erro ao atualizar lista de matrizes.', type: 'error' });
      }
    };
    fetchMatrices();
  };

  const handleEditMatrix = (matrix) => {
    setOpenDialog(true);
    setEditingMatrix(matrix);
  };

  const handleOpenDeleteDialog = (matrix) => {
    setMatrixToDelete(matrix);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setMatrixToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleMatrixDeleted = (matrixId) => {
    setAllMatrices((prev) => prev.filter((matrix) => matrix.id !== matrixId));
    handleCloseDeleteDialog();
  };

  const totalPages = Math.ceil(allMatrices.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMatrices = allMatrices.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#2e7d32', mr: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Carregando matrizes curriculares...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mx: { xs: 2, sm: 4 }, mt: { xs: 6, sm: 2 }, flexGrow: 1 }}>
      {alert && (
        <AlertMessage
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      <Typography
        variant={isMobile ? 'h6' : 'h5'}
        gutterBottom
        align="center"
        sx={{
          fontWeight: 'bold',
          mb: { xs: 2, sm: 4 },
          fontSize: { xs: 18, sm: 28 },
          color: '#333',
        }}
      >
        Lista de Matrizes Curriculares
      </Typography>

      {allMatrices.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <EventBusy sx={{ fontSize: 60, color: '#999', mb: 2 }} />
          <Typography
            variant="body1"
            align="center"
            sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555' }}
          >
            Nenhuma matriz curricular foi encontrada.
          </Typography>
          <Typography
            variant="body1"
            align="center"
            sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555' }}
          >
            É necessário criar uma matriz curricular para que seja exibida.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateMatrix}
            sx={{
              height: '40px',
              backgroundColor: '#2e7d32',
              '&:hover': { backgroundColor: '#1b5e20' },
              textTransform: 'none',
              width: { xs: '90%', sm: '15%' },
              maxWidth: { sm: 'auto' },
              fontSize: { xs: 14, sm: 16 },
              mt: { xs: 2, sm: 5 },
            }}
          >
            Cadastrar Matriz
          </Button>
        </Box>
      ) : (
        <>
          <Typography
            variant="body1"
            align="center"
            sx={{ fontSize: { xs: 15, sm: 17 }, color: '#555', mt: 2, mb: 2 }}
          >
            Selecione uma matriz curricular abaixo para visualizar as disciplinas associadas.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateMatrix}
              sx={{
                height: '40px',
                backgroundColor: '#2e7d32',
                '&:hover': { backgroundColor: '#1b5e20' },
                textTransform: 'none',
                width: { xs: '90%', sm: '15%' },
                maxWidth: { sm: 'auto' },
                fontSize: { xs: 14, sm: 16 },
                mt: { xs: 2, sm: 0 },
              }}
            >
              Cadastrar Matriz
            </Button>
          </Box>
          <Grid
            container
            columns={{ xs: 4, sm: 8, md: 12 }}
            spacing={isMobile ? 2 : 4}
            justifyContent="center"
            sx={{ mt: 2 }}
          >
            {currentMatrices.map((matrix) => (
              <Grid
                key={matrix.id}
                item
                xs={4}
                sm={4}
                md={4}
                sx={{ display: 'flex', justifyContent: 'center', width: { xs: '90%', sm: '25%' } }}
              >
                <CustomMatrixCard
                  icon={<AutoStoriesIcon sx={{ fontSize: 60, color: '#1D942B' }} />}
                  title={matrix.name}
                  updateAt={matrix.updateAt}
                  onClick={() => handleMatrixClick(matrix.id, matrix.name, matrix.courseId)}
                  onEdit={() => handleEditMatrix(matrix)}
                  onDelete={() => handleOpenDeleteDialog(matrix)}
                />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Paginate
                count={totalPages}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
              />
            </Box>
          )}
        </>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
      >
        <DialogContent>
          <RegisterCurricularMatrix
            open={openDialog}
            onClose={handleCloseDialog}
            coordinatorId={coordinatorId}
            onCreated={handleMatrixCreated}
            setAlert={setAlert}
            matrixData={editingMatrix}
          />
        </DialogContent>
      </Dialog>

      <CurricularMatrixDelete
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        matrix={matrixToDelete}
        onMatrixDeleted={handleMatrixDeleted}
        setAlert={setAlert}
      />
    </Box>
  );
};

export default CurricularMatrixList;