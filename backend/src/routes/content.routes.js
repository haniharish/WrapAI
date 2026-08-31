import { Router } from 'express';
import { contentController } from '../controllers/contentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
  validateTextSubmission,
  validateUrlSubmission,
  validateUpdateContent
} from '../validators/contentValidators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(contentController.list));
router.post('/', asyncHandler(contentController.create));
router.post('/upload', upload.single('file'), asyncHandler(contentController.upload));
router.post('/text', validate(validateTextSubmission), asyncHandler(contentController.createText));
router.post('/url', validate(validateUrlSubmission), asyncHandler(contentController.createUrl));
router.get('/:id', asyncHandler(contentController.getById));
router.get('/:id/processing', asyncHandler(contentController.getProcessingStatus));
router.patch('/:id', validate(validateUpdateContent), asyncHandler(contentController.update));
router.delete('/:id', asyncHandler(contentController.delete));
router.get('/:id/access', asyncHandler(contentController.getAccess));

export default router;
