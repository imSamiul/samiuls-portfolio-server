import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const auth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ message: 'Token not provided' });
    return;
  }

  // Missing secret is a server misconfiguration, not a bad request
  if (!process.env.JWT_TOKEN) {
    res.status(500).json({ message: 'JWT secret is not defined' });
    return;
  }

  try {
    jwt.verify(token, process.env.JWT_TOKEN);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
export default auth;
