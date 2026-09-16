import { Router } from 'express';

import { requireAuth } from '../../middleware/requireAuth.js';
import { uploadResumePdf } from '../../middleware/upload.js';
import * as resumeController from './resume.controller.js';

export const resumeRoutes = Router();

resumeRoutes.get('/download', resumeController.download);

resumeRoutes.post(
  '/',
  requireAuth,
  uploadResumePdf,
  resumeController.replace,
);
