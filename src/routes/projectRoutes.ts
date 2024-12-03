import express from 'express';
import {
  createProject,
  getProjects,
  updateShowOnHomePage,
  uploadProjectImage,
} from '../controllers/projectController';
import auth from '../auth/auth';

const router = express.Router();

// GET:
router.get('/getAllProjects', auth, getProjects);

// POST:
router.post('/create', uploadProjectImage, createProject);

// PATCH:
router.patch('/updateShowOnHomePage/:id', auth, updateShowOnHomePage);

// DELETE:

export default router;
