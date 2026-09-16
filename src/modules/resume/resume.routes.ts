import { Router } from 'express';

import * as resumeController from './resume.controller.js';

export const resumeRoutes = Router();

resumeRoutes.get('/download', resumeController.download);
