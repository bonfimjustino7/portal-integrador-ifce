function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function decodeJwt(token) {
  const parts = token.split('.');

  if (parts.length < 2) {
    throw new Error('Malformed JWT');
  }

  return JSON.parse(decodeBase64Url(parts[1]));
}

export function authMiddleware(req, res, next) {
  const authHeader = req.get('authorization') || '';
  const [, token] = authHeader.match(/^Bearer\s+(.+)$/i) || [];

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  try {
    const claims = decodeJwt(token);
    const now = Math.floor(Date.now() / 1000);

    if (claims.exp && claims.exp <= now) {
      return res.status(401).json({ error: 'Invalid or expired SSO token' });
    }

    req.ssoToken = token;
    req.user = {
      sub: claims.sub,
      name: claims.name || claims.preferred_username || claims.email,
      email: claims.email,
      roles: claims.realm_access?.roles || [],
      claims,
    };

    return next();
  } catch (_error) {
    return res.status(401).json({ error: 'Invalid or expired SSO token' });
  }
}
