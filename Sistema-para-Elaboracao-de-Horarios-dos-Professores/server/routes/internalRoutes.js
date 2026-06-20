import express from 'express';
import { getUserByEmail } from '../controllers/internalController.js';

const router = express.Router();

const verifyInternalKey = (req, res, next) => {
  const configuredKey = process.env.INTERNAL_API_KEY;
  const providedKey = req.get('X-Internal-Key');

  if (!configuredKey || providedKey !== configuredKey) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
};

router.get('/user-by-email', verifyInternalKey, getUserByEmail);

export default router;
