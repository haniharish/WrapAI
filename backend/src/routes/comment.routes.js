import { Router } from 'express';
import { commentController } from '../controllers/commentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireContentAccess } from '../middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '../services/authorizationService.js';

const router = Router({ mergeParams: true });

// Content comment threads
router.post('/content/:contentId/comments', authenticate, requireContentAccess(PERMISSIONS.COMMENT_CREATE), commentController.createComment);
router.get('/content/:contentId/comments', authenticate, requireContentAccess(PERMISSIONS.COMMENT_VIEW), commentController.getComments);

// Direct comment actions
router.put('/comments/:commentId', authenticate, commentController.updateComment);
router.delete('/comments/:commentId', authenticate, commentController.deleteComment);

export default router;
