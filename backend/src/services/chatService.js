import { chatRepository } from '../repositories/chatRepository.js';
import { embeddingRepository } from '../repositories/embeddingRepository.js';
import { contentRepository } from '../repositories/contentRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { aiService } from './aiService.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

const MAX_HISTORY_MESSAGES = 6; // Keep last N turns for context
const RAG_TOP_K = 8;
const RAG_SIMILARITY_THRESHOLD = 0.35;

export const chatService = {

  async getSessions(userId, contentId) {
    return chatRepository.findSessionsByUser(userId, contentId);
  },

  async getMessages(sessionId, userId) {
    // Verify session belongs to user before returning messages
    const session = await chatRepository.findSessionById(sessionId);
    if (!session) throw ApiError.notFound('Chat session not found');
    if (session.userId.toString() !== userId.toString()) {
      throw ApiError.forbidden('Access denied');
    }
    return chatRepository.findMessagesBySession(sessionId);
  },

  async createSession(userId, contentId, title = 'New Conversation') {
    // Verify content belongs to user
    const content = await contentRepository.findByIdAndUserId(contentId, userId);
    if (!content) throw ApiError.notFound('Content not found');
    return chatRepository.createSession({ userId, contentId, title });
  },

  async renameSession(sessionId, userId, newTitle) {
    const session = await chatRepository.findSessionById(sessionId);
    if (!session) throw ApiError.notFound('Chat session not found');
    if (session.userId.toString() !== userId.toString()) {
      throw ApiError.forbidden('Access denied');
    }
    if (!newTitle || !newTitle.trim()) {
      throw ApiError.badRequest('Title cannot be empty');
    }
    return chatRepository.updateSession(sessionId, { title: newTitle.trim() });
  },

  async deleteSession(sessionId, userId) {
    const session = await chatRepository.findSessionById(sessionId);
    if (!session) throw ApiError.notFound('Chat session not found');
    if (session.userId.toString() !== userId.toString()) {
      throw ApiError.forbidden('Access denied');
    }
    await chatRepository.deleteSession(sessionId);
    return { deleted: true };
  },

  /**
   * Full RAG pipeline:
   * 1. Embed the user query (Python AI Service → heuristic fallback)
   * 2. Vector search for relevant chunks (Atlas $vectorSearch → cosine fallback)
   * 3. Generate grounded LLM answer with citations (Python AI Service → heuristic)
   * 4. Save user message + assistant message to DB
   * 5. Return both messages + sessionId
   *
   * SECURITY:
   *   - userId sourced ONLY from req.user (JWT-verified) — never trust client payload
   *   - contentId ownership enforced via contentRepository.findByIdAndUserId
   *   - embeddingRepository.vectorSearch always filters by userId + contentId
   */
  async askQuestion(userId, contentId, sessionId, question) {
    if (!question || question.trim().length === 0) {
      throw ApiError.badRequest('Question cannot be empty');
    }
    const trimmedQuery = question.trim();

    // ── Verify content ownership ─────────────────────────────────────────
    const content = await contentRepository.findByIdAndUserId(contentId, userId);
    if (!content) throw ApiError.notFound('Content not found');

    // ── Get or create session ────────────────────────────────────────────
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const newSession = await chatRepository.createSession({
        userId,
        contentId,
        title: trimmedQuery.slice(0, 60) + (trimmedQuery.length > 60 ? '...' : '')
      });
      activeSessionId = newSession.id || newSession._id.toString();
    } else {
      // Verify session ownership
      const session = await chatRepository.findSessionById(activeSessionId);
      if (!session || session.userId.toString() !== userId.toString()) {
        throw ApiError.forbidden('Access denied to session');
      }
    }

    // ── Save user message ────────────────────────────────────────────────
    const userMessage = await chatRepository.createMessage({
      sessionId: activeSessionId,
      contentId,
      userId,
      role: 'USER',
      content: trimmedQuery
    });

    let answer = "I couldn't find enough information in this content to answer that.";
    let sources = [];
    let grounded = false;
    let tokensUsed = 0;

    try {
      // ── Step 1: Embed the query ────────────────────────────────────────
      logger.info(`[chatService] Embedding query for content ${contentId}`, { sessionId: activeSessionId });
      const { embeddings } = await aiService.generateEmbeddings([trimmedQuery]);
      const queryEmbedding = embeddings?.[0] || [];

      // ── Step 2: Vector search (ownership-enforced) ─────────────────────
      let retrievedChunks = [];
      if (queryEmbedding.length > 0) {
        retrievedChunks = await embeddingRepository.vectorSearch(
          queryEmbedding,
          userId,
          contentId,
          { topK: RAG_TOP_K, threshold: RAG_SIMILARITY_THRESHOLD }
        );
        logger.info(`[chatService] Retrieved ${retrievedChunks.length} chunks for RAG`, {
          contentId, sessionId: activeSessionId
        });
      }

      // ── Step 3: Load conversation history for follow-up context ────────
      const recentMessages = await chatRepository.findMessagesBySession(
        activeSessionId,
        MAX_HISTORY_MESSAGES
      );
      // Map to [{role, content}] for the AI service — exclude the current user msg
      const conversationHistory = (recentMessages || [])
        .filter((m) => m.id !== userMessage.id && m.id !== userMessage._id?.toString())
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }));

      // ── Step 4: Generate grounded RAG answer ───────────────────────────
      const ragResult = await aiService.generateRAGAnswer(
        trimmedQuery,
        contentId,
        retrievedChunks,
        conversationHistory
      );

      answer = ragResult.answer || answer;
      sources = ragResult.sources || [];
      grounded = ragResult.grounded ?? false;
      tokensUsed = ragResult.tokensUsed || 0;

    } catch (err) {
      logger.error(`[chatService] RAG pipeline error for content ${contentId}: ${err.message}`);
      // Continue — save a graceful degraded answer
    }

    // ── Step 5: Map sources to citation schema ───────────────────────────
    const citations = sources.map((s) => ({
      segmentId: null, // EmbeddingChunk-based; no direct segment link needed here
      chunkId: s.chunkId,
      speakerName: s.speaker,
      speakerLabel: s.speakerLabel,
      timestamp: s.startTime,
      excerpt: s.excerpt,
      timecode: s.timecode,
      score: s.score
    }));

    // ── Step 6: Save assistant message ───────────────────────────────────
    const assistantMessage = await chatRepository.createMessage({
      sessionId: activeSessionId,
      contentId,
      userId,
      role: 'ASSISTANT',
      content: answer,
      citations,
      tokensUsed,
      grounded
    });

    // ── Audit Log ────────────────────────────────────────────────────────
    await auditLogRepository.createLog({
      userId,
      action: 'CHAT_MESSAGE_SENT',
      resourceType: 'CHAT',
      resourceId: activeSessionId.toString(),
      metadata: {
        questionLength: trimmedQuery.length,
        chunksRetrieved: sources.length,
        grounded,
        tokensUsed
      }
    });

    return {
      sessionId: activeSessionId,
      userMessage,
      assistantMessage
    };
  }
};
