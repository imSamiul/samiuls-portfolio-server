import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error('Token not provided');
    }

    if (!process.env.JWT_TOKEN) {
      throw new Error('JWT secret is not defined');
    }

    const decoded = jwt.verify(token, process.env.JWT_TOKEN) as { id: string }; // Specify the structure if known

    if (!decoded) {
      throw new Error('Invalid token');
    }
    req.body.tokenData = decoded.id;

    next();
  } catch (error) {
    let errorMessage = 'Authentication failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json({ message: errorMessage });
    console.log(error);
  }
};
export default auth;
