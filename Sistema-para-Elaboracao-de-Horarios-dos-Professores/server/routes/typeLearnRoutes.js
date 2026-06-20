import express from 'express';
import TypeLernController from '../controllers/typeLearnController.js';
import { authorizeRole, authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, authorizeRole('Diretor Ensino'), TypeLernController.create);

router.get('/', verifyToken,authorizeRoles(['Coordenador','Diretor Ensino']), TypeLernController.getAll);

router.get('/:id', verifyToken, authorizeRole('Diretor Ensino'),TypeLernController.getById);

router.put('/:id', verifyToken, authorizeRole('Diretor Ensino'), TypeLernController.update);

router.delete('/:id', verifyToken, authorizeRole('Diretor Ensino'), TypeLernController.delete);

export default router;