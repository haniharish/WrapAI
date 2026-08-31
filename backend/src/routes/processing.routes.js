import { Router } from 'express';
import { processingController } from '../controllers/processingController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

// User & Shared Processing Endpoints
router.get('/', asyncHandler(processingController.listUserJobs));
router.get('/metrics', requireRole('ADMIN'), asyncHandler(processingController.adminGetMetrics));
router.get('/admin/all', requireRole('ADMIN'), asyncHandler(processingController.adminListJobs));
router.get('/content/:contentId', asyncHandler(processingController.getJobByContent));
router.get('/:jobId', asyncHandler(processingController.getJobById));
router.post('/:jobId/retry', asyncHandler(processingController.retryJob));
router.post('/:jobId/cancel', asyncHandler(processingController.cancelJob));

export default router;
