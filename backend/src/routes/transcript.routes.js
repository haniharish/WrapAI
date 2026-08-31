import { Router } from 'express';
import { transcriptController } from '../controllers/transcriptController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { checkOwnership } from '../middlewares/ownershipMiddleware.js';
import { contentRepository } from '../repositories/contentRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get(
  '/:contentId/transcript',
  checkOwnership((id) => contentRepository.findById(id), 'contentId'),
  asyncHandler(transcriptController.getTranscript)
);

router.get(
  '/:contentId/speakers',
  checkOwnership((id) => contentRepository.findById(id), 'contentId'),
  asyncHandler(transcriptController.getSpeakers)
);

router.patch(
  '/:contentId/speakers',
  checkOwnership((id) => contentRepository.findById(id), 'contentId'),
  asyncHandler(transcriptController.renameSpeaker)
);

export default router;
