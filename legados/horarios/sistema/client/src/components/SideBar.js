import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  IconButton,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  People,
  ExitToApp,
  Menu as MenuIcon,
  School,
  AssignmentInd,
  Book,
  Group,
  Event,
  CalendarMonth,
  Assignment
} from '@mui/icons-material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { useNavigate } from 'react-router-dom';
import { logout } from '../service/auth';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const Sidebar = ({ setAuthenticated }) => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogoutClick = () => {
    setOpenDialog(true);
  };

  const handleLogoutConfirm = () => {
    setOpenDialog(false);
    if (isMobile) {
      setMobileOpen(false);
    }
    logout(setAuthenticated);
    navigate('/login', { replace: true });
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const drawer = (
    <div>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          borderBottom: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Gestão de Horários
        </Typography>
      </Box>
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <People sx={{ color: '#a5d6a7', mr: 1 }} />
          <Typography variant="body2">{localStorage.getItem('username')}</Typography>
        </Box>
      </Box>

      <List sx={{ flex: 1 }}>
        {userRole === 'Admin' && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="caption"
              sx={{ px: 2, color: '#a5d6a7', fontWeight: 500, textTransform: 'uppercase' }}
            >
              Gerenciamento
            </Typography>
            <ListItem
              button
              onClick={() => {
                navigate('/admin/usuarios');
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              sx={{ py: 1, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' } }}
            >
              <ListItemIcon>
                <People sx={{ color: '#a5d6a7' }} />
              </ListItemIcon>
              <ListItemText primary="Usuários" primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItem>
          </Box>
        )}
      </List>

      <List sx={{ flex: 1 }}>
        {userRole === 'Diretor Ensino' && (
          <>
            <Box sx={{ mt: 0 }}>
              <Typography
                variant="caption"
                sx={{ px: 2, color: '#a5d6a7', fontWeight: 500, textTransform: 'uppercase' }}
              >
                Horários
              </Typography>

              <ListItem
                button
                onClick={() => {
                  navigate(`/${userRole.toLowerCase().replace(/ /g, '_')}/horarios-gerados`);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ py: 1.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' } }}
              >
                <ListItemIcon>
                  <CalendarMonth sx={{ color: '#a5d6a7' }} />
                </ListItemIcon>
                <ListItemText primary="Grade de Horários" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
            </Box>

            <Box sx={{ mt: 1 }}>
              <Typography
                variant="caption"
                sx={{ px: 2, color: '#a5d6a7', fontWeight: 500, textTransform: 'uppercase' }}
              >
                Planejamento
              </Typography>

              <ListItem
                button
                onClick={() => {
                  navigate(`/${userRole.toLowerCase().replace(/ /g, '_')}/selecao-planejamento-docente`);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ py: 1.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' } }}
              >
                <ListItemIcon>
                  <Assignment sx={{ color: '#a5d6a7' }} />
                </ListItemIcon>
                <ListItemText primary="Docente" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
            </Box>

            <Box sx={{ mt: 1 }}>
              <Typography
                variant="caption"
                sx={{ px: 2, color: '#a5d6a7', fontWeight: 500, textTransform: 'uppercase' }}
              >
                Gerenciamento
              </Typography>

              <ListItem
                button
                onClick={() => {
                  navigate(`/${userRole.toLowerCase().replace(/ /g, '_')}/cursos`);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ py: 1.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' } }}
              >
                <ListItemIcon>
                  <School sx={{ color: '#a5d6a7' }} />
                </ListItemIcon>
                <ListItemText primary="Cursos" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>

              <ListItem
                button
                onClick={() => {
                  navigate(`/${userRole.toLowerCase().replace(/ /g, '_')}/professores`);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ py: 1.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' } }}
              >
                <ListItemIcon>
                  <AssignmentInd sx={{ color: '#a5d6a7' }} />
                </ListItemIcon>
                <ListItemText primary="Professores" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>

              <ListItem
                button
                onClick={() => {
                  navigate(`/${userRole.toLowerCase().replace(/ /g, '_')}/calendarios`);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ py: 1.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' } }}
              >
                <ListItemIcon>
                  <Event sx={{ color: '#a5d6a7' }} />
                </ListItemIcon>
                <ListItemText primary="Calendários" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
            </Box>
          </>
        )}

        {userRole === 'Coordenador' && (
          <>
            <Box sx={{ mt: 0 }}>
              <Typography
                variant="caption"
                sx={{ px: 2, color: '#a5d6a7', fontWeight: 500, textTransform: 'uppercase' }}
              >
                Horários
              </Typography>

              <ListItem
                button
                onClick={() => {
                  navigate(`/${userRole.toLowerCase().replace(/ /g, '_')}/horarios`);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ py: 1.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' } }}
              >
                <ListItemIcon>
                  <CalendarMonth sx={{ color: '#a5d6a7' }} />
                </ListItemIcon>
                <ListItemText primary="Horário Acadêmico" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
            </Box>
            <Box sx={{ mt: 1 }}>
              <Typography
                variant="caption"
                sx={{ px: 2, color: '#a5d6a7', fontWeight: 500, textTransform: 'uppercase' }}
              >
                Planejamento
              </Typography>

              <ListItem
                button
                onClick={() => {
                  navigate(`/${userRole.toLowerCase().replace(/ /g, '_')}/planejamento-docente`);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ py: 1.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' } }}
              >
                <ListItemIcon>
                  <Assignment sx={{ color: '#a5d6a7' }} />
                </ListItemIcon>
                <ListItemText primary="Docente" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
            </Box>

            <Box sx={{ mt: 1 }}>
              <Typography
                variant="caption"
                sx={{ px: 2, color: '#a5d6a7', fontWeight: 500, textTransform: 'uppercase' }}
              >
                Gerenciamento do Curso
              </Typography>

              <ListItem
                button
                onClick={() => {
                  navigate(`/${userRole.toLowerCase().replace(/ /g, '_')}/turmas`);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ py: 1.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' } }}
              >
                <ListItemIcon>
                  <Group sx={{ color: '#a5d6a7' }} />
                </ListItemIcon>
                <ListItemText primary="Turmas" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>

              <ListItem
                button
                onClick={() => {
                  navigate(`/${userRole.toLowerCase().replace(/ /g, '_')}/disciplinas`);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ py: 1.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' } }}
              >
                <ListItemIcon>
                  <Book sx={{ color: '#a5d6a7' }} />
                </ListItemIcon>
                <ListItemText primary="Disciplinas" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>

              <ListItem
                button
                onClick={() => {
                  navigate(`/${userRole.toLowerCase().replace(/ /g, '_')}/matrizes-curriculares`);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ py: 1.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' } }}
              >
                <ListItemIcon>
                  <AutoStoriesIcon sx={{ color: '#a5d6a7' }} />
                </ListItemIcon>
                <ListItemText primary="Matriz Curricular" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
            </Box>
          </>
        )}

        {userRole === 'Professor' && (
          <>
            <Box sx={{ mt: 0 }}>
              <Typography
                variant="caption"
                sx={{ px: 2, color: '#a5d6a7', fontWeight: 500, textTransform: 'uppercase' }}
              >
                Horários
              </Typography>

              <ListItem
                button
                onClick={() => {
                  navigate(`/${userRole.toLowerCase().replace(/ /g, '_')}/horario-individual`);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ py: 1.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' } }}
              >
                <ListItemIcon>
                  <CalendarMonth sx={{ color: '#a5d6a7' }} />
                </ListItemIcon>
                <ListItemText primary="Meus Horários" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
            </Box>

            <Box sx={{ mt: 0 }}>
              <Typography
                variant="caption"
                sx={{ px: 2, color: '#a5d6a7', fontWeight: 500, textTransform: 'uppercase' }}
              >
                Planejamento
              </Typography>

              <ListItem
                button
                onClick={() => {
                  navigate(`/${userRole.toLowerCase().replace(/ /g, '_')}/preferencias`);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ py: 1.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' } }}
              >
                <ListItemIcon>
                  <CalendarMonth sx={{ color: '#a5d6a7' }} />
                </ListItemIcon>
                <ListItemText primary="Preferências" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
            </Box>
          </>
        )}
      </List>

      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
      <List>
        <ListItem
          button
          sx={{ py: 1.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' } }}
          onClick={handleLogoutClick}
        >
          <ListItemIcon>
            <ExitToApp sx={{ color: '#a5d6a7' }} />
          </ListItemIcon>
          <ListItemText primary="Sair" primaryTypographyProps={{ fontWeight: 500 }} />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box
      sx={{
        display: 'flex',
      }}
    >
      {isMobile ? (
        <AppBar
          position="fixed"
          sx={{
            width: '100%',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            background: 'linear-gradient(to right, #2e7d32, #1b5e20)',
            color: 'white',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'block', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
              Gestão de Horários
            </Typography>
          </Toolbar>
        </AppBar>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
              background: 'linear-gradient(to bottom, #2e7d32, #1b5e20)',
              color: 'white',
              boxShadow: '2px 0 8px rgba(0,0,0,0.2)',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            background: 'linear-gradient(to bottom, #2e7d32, #1b5e20)',
            color: 'white',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        sx={{ '& .MuiDialog-paper': { width: '350px' } }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ color: 'red', textAlign: 'center', textTransform: 'none' }}>
          Confirmar Saída
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#000000', textAlign: 'center' }}>
            Deseja realmente sair do sistema? <br />Sua seção será encerrada.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 1, marginBottom: '15px' }}>
          <Button
            onClick={handleDialogClose}
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
            Não
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            type="submit"
            variant="contained"
            sx={{
              backgroundColor: '#2e7d32',
              '&:hover': { backgroundColor: '#1b5e20' },
              textTransform: 'none',
              minWidth: '100px',
              cursor: 'pointer',
            }}
          >
            Sim
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sidebar;