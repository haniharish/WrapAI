import { Router } from 'express';
import { chatController } from '../controllers/chatController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

// Session management
router.get('/sessions', asyncHandler(chatController.listSessions));
router.post('/sessions', asyncHandler(chatController.createSession));

// Phase 10: Session rename and delete
router.patch('/sessions/:sessionId', asyncHandler(chatController.renameSession));
router.delete('/sessions/:sessionId', asyncHandler(chatController.deleteSession));

// Message retrieval
router.get('/sessions/:sessionId/messages', asyncHandler(chatController.getMessages));

// Phase 10: Post a message directly to a session
router.post('/sessions/:sessionId/messages', asyncHandler(chatController.postMessage));

// Primary chat endpoint (question with auto-session creation)
router.post('/ask', asyncHandler(chatController.askQuestion));

export default router;
