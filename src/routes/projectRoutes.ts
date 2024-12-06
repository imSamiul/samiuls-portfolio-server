import express from 'express';
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
  updateShowOnHomePage,
  uploadMiddleware,
} from '../controllers/projectController';
import auth from '../auth/auth';

const router = express.Router();

// GET:
router.get('/getAllProjects', auth, getProjects);
router.get('/getProjectById/:id', auth, getProjectById);

// POST:
router.post('/create', auth, uploadMiddleware, createProject);

// PATCH:
router.patch('/updateShowOnHomePage/:id', auth, updateShowOnHomePage);
router.patch('/updateProject/:id', auth, updateProject);

// DELETE:
router.delete('/deleteProject/:id', auth, deleteProject);

export default router;
