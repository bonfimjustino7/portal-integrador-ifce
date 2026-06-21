import express from 'express';
import { systems, toCatalogItem } from '../catalog.js';

const router = express.Router();

router.get('/api/catalog', (req, res) => {
  const userRoles = new Set(req.user.roles);
  const catalog = systems
    .map((system) => ({
      ...toCatalogItem(system),
      accessible: system.requiredRoles.some((role) => userRoles.has(role)),
    }));

  res.json({ systems: catalog });
});

export default router;
