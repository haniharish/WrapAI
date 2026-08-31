import { Router } from 'express';
import { intelligenceController } from '../controllers/intelligenceController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { checkOwnership } from '../middlewares/ownershipMiddleware.js';
import { contentRepository } from '../repositories/contentRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get(
  '/:contentId/intelligence',
  checkOwnership((id) => contentRepository.findById(id), 'contentId'),
  asyncHandler(intelligenceController.getIntelligence)
);

router.patch(
  '/actions/:actionItemId/status',
  asyncHandler(intelligenceController.updateActionItem)
);

export default router;
