import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { checkOwnership } from '../middlewares/ownershipMiddleware.js';
import { reportRepository } from '../repositories/reportRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(reportController.list));
router.get('/:id', checkOwnership((id) => reportRepository.findById(id)), asyncHandler(reportController.getById));

export default router;
