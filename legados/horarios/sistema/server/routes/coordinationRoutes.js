import express from 'express';
import CoordinationController from '../controllers/coordinationController.js';
import { authorizeRole, authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/:classId', verifyToken, authorizeRole('Coordenador'), CoordinationController.createPlanning);

router.get('/class/:classId', verifyToken, authorizeRoles(['Diretor Ensino', 'Coordenador']), CoordinationController.getPlanningByClassId);

router.get('/planning/:calendarId', verifyToken, authorizeRoles(['Diretor Ensino', 'Coordenador']), CoordinationController.getAllPlanning);

router.put('/class/:classId', verifyToken, authorizeRoles(['Diretor Ensino', 'Coordenador']), CoordinationController.updatePlanning);

router.delete('/:id', verifyToken, authorizeRole('Coordenador'), CoordinationController.removePlanning);

export default router;  