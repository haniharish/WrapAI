import { Router } from 'express';
import { transcriptController } from '../controllers/transcriptController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

router.patch(
  '/:id',
  asyncHandler(transcriptController.renameSpeakerById)
);

export default router;
