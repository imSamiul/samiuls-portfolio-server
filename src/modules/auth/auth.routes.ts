import { Router } from 'express';

import { authLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { credentialsSchema } from '../../shared/index.js';
import * as authController from './auth.controller.js';

export const authRoutes = Router();

authRoutes.post(
  '/signUp',
  authLimiter,
  validate({ body: credentialsSchema }),
  authController.signUp,
);

authRoutes.post(
  '/login',
  authLimiter,
  validate({ body: credentialsSchema }),
  authController.login,
);
