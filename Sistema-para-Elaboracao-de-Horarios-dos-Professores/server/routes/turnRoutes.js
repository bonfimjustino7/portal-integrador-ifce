import express from 'express';
import TurnController from '../controllers/turnController.js';
import { authorizeRole, authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/',verifyToken,authorizeRole('Diretor Ensino'),TurnController.create);

router.get('/',verifyToken,authorizeRoles(['Coordenador','Diretor Ensino','Professor']),TurnController.getAll);

router.get('/:id',verifyToken,authorizeRole('Diretor Ensino'),TurnController.getById);

router.put('/:id',verifyToken,authorizeRole('Diretor Ensino'),TurnController.update);

router.delete('/:id',verifyToken,authorizeRole('Diretor Ensino'),TurnController.delete);

export default router;  