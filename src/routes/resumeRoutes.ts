import express from 'express';
import { downloadResume } from '../controllers/resumeController';

const router = express.Router();

// GET:
router.get('/download', downloadResume);

// POST:

// PATCH:

// DELETE:

export default router;
