import express from 'express';

const router = express.Router();

router.get('/api/user/profile', (req, res) => {
  res.json({
    sub: req.user.sub,
    name: req.user.name,
    email: req.user.email,
    roles: req.user.roles,
  });
});

export default router;
