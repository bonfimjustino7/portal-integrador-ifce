import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Button, Divider } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useLocation, useParams } from 'react-router-dom';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import api from '../../service/api';
import AlertMessage from '../../components/AlertMessage';
import SearchInput from '../../components/SearchInput';
import AssociateDiscipline from './AssociateDiscipline';

const DetailsCurricularMatrix = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { matrixId } = useParams();
  const matrixName = location.state?.matrixName || 'Matriz Curricular';
  const userId = location.state?.userId;
  const courseId = location.state?.courseId;
  const gridCourseId = matrixId;
  const [semesters, setSemesters] = useState([]);
  const [expandedSemesters, setExpandedSemesters] = useState({});
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openAssociateDialog, setOpenAssociateDialog] = useState(false);

  const getCoordinatorId = () => {
    return userId || localStorage.getItem('coordinatorId');
  };

  const normalizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const coordinatorId = getCoordinatorId();
      if (!coordinatorId) {
        throw new Error('ID do coordenador não encontrado');
      }
      const response = await api.get(`/course-grid/grid-course/${matrixId}`);
      const gridData = response.data;

      if (gridData.length === 0) {
        throw new Error('Nenhuma matriz curricular encontrada');
      }

      const firstGrid = gridData[0];

      const formattedSemesters = firstGrid.semesters.map((semester, index) => ({
        semesterId: semester.semesterId,
        semesterCode: semester.semesterCode.split('-')[1].replace('S',''),
        disciplines: semester.disciplines.map(discipline => ({
          code: discipline.disciplineCode,
          name: discipline.disciplineName,
          credits: discipline.DisciplineCredit,
          workload: discipline.DisciplineWorkLoad,
          type: discipline.type,
        })),
      }));

      setSemesters(formattedSemesters);
      setExpandedSemesters(
        formattedSemesters.reduce((acc, semester) => ({ ...acc, [semester.semesterCode]: true }), {})
      );
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.message.includes('Request failed with status code 404')) {
        setSemesters([]);
        setError('custom');
      } else {
        setError(err.message || 'Falha ao carregar os dados da matriz curricular. Tente novamente mais tarde.');
        setAlert({
          show: true,
          message: err.message || 'Falha ao carregar os dados da matriz curricular.',
          type: 'error',
        });
      }
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [matrixId]);

  const handleToggleExpand = (semesterCode) => {
    setExpandedSemesters((prev) => ({
      ...prev,
      [semesterCode]: !prev[semesterCode],
    }));
  };

  const handleAssociateDisciplineClick = () => {
    setOpenAssociateDialog(true);
  };

  const handleCloseAssociateDialog = () => {
    setOpenAssociateDialog(false);
  };

  const handleAssociated = () => {
    fetchCourseData();
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, show: false });
  };

  const filteredSemesters = semesters.map(semester => ({
    ...semester,
    disciplines: semester.disciplines.filter(discipline =>
      normalizeString(discipline.name).includes(normalizeString(searchTerm))
    ),
  })).filter(semester => semester.disciplines.length > 0);

  return (
    <Box sx={{ mx: { xs: 2, md: 4 }, mt: { xs: 6, md: 0 } }}>
      <Typography
        variant={isMobile ? 'h6' : 'h5'}
        align="center"
        sx={{ fontWeight: 'bold', color: '#333', mb: { xs: 2, md: 1 } }}
      >
        Detalhes da Matriz Curricular
      </Typography>
      <Typography
        variant={isMobile ? 'body1' : 'h6'}
        align="center"
        sx={{ color: '#333', mt: 0.5, mb: 4 }}
      >
        {matrixName}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2,
        }}
      >
        <Box sx={{ width: { xs: '100%', md: 'auto', maxWidth: 400 } }}>
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar disciplina por nome..."
            sx={{ width: '100%' }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          <Button
            variant="contained"
            onClick={handleAssociateDisciplineClick}
            sx={{
              height: '40px',
              backgroundColor: '#2e7d32',
              '&:hover': { backgroundColor: '#1b5e20' },
              textTransform: 'none',
              flexGrow: { xs: 1, md: 0 },
            }}
          >
            Associar Disciplina
          </Button>
        </Box>
      </Box>

      {loading && (
        <Typography variant="body1" sx={{ color: '#666', mb: 2, textAlign: 'center' }}>
          Carregando disciplinas...
        </Typography>
      )}

      {!loading && error === 'custom' && (
        <Typography align="center" variant="h6" color="text.secondary" fontSize={'16px'}>
          Nenhuma disciplina encontrada para a matriz curricular.<br />É necessário associar disciplina para serem listadas aqui.
        </Typography>
      )}

      {!loading && error && error !== 'custom' && (
        <Typography align="center" variant="h6" color="text.secondary">
          {error}
        </Typography>
      )}

      {!loading && !error && filteredSemesters.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredSemesters.map((semester) => (
            <Card
              key={semester.semesterCode}
              sx={{
                mb: 4,
                p: 2,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#1a3c34',
                      fontSize: '1rem',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>Semestre: {semester.semesterCode}</span>
                  </Typography>
                  <IconButton size="small" onClick={() => handleToggleExpand(semester.semesterCode)}>
                    {expandedSemesters[semester.semesterCode] ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
                <Divider sx={{ background: 'linear-gradient(to right, #2e7d32, #4caf50)', height: '2px', mb: 2 }} />
                <Collapse in={expandedSemesters[semester.semesterCode]} timeout="auto" unmountOnExit>
                  {isMobile ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {semester.disciplines.length > 0 ? (
                        semester.disciplines.map((discipline) => (
                          <Card
                            key={discipline.code}
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
                                  fontSize: '0.95rem',
                                }}
                              >
                                <span style={{ fontWeight: 600 }}>Disciplina:</span> {discipline.name}
                              </Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                <strong>Código:</strong> {discipline.code}
                              </Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                <strong>Carga Horária:</strong> {discipline.workload}h
                              </Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                <strong>Créditos:</strong> {discipline.credits}
                              </Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                                <strong>Tipo:</strong> {discipline.type}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Typography align="center" variant="body1" sx={{ color: '#666', fontSize: '0.85rem' }}>
                          Nenhuma disciplina encontrada para esse semestre.
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '8px' }}>
                      <Table aria-label="disciplines table">
                        <TableHead>
                          <TableRow sx={{ height: '40px' }}>
                            <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
                              Disciplinas
                            </TableCell>
                            <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
                              Código
                            </TableCell>
                            <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
                              Carga Horária
                            </TableCell>
                            <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
                              Créditos
                            </TableCell>
                            <TableCell align="center" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
                              Tipo
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {semester.disciplines.length > 0 ? (
                            semester.disciplines.map((discipline, index) => (
                              <TableRow
                                key={discipline.code}
                                sx={{
                                  backgroundColor: index % 2 === 0 ? '#FFF' : '#F4F7FC',
                                  height: 50,
                                }}
                              >
                                <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>
                                  {discipline.name}
                                </TableCell>
                                <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>
                                  {discipline.code}
                                </TableCell>
                                <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>
                                  {discipline.workload}h
                                </TableCell>
                                <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>
                                  {discipline.credits}
                                </TableCell>
                                <TableCell align="center" sx={{ py: 0.5, fontSize: '0.85rem', color: '#333' }}>
                                  {discipline.type}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} sx={{ fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>
                                Nenhuma disciplina encontrada para esse semestre.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {!loading && !error && filteredSemesters.length === 0 && (
        <Typography align="center" variant="h6" color="text.secondary">
          Nenhuma disciplina encontrada para o termo pesquisado.
        </Typography>
      )}

      {alert.show && (
        <AlertMessage message={alert.message} type={alert.type} onClose={handleCloseAlert} />
      )}

      <AssociateDiscipline
        open={openAssociateDialog}
        onClose={handleCloseAssociateDialog}
        courseId={courseId}
        gridCourseId={gridCourseId}
        onAssociated={handleAssociated}
        setAlert={setAlert}
      />
    </Box>
  );
};

export default DetailsCurricularMatrix;