import express from 'express';
import requireAuth from '../../middleware/requireAuth';
import { uploadProjectImage } from '../../middleware/upload';
import validate from '../../middleware/validate';
import { objectIdParamsSchema } from '../../shared/schemas/common.schema';
import {
  createProjectSchema,
  updateProjectSchema,
} from '../../shared/schemas/project.schema';
import * as projectController from './project.controller';

const router = express.Router();

// Paths are kept verbatim from the pre-migration API so the client keeps
// working until both repos move to /api/v1 together.
router.get('/getAllProjects', projectController.getProjects);
router.get('/getProjectsForHomepage', projectController.getHomepageProjects);
router.get(
  '/getProjectById/:id',
  validate({ params: objectIdParamsSchema }),
  projectController.getProjectById,
);

router.post(
  '/create',
  requireAuth,
  uploadProjectImage,
  validate({ body: createProjectSchema }),
  projectController.createProject,
);

router.patch(
  '/updateShowOnHomePage/:id',
  requireAuth,
  validate({ params: objectIdParamsSchema }),
  projectController.toggleShowOnHomepage,
);
router.patch(
  '/updateProject/:id',
  requireAuth,
  validate({ params: objectIdParamsSchema, body: updateProjectSchema }),
  projectController.updateProject,
);

router.delete(
  '/deleteProject/:id',
  requireAuth,
  validate({ params: objectIdParamsSchema }),
  projectController.deleteProject,
);

export default router;
