import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public route for shared read-only reports
router.get('/shared/:shareToken', asyncHandler(reportController.getSharedReport));

// Authenticated routes
router.use(authenticate);

router.get('/', asyncHandler(reportController.list));
router.get('/:id', asyncHandler(reportController.getById));
router.get('/:id/download', asyncHandler(reportController.download));
router.post('/:id/regenerate', asyncHandler(reportController.regenerate));
router.delete('/:id', asyncHandler(reportController.delete));
router.post('/:id/share', asyncHandler(reportController.share));
router.delete('/:id/share', asyncHandler(reportController.revokeShare));

export default router;
