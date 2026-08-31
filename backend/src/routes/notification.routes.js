import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);

export default router;
