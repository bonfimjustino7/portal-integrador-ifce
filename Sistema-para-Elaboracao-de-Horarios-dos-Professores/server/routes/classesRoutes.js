import express from 'express';
import ClassController from '../controllers/classController.js';
import { authorizeRole, authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rotas fixas SEM parâmetros primeiro
router.get('/active', verifyToken, authorizeRoles(['Admin', "Diretor Ensino", 'Coordenador']), ClassController.getActive);
router.get('/archived/:id', verifyToken, authorizeRole('Coordenador'), ClassController.getArchived);
router.get('/schedule/by-year', verifyToken, authorizeRole('Coordenador'), ClassController.getScheduleByYear);
router.get('/coordinator/:id/planning', verifyToken, authorizeRole('Coordenador'), ClassController.getClassWithPlanning);
router.get('/coordinator/:id', verifyToken, authorizeRole('Coordenador'), ClassController.getByCoordinator);

// Lista todas as turmas
router.get('/', verifyToken, authorizeRoles(['Admin', "Diretor Ensino"]), ClassController.getAll);

// Rota dinâmica 
router.get('/:id', verifyToken, authorizeRoles(['Admin', "Diretor Ensino", 'Coordenador']), ClassController.getById);

// Criação e edição
router.post('/', verifyToken, authorizeRoles(['Diretor Ensino','Coordenador']), ClassController.create);
router.put('/:id', verifyToken, authorizeRoles(['Diretor Ensino','Coordenador']), ClassController.update);
router.put('/:id/deactivate', verifyToken, authorizeRole('Coordenador'), ClassController.deactivate);

// Exclusão
router.delete('/:id', verifyToken, authorizeRole("Diretor Ensino"), ClassController.delete);

export default router;
