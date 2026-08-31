import { ChatSession } from '../models/ChatSession.js';
import { ChatMessage } from '../models/ChatMessage.js';

export const chatRepository = {
  async findSessionsByUser(userId, contentId) {
    const query = { userId };
    if (contentId) query.contentId = contentId;
    return ChatSession.find(query).sort({ updatedAt: -1 }).exec();
  },

  async findSessionById(sessionId) {
    return ChatSession.findById(sessionId).exec();
  },

  async createSession({ userId, contentId, title }) {
    return ChatSession.create({ userId, contentId, title });
  },

  async findMessagesBySession(sessionId) {
    return ChatMessage.find({ sessionId }).sort({ createdAt: 1 }).exec();
  },

  async createMessage(data) {
    const message = await ChatMessage.create(data);
    await ChatSession.findByIdAndUpdate(data.sessionId, {
      $inc: { messageCount: 1 },
      lastMessageAt: new Date()
    });
    return message;
  },

  async deleteByContentId(contentId) {
    const sessions = await ChatSession.find({ contentId }).select('_id');
    const sessionIds = sessions.map((s) => s._id);
    await Promise.all([
      ChatSession.deleteMany({ contentId }),
      ChatMessage.deleteMany({ sessionId: { $in: sessionIds } })
    ]);
  }
};
