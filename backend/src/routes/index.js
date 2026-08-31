import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import contentRoutes from './content.routes.js';
import processingRoutes from './processing.routes.js';
import transcriptRoutes from './transcript.routes.js';
import intelligenceRoutes from './intelligence.routes.js';
import reportRoutes from './report.routes.js';
import chatRoutes from './chat.routes.js';
import adminRoutes from './admin.routes.js';
import speakerRoutes from './speaker.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/content', intelligenceRoutes);
router.use('/content', transcriptRoutes);
router.use('/content', contentRoutes);
router.use('/speakers', speakerRoutes);
router.use('/processing', processingRoutes);
router.use('/reports', reportRoutes);
router.use('/chat', chatRoutes);
router.use('/admin', adminRoutes);

export default router;
