import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { validateUserStatus } from '../validators/adminValidators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/overview', asyncHandler(adminController.getOverview));
router.get('/metrics', asyncHandler(adminController.getOverview));
router.get('/users', asyncHandler(adminController.getUsers));
router.patch('/users/:id/status', validate(validateUserStatus), asyncHandler(adminController.updateUserStatus));
router.get('/content', asyncHandler(adminController.getContent));
router.get('/processing', asyncHandler(adminController.getProcessing));
router.get('/analytics', asyncHandler(adminController.getAnalytics));
router.get('/system', asyncHandler(adminController.getSystem));

export default router;
