import express from 'express';
import { sign } from '../services/LegacyJWTFactory.js';
import { findByEmail } from '../services/LegacyUserLookup.js';
import { validate } from '../services/SSOTokenValidator.js';

const router = express.Router();

router.get('/sistema/horarios-professores/auth/exchange', async (req, res, next) => {
  try {
    const { sso_token: ssoToken } = req.query;

    if (!ssoToken) {
      return res.status(400).json({ error: 'sso_token query parameter is required' });
    }

    const claims = await validate(ssoToken);
    const user = await findByEmail(claims.email);
    const token = sign(user);

    const params = new URLSearchParams({
      token,
      userId: String(user.id),
      username: user.name,
      role: user.role,
    });
    const bridgeUrl = `/auth-bridge?${params.toString()}`;

    if (req.accepts('json')) {
      return res.json({
        token,
        userId: user.id,
        username: user.name,
        role: user.role,
        bridgeUrl,
      });
    }

    return res.redirect(302, bridgeUrl);
  } catch (error) {
    return next(error);
  }
});

export default router;
