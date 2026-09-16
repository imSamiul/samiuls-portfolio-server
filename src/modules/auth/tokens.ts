import jwt from 'jsonwebtoken';

import { env } from '../../config/env.js';

const SECONDS_PER_DAY = 24 * 60 * 60;

export function signAuthToken(userId: string) {
  return jwt.sign({ id: userId }, env.JWT_TOKEN, {
    expiresIn: env.JWT_TOKEN_TTL_DAYS * SECONDS_PER_DAY,
  });
}

/** Throws whenever the token is missing, tampered with, or expired. */
export function verifyAuthToken(token: string): { id: string } {
  const payload = jwt.verify(token, env.JWT_TOKEN);

  if (typeof payload === 'string' || typeof payload.id !== 'string') {
    throw new Error('Auth token payload is malformed');
  }

  return { id: payload.id };
}
