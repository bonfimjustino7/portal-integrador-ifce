import express from 'express';
import DisciplineController from '../controllers/disciplineController.js';
import { authorizeRole, authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino']), DisciplineController.create);

router.get('/', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino']), DisciplineController.getAll);

router.get('/:id', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino']), DisciplineController.getById);

router.get('/coordination/:id', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino']), DisciplineController.getByCoordination);

router.put('/:id', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino']), DisciplineController.update);

router.delete('/:id', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino']), DisciplineController.delete);

export default router;