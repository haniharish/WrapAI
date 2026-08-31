import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import contentRoutes from './content.routes.js';
import reportRoutes from './report.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/content', contentRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);

export default router;
