import { Router } from 'express';

import { authRoutes } from './modules/auth/auth.routes.js';
import { contactRoutes } from './modules/contact/contact.routes.js';
import { projectRoutes } from './modules/projects/project.routes.js';
import { resumeRoutes } from './modules/resume/resume.routes.js';

export const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/contact', contactRoutes);
routes.use('/project', projectRoutes);
routes.use('/resume', resumeRoutes);
