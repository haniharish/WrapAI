import { Router } from 'express';
import { intelligenceController } from '../controllers/intelligenceController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { checkOwnership } from '../middlewares/ownershipMiddleware.js';
import { contentRepository } from '../repositories/contentRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.patch(
  '/actions/:actionItemId/status',
  asyncHandler(intelligenceController.updateActionItem)
);

router.get(
  '/:contentId/analysis',
  checkOwnership((id) => contentRepository.findById(id), 'contentId'),
  asyncHandler(intelligenceController.getAnalysis)
);

router.get(
  '/:contentId/intelligence',
  checkOwnership((id) => contentRepository.findById(id), 'contentId'),
  asyncHandler(intelligenceController.getIntelligence)
);

router.post(
  '/:contentId/analyze',
  checkOwnership((id) => contentRepository.findById(id), 'contentId'),
  asyncHandler(intelligenceController.triggerReanalysis)
);

router.patch(
  '/:contentId/action-items/:itemId',
  checkOwnership((id) => contentRepository.findById(id), 'contentId'),
  asyncHandler(intelligenceController.updateActionItem)
);

router.patch(
  '/:contentId/decisions/:decisionId',
  checkOwnership((id) => contentRepository.findById(id), 'contentId'),
  asyncHandler(intelligenceController.updateDecision)
);

export default router;
