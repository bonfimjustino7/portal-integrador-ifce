import express from 'express';
import CourseController from '../controllers/courseController.js';
import { authorizeRole, authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/',verifyToken,authorizeRoles(['Diretor Ensino','Coordenador']),CourseController.create);

router.get('/',verifyToken,authorizeRoles(['Diretor Ensino','Coordenador']),CourseController.getAll);

router.get('/coordinator/:id',verifyToken,authorizeRole('Coordenador'),CourseController.getByCoordinator);

router.get('/coordinator/wot-planning/:id',verifyToken,authorizeRole('Coordenador'),CourseController.getCourseWithoutPlanning);

router.get('/:id',verifyToken,authorizeRoles(['Diretor Ensino','Coordenador']),CourseController.getById);

router.get('/semesters/:courseId',verifyToken,authorizeRoles(['Diretor Ensino','Coordenador']),CourseController.getSemesters);

router.put('/:id',verifyToken,authorizeRoles(['Diretor Ensino','Coordenador']),CourseController.update);

router.delete('/:id',verifyToken,authorizeRole('Diretor Ensino'),CourseController.delete);

export default router;  