import React from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Login from '../pages/Login/login';
import Home from '../pages/Home/Home';
import UserList from '../pages/admin/UsersList';
import Layout from '../components/Layout';
import NotFound from '../pages/NotFound';
import VerifyEmail from '../pages/VerifyEmail';
import ResetPassword from '../pages/ResetPassword';
import CourseList from '../pages/diren/CourseList';
import DisciplineList from '../pages/coordenador/DisciplineList';
import ClassList from '../pages/coordenador/ClassList';
import TeacherList from '../pages/diren/TeacherList';
import CalendarList from '../pages/diren/CalendarList';
import { isTokenExpired } from '../service/auth';
import TeacherPlanningList from '../pages/coordenador/TeacherPlanningList';
import RegisterTeachingPlanning from '../pages/coordenador/RegisterTeachingPlanning';
import PreferencesTeacher from '../pages/professor/PreferencesTeacher';
import DocentPlanningList from '../pages/diren/DocentPlanningList';
import TeacherSchedule from '../pages/professor/TeacherSchedule';
import GeneratedSchedules from '../pages/diren/GeneratedSchedules';
import CalendarGeneratedSchedules from '../pages/diren/CalendarGeneratedSchedules';
import PreviewGeneratedSchedules from '../pages/diren/PreviewGeneratedSchedules';
import TeachingPlanningCalendarSelection from '../pages/diren/TeachingPlanningCalendarSelection.';
import CalendarGeneratedSchedulesCoordination from '../pages/coordenador/CalendarGeneratedSchedulesCoordination';
import CoordinatorClassesList from '../pages/coordenador/CoordinatorClassesList';
import CurricularMatrixList from '../pages/coordenador/CurricularMatrixList';
import DetailsCurricularMatrix from '../pages/coordenador/DetailsCurricularMatrix';

const RoutesWithAuth = ({ isAuthenticated, setAuthenticated }) => {
  const userRole = localStorage.getItem('role') || null;

  const handleLogin = () => {
    setAuthenticated(true);
  };

  const isValidSession = isAuthenticated && userRole && !isTokenExpired();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isValidSession
            ? (
              userRole === 'Admin' ? (
                <Navigate to="/admin/usuarios" replace />
              ) : userRole === 'Diretor Ensino' ? (
                <Navigate to="/diretor_ensino/horarios-gerados" replace />
              ) : userRole === 'Coordenador' ? (
                <Navigate to="/coordenador/horarios" replace />
              ) : userRole === 'Professor' ? (
                <Navigate to="/professor/horario-individual" replace />
              ) : (
                <Navigate to="/home" replace />
              )
            )
            : <Login onLogin={handleLogin} />
        }
      />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/resetPassword/:encodedEmail/:expires" element={<ResetPassword />} />

      {/* Redireciona raiz para login se não autenticado */}
      {!isValidSession && <Route path="/" element={<Navigate to="/login" replace />} />}

      {/* Rotas Protegidas */}
      {isValidSession ? (
        <>
          <Route
            path="/"
            element={
              userRole === 'Admin'
                ? <Navigate to="/admin/usuarios" replace />
                : <Navigate to="/home" replace />
            }
          />

          {/* Admin */}
          {userRole === 'Admin' && (
            <Route path="/admin/*" element={<Layout setAuthenticated={setAuthenticated} />}>
              <Route path="usuarios" element={<UserList />} />
            </Route>
          )}

          {/* Coordenador */}
          {userRole === 'Coordenador' && (
            <Route path="/coordenador/*" element={<Layout setAuthenticated={setAuthenticated} />}>
              <Route path="planejamento-docente" element={<TeacherPlanningList />} />
              <Route path="planejamento-docente/cadastrar" element={<RegisterTeachingPlanning />} />
              <Route path="planejamento-docente/editar/:classIdToEdit" element={<RegisterTeachingPlanning />} />
              <Route path="disciplinas" element={<DisciplineList />} />
              <Route path="turmas" element={<ClassList />} />
              <Route path="horarios" element={<CalendarGeneratedSchedulesCoordination />} />
              <Route path="horarios/:calendarId" element={<CoordinatorClassesList />} />
              <Route path="matrizes-curriculares" element={<CurricularMatrixList />} />
              <Route path="matrizes-curriculares/:matrixId" element={<DetailsCurricularMatrix />} />
            </Route>
          )}

          {/* Professor */}
          {userRole === 'Professor' && (
            <Route path="/professor/*" element={<Layout setAuthenticated={setAuthenticated} />}>
              <Route path="preferencias" element={<PreferencesTeacher />} />
              <Route path="horario-individual" element={<TeacherSchedule />} />
            </Route>
          )}

          {/* Diretor Ensino */}
          {userRole === 'Diretor Ensino' && (
            <Route path="/diretor_ensino/*" element={<Layout setAuthenticated={setAuthenticated} />}>
              <Route path="cursos" element={<CourseList />} />
              <Route path="professores" element={<TeacherList />} />
              <Route path="calendarios" element={<CalendarList />} />
              <Route path="selecao-planejamento-docente" element={<TeachingPlanningCalendarSelection />} />
              <Route path="planejamento-docente/:calendarId" element={<DocentPlanningList />} />
              <Route path="horarios-gerados" element={<CalendarGeneratedSchedules />} />
              <Route path="horarios-gerados/:calendarId" element={<GeneratedSchedules />} />
              <Route path="horarios/pre-visualizacao/:calendarId" element={<PreviewGeneratedSchedules />} />
            </Route>
          )}

          {/* Home para outros papéis */}
          {userRole !== 'Admin' && (
            <Route path="/home/*" element={<Layout setAuthenticated={setAuthenticated} />}>
              <Route index element={<Home />} />
            </Route>
          )}

          {/* 404 dentro das rotas protegidas */}
          <Route path="*" element={<NotFound />} />
        </>
      ) : (
        // Rota coringa para quem não está autenticado
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};

const AppRoutes = ({ isAuthenticated, setAuthenticated }) => {
  return (
    <BrowserRouter>
      <RoutesWithAuth isAuthenticated={isAuthenticated} setAuthenticated={setAuthenticated} />
    </BrowserRouter>
  );
};

export default AppRoutes;