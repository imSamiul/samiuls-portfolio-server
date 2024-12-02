import express from 'express';
import {
  createProject,
  getProjects,
  updateProject,
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
router.patch('/updateProject/:id', auth, updateProject);

// DELETE:

export default router;
