import express from 'express';
import { findSystemBySlug } from '../catalog.js';
import { requestTokenExchange } from '../services/gatewayClient.js';

const router = express.Router();

function mapGatewayStatus(statusCode) {
  if (statusCode === 401) return { status: 401, error: 'Invalid or expired SSO token' };
  if (statusCode === 403) return { status: 403, error: 'User not provisioned in target system' };
  if (statusCode === 429) return { status: 429, error: 'Too many requests' };
  if (statusCode === 502) return { status: 502, error: 'Target system unavailable' };
  if (statusCode === 503) return { status: 503, error: 'API Gateway unavailable' };
  return { status: 502, error: 'Target system unavailable' };
}

router.post('/api/systems/:slug/access', async (req, res) => {
  const system = findSystemBySlug(req.params.slug);

  if (!system) {
    return res.status(404).json({ error: 'System not found' });
  }

  const canAccess = system.requiredRoles.some((role) => req.user.roles.includes(role));
  if (!canAccess) {
    return res.status(403).json({ error: 'User does not have access to this system' });
  }

  try {
    const exchange = await requestTokenExchange(system, req.ssoToken);
    const accessUrl = new URL(exchange.bridgeUrl, system.baseUrl).toString();

    return res.json({
      system: system.slug,
      accessUrl,
      expiresIn: '8h',
      user: {
        id: exchange.userId,
        name: exchange.username,
        role: exchange.role,
      },
    });
  } catch (error) {
    const mapped = mapGatewayStatus(error.statusCode);
    return res.status(mapped.status).json({ error: mapped.error });
  }
});

export default router;
