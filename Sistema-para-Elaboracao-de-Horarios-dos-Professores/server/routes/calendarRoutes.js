import express from 'express';
import CalendarController from '../controllers/calendarController.js';
import { authorizeRole, authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, authorizeRole('Diretor Ensino'), CalendarController.create);

router.post('/deactivate/:id', verifyToken, authorizeRole('Diretor Ensino'), CalendarController.deactivate);

router.get('/', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino', 'Professor']), CalendarController.getAll);

router.get('/planning', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino', 'Professor']), CalendarController.getCalendarPlanning);

router.get('/year', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino', 'Professor']), CalendarController.getCalendarYear);

router.get('/type', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino', 'Professor']), CalendarController.getCalendarType);

router.get('/:id', verifyToken, authorizeRole('Diretor Ensino'), CalendarController.getById);

router.get('/hours/schedule',verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino', 'Professor']),CalendarController.getCalendarHours);

router.get('/hours/schedule/publicated',verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino', 'Professor']),CalendarController.getCalendarHoursPublicated);

router.put('/:id', verifyToken, authorizeRole('Diretor Ensino'), CalendarController.update);

router.delete('/:id', verifyToken, authorizeRole('Diretor Ensino'), CalendarController.delete);

export default router;  