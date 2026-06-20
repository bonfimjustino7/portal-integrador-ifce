import express from 'express';
import { authorizeRole, authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js';
import HourController from '../controllers/hourController.js';

const router = express.Router();

router.get('/',verifyToken, authorizeRoles(['Coordenador','Diretor Ensino','Professor']),HourController.getHours);

export default router;
