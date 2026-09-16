import type { RequestHandler } from 'express';

import { verifyAuthToken } from '../modules/auth/tokens.js';
import { ApiError } from '../utils/ApiError.js';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.header('authorization')?.replace('Bearer ', '');

  if (!token) {
    next(ApiError.unauthorized('Sign in to continue'));
    return;
  }

  try {
    req.auth = { id: verifyAuthToken(token).id };
    next();
  } catch {
    next(ApiError.unauthorized('Session expired', 'ACCESS_TOKEN_INVALID'));
  }
};
