import express from 'express';
import {
  createProject,
  uploadProjectImage,
} from '../controllers/projectController';

const router = express.Router();

// GET:

// POST:
router.post('/create', uploadProjectImage, createProject);

// PATCH:

// DELETE:

export default router;
