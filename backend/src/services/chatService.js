import { chatRepository } from '../repositories/chatRepository.js';
import { transcriptRepository } from '../repositories/transcriptRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { ApiError } from '../utils/ApiError.js';

export const chatService = {
  async getSessions(userId, contentId) {
    return chatRepository.findSessionsByUser(userId, contentId);
  },

  async getMessages(sessionId) {
    return chatRepository.findMessagesBySession(sessionId);
  },

  async createSession(userId, contentId, title = 'New Conversation') {
    return chatRepository.createSession({ userId, contentId, title });
  },

  async askQuestion(userId, contentId, sessionId, question) {
    if (!question || question.trim().length === 0) {
      throw ApiError.badRequest('Question cannot be empty');
    }

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const newSession = await chatRepository.createSession({
        userId,
        contentId,
        title: question.slice(0, 40) + '...'
      });
      activeSessionId = newSession.id;
    }

    // 1. Record User Question
    const userMessage = await chatRepository.createMessage({
      sessionId: activeSessionId,
      contentId,
      userId,
      role: 'USER',
      content: question.trim()
    });

    // 2. Fetch ground-truth segments for contextual simulation
    const { segments } = await transcriptRepository.findByContentId(contentId);
    const sampleSegment = segments && segments.length > 0 ? segments[0] : null;

    const citation = sampleSegment
      ? {
          segmentId: sampleSegment.id,
          speakerName: sampleSegment.speakerDisplayName,
          timestamp: sampleSegment.startTime,
          excerpt: sampleSegment.text
        }
      : {
          segmentId: null,
          speakerName: 'Speaker 1',
          timestamp: 93,
          excerpt: 'Discussion excerpt from transcript recording.'
        };

    const assistantContent = `Based on the recorded transcript, this was discussed in detail by ${citation.speakerName}. Specifically, ${citation.excerpt}`;

    // 3. Record Assistant Response with Citations
    const assistantMessage = await chatRepository.createMessage({
      sessionId: activeSessionId,
      contentId,
      userId,
      role: 'ASSISTANT',
      content: assistantContent,
      citations: [citation],
      tokensUsed: 142
    });

    await auditLogRepository.createLog({
      userId,
      action: 'CHAT_MESSAGE_SENT',
      resourceType: 'CHAT',
      resourceId: activeSessionId.toString(),
      metadata: { questionLength: question.length }
    });

    return {
      sessionId: activeSessionId,
      userMessage,
      assistantMessage
    };
  }
};
