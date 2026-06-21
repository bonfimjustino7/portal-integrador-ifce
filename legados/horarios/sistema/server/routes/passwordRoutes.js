import express from 'express';
import { PasswordController } from '../controllers/passwordController.js';
import {verifyToken} from '../middlewares/authMiddleware.js'
const router = express.Router();

router.post('/verify',PasswordController.forgotPassword);
router.post('/change',PasswordController.resetPassword);

export default router;  