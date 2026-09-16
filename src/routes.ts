import { Router } from 'express';
import projectRoutes from './modules/projects/project.routes';
import authRoutes from './routes/authRoutes';
import resumeRoutes from './routes/resumeRoutes';

const router = Router();

router.use('/resume', resumeRoutes);
router.use('/auth', authRoutes);
router.use('/project', projectRoutes);

export default router;
