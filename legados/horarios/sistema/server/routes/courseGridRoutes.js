import express from 'express';
import courseGridController from '../controllers/courseGridController.js';
import { authorizeRole, authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/:courseId', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino']), courseGridController.create);

router.post('/course/associate/:gridCourseId', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino']), courseGridController.associateDiscipline);

router.get('/', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino']), courseGridController.getAll);

router.get('/coordination/:id', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino']), courseGridController.getByCourse);

router.get('/all-grid', verifyToken, authorizeRole('Diretor Ensino'), courseGridController.getAllDisciplinesAssocieted);

router.get('/grid-course/:id', verifyToken, authorizeRole('Coordenador'), courseGridController.getDisciplinesAssocieted);

router.put('/:id', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino']), courseGridController.update);

router.delete('/:id', verifyToken, authorizeRoles(['Coordenador', 'Diretor Ensino']), courseGridController.delete);

export default router;