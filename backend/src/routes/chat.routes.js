import { Router } from 'express';
import { chatController } from '../controllers/chatController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

router.get('/sessions', asyncHandler(chatController.listSessions));
router.post('/sessions', asyncHandler(chatController.createSession));
router.get('/sessions/:sessionId/messages', asyncHandler(chatController.getMessages));
router.post('/ask', asyncHandler(chatController.askQuestion));

export default router;
