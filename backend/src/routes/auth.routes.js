import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { validateRegister, validateLogin } from '../validators/authValidators.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', authLimiter, validate(validateRegister), asyncHandler(authController.register));
router.post('/login', authLimiter, validate(validateLogin), asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.getMe));

export default router;
