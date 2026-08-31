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

  async updateSession(sessionId, updates) {
    return ChatSession.findByIdAndUpdate(sessionId, updates, { new: true }).exec();
  },

  async deleteSession(sessionId) {
    await ChatMessage.deleteMany({ sessionId });
    return ChatSession.findByIdAndDelete(sessionId).exec();
  },

  async findMessagesBySession(sessionId, limit = null) {
    const q = ChatMessage.find({ sessionId }).sort({ createdAt: 1 });
    if (limit) q.limit(limit);
    return q.exec();
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

