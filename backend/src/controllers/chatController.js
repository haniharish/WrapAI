import { chatService } from '../services/chatService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { STATUS_CODES } from '../constants/statusCodes.js';

export const chatController = {
  async listSessions(req, res) {
    const sessions = await chatService.getSessions(req.user.id, req.query.contentId);
    sendSuccess(res, sessions, 'Chat sessions retrieved');
  },

  async getMessages(req, res) {
    const messages = await chatService.getMessages(req.params.sessionId);
    sendSuccess(res, messages, 'Chat messages retrieved');
  },

  async createSession(req, res) {
    const session = await chatService.createSession(req.user.id, req.body.contentId, req.body.title);
    sendSuccess(res, session, 'Chat session created', STATUS_CODES.CREATED);
  },

  async askQuestion(req, res) {
    const { contentId, sessionId, question } = req.body;
    const result = await chatService.askQuestion(req.user.id, contentId, sessionId, question);
    sendSuccess(res, result, 'Question processed with grounded citations', STATUS_CODES.OK);
  }
};
