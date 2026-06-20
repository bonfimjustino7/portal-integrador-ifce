import express from 'express';
import HourGridController from '../controllers/hourGridController.js';
import { authorizeRole, authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/:calendarId', verifyToken, authorizeRole('Diretor Ensino'), HourGridController.generateHour);

router.get('/view/:calendarId', verifyToken, authorizeRole('Diretor Ensino'), HourGridController.viewHourGrid);

router.get('/has-publication/:calendarId',verifyToken,authorizeRole('Diretor Ensino'),HourGridController.hasHourPublicated);

router.get('/has-generated/:calendarId',verifyToken,authorizeRole('Diretor Ensino'),HourGridController.hasHourGenerated);

router.get('/',verifyToken,authorizeRole('DiretorEnsino'),HourGridController.viewAllHourGrid);

router.post('/public/:calendarId', verifyToken, authorizeRole('Diretor Ensino'), HourGridController.publicHourGrid);

router.post('/:calendarId', verifyToken, authorizeRole('Diretor Ensino'), HourGridController.createHour);

router.put('/:calendarId', verifyToken, authorizeRole('Diretor Ensino'), HourGridController.editHour);

router.delete('/:calendarId', verifyToken, authorizeRole('Diretor Ensino'), HourGridController.deleteHour);

export default router;