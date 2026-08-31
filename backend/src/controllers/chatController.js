import { chatService } from '../services/chatService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { STATUS_CODES } from '../constants/statusCodes.js';

export const chatController = {
  async listSessions(req, res) {
    const sessions = await chatService.getSessions(req.user.id, req.query.contentId);
    sendSuccess(res, sessions, 'Chat sessions retrieved');
  },

  async getMessages(req, res) {
    const messages = await chatService.getMessages(req.params.sessionId, req.user.id);
    sendSuccess(res, messages, 'Chat messages retrieved');
  },

  async createSession(req, res) {
    const session = await chatService.createSession(req.user.id, req.body.contentId, req.body.title);
    sendSuccess(res, session, 'Chat session created', STATUS_CODES.CREATED);
  },

  // Phase 10: Session management
  async renameSession(req, res) {
    const session = await chatService.renameSession(
      req.params.sessionId,
      req.user.id,
      req.body.title
    );
    sendSuccess(res, session, 'Chat session renamed');
  },

  async deleteSession(req, res) {
    const result = await chatService.deleteSession(req.params.sessionId, req.user.id);
    sendSuccess(res, result, 'Chat session deleted');
  },

  async askQuestion(req, res) {
    const { contentId, sessionId, question } = req.body;
    const result = await chatService.askQuestion(req.user.id, contentId, sessionId, question);
    sendSuccess(res, result, 'Question processed with grounded citations', STATUS_CODES.OK);
  },

  // Phase 10: POST messages directly to a session (alternative to /ask)
  async postMessage(req, res) {
    const { question, message } = req.body;
    const userInput = question || message;
    const { sessionId } = req.params;

    // Get contentId from session
    const sessions = await chatService.getSessions(req.user.id, null);
    const session = sessions.find((s) => s.id?.toString() === sessionId || s._id?.toString() === sessionId);
    if (!session) {
      const { ApiError } = await import('../utils/ApiError.js');
      throw ApiError.notFound('Session not found');
    }

    const result = await chatService.askQuestion(req.user.id, session.contentId, sessionId, userInput);
    sendSuccess(res, result, 'Message sent', STATUS_CODES.CREATED);
  }
};
