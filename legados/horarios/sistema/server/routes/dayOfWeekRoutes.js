import express from 'express';
import DayOfWeekController from '../controllers/dayOfWeekController.js';
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/',verifyToken,authorizeRoles(['Coordenador','Diretor Ensino','Professor']),DayOfWeekController.getAll);

router.get('/:id',verifyToken,authorizeRoles(['Coordenador','Diretor Ensino','Professor']),DayOfWeekController.getById);

export default router;  