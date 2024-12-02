import express from 'express';
import {
  createProject,
  getProjects,
  uploadProjectImage,
} from '../controllers/projectController';
import auth from '../auth/auth';

const router = express.Router();

// GET:
router.get('/getAllProjects', auth, getProjects);

// POST:
router.post('/create', uploadProjectImage, createProject);

// PATCH:

// DELETE:

export default router;
