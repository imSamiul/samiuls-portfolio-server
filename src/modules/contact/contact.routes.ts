import { Router } from 'express';

import { contactLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { contactMessageSchema } from '../../shared/index.js';
import * as contactController from './contact.controller.js';

export const contactRoutes = Router();

contactRoutes.post(
  '/',
  contactLimiter,
  validate({ body: contactMessageSchema }),
  contactController.send,
);
