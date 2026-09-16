import {
  createProjectSchema,
  objectIdParamsSchema,
  updateProjectSchema,
} from '#shared';
import { Router } from 'express';

import { requireAuth } from '../../middleware/requireAuth.js';
import { uploadProjectImage } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import * as projectController from './project.controller.js';

export const projectRoutes = Router();

projectRoutes.get('/getAllProjects', projectController.list);
projectRoutes.get('/getProjectsForHomepage', projectController.listForHomepage);
projectRoutes.get(
  '/getProjectById/:id',
  validate({ params: objectIdParamsSchema }),
  projectController.detail,
);

// uploadProjectImage runs first: it is what parses the multipart body the
// schema then validates.
projectRoutes.post(
  '/create',
  requireAuth,
  uploadProjectImage,
  validate({ body: createProjectSchema }),
  projectController.create,
);

projectRoutes.patch(
  '/updateShowOnHomePage/:id',
  requireAuth,
  validate({ params: objectIdParamsSchema }),
  projectController.toggleHomepage,
);

projectRoutes.patch(
  '/updateProject/:id',
  requireAuth,
  validate({ params: objectIdParamsSchema, body: updateProjectSchema }),
  projectController.update,
);

projectRoutes.delete(
  '/deleteProject/:id',
  requireAuth,
  validate({ params: objectIdParamsSchema }),
  projectController.remove,
);
