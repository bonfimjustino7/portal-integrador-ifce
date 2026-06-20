import jwt from 'jsonwebtoken';
import config from '../config.js';

export function sign(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role,
    },
    config.legacy.jwtSecret,
    { expiresIn: config.legacy.jwtExpiresIn },
  );
}
