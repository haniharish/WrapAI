import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { validateUpdateProfile, validateChangePassword } from '../validators/userValidators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

router.get('/me', asyncHandler(userController.getProfile));
router.patch('/me', validate(validateUpdateProfile), asyncHandler(userController.updateProfile));
router.patch('/me/password', validate(validateChangePassword), asyncHandler(userController.changePassword));
router.delete('/me', asyncHandler(userController.deleteAccount));

export default router;
