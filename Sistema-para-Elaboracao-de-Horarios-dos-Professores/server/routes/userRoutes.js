import express from 'express';
import UserController from '../controllers/userController.js';
import { authorizeRole, authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// rota de preferências
router.get('/:id/preferences', verifyToken, authorizeRoles(['Coordenador', 'Professor']), UserController.getPreferencesById);     
router.get('/:id/preferences/days', verifyToken, authorizeRoles(['Coordenador', 'Professor']), UserController.getDaysPreferencesById);     
router.get('/preferences/all', verifyToken, authorizeRoles(['Coordenador', 'Professor']), UserController.getPreferences);
router.post('/:id/preferences', verifyToken, authorizeRoles(['Coordenador', 'Professor']), UserController.setPreferences);
router.post('/:id/preferences/days', verifyToken, authorizeRoles(['Coordenador', 'Professor']), UserController.setPreferencesDay);
router.put('/:id/preferences', verifyToken, authorizeRoles(['Coordenador', 'Professor']), UserController.updatePreferences);
router.delete('/:id/:disciplineId/preferences', verifyToken, authorizeRoles(['Coordenador', 'Professor']), UserController.deletePreferences);

// Buscar planejamento docente por curso - Diren
router.get('/teaching-plan/:coordinatorId/:calendarId', verifyToken, authorizeRoles(['Diretor Ensino','Coordenador']), UserController.getTeachingPlanByCourse);

// Visualizar horário acadêmico individual - Professor
router.get('/:id/schedule', verifyToken, authorizeRoles(['Professor']), UserController.getProfessorSchedule);

// Rotas de professores
router.get('/teachers', verifyToken, authorizeRoles(['Admin', 'Diretor Ensino', 'Coordenador']), UserController.viewTeachers);
router.post('/teachers', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino']), UserController.registerTeacher);
router.put('/teachers/:id', verifyToken, authorizeRoles(['Admin', 'Diretor Ensino']), UserController.updateUser);
router.delete('/teachers/:id', verifyToken, authorizeRoles(['Diretor Ensino']), UserController.deleteTeacher);

// Rotas de usuários em geral
router.get('/', verifyToken, authorizeRoles(['Admin', 'Diretor Ensino']), UserController.viewAllUsers);
router.post('/', UserController.register);
router.get('/:id', verifyToken, authorizeRoles(['Admin', 'Diretor Ensino', 'Coordenador', 'Professor']), UserController.getUserById);
router.put('/:id', verifyToken, authorizeRoles(['Admin', 'Diretor Ensino']), UserController.updateUser);
router.delete('/:id', verifyToken, authorizeRoles(['Admin', 'Diretor Ensino']), UserController.deleteUser);

export default router;
