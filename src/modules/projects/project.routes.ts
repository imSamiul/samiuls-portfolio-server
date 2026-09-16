import { Router } from 'express';

import { requireAuth } from '../../middleware/requireAuth.js';
import { uploadProjectImage } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import {
  createProjectSchema,
  objectIdParamsSchema,
  paginationQuerySchema,
  slugParamsSchema,
  updateProjectSchema,
} from '../../shared/index.js';
import * as projectController from './project.controller.js';

export const projectRoutes = Router();

projectRoutes.get(
  '/getAllProjects',
  validate({ query: paginationQuerySchema }),
  projectController.list,
);
projectRoutes.get('/getProjectsForHomepage', projectController.listForHomepage);

// A separate authenticated route rather than a query param on `getAllProjects`:
// the difference is who may see drafts, and that belongs in the route.
projectRoutes.get(
  '/getAllProjectsForDashboard',
  requireAuth,
  projectController.listForDashboard,
);
projectRoutes.get(
  '/getProjectById/:id',
  validate({ params: objectIdParamsSchema }),
  projectController.detail,
);

// A separate route rather than one polymorphic param: `getProjectById` validates
// its param as an ObjectId, and the repo's routes are verb-style anyway.
projectRoutes.get(
  '/getProjectBySlug/:slug',
  validate({ params: slugParamsSchema }),
  projectController.detailBySlug,
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
  '/updateStatus/:id',
  requireAuth,
  validate({ params: objectIdParamsSchema }),
  projectController.toggleStatus,
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
