import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import ApiError from '../utils/ApiError';

const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    next(new ApiError(401, 'Token not provided'));
    return;
  }

  try {
    jwt.verify(token, env.JWT_TOKEN);
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

export default requireAuth;
