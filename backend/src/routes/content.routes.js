import { Router } from 'express';
import { contentController } from '../controllers/contentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { checkOwnership } from '../middlewares/ownershipMiddleware.js';
import { contentRepository } from '../repositories/contentRepository.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { validateCreateContent, validateUpdateContent } from '../validators/contentValidators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

router.post('/', validate(validateCreateContent), asyncHandler(contentController.create));
router.get('/', asyncHandler(contentController.list));

router.get('/:id', checkOwnership((id) => contentRepository.findById(id)), asyncHandler(contentController.getById));
router.patch('/:id', checkOwnership((id) => contentRepository.findById(id)), validate(validateUpdateContent), asyncHandler(contentController.update));
router.delete('/:id', checkOwnership((id) => contentRepository.findById(id)), asyncHandler(contentController.delete));

export default router;
