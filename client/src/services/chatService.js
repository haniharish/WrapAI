import { apiClient } from './api.js';

/**
 * Client-side Chat & RAG Service — Phase 10
 * Replaces mock with real API calls to /api/v1/chat endpoints.
 *
 * API shape expected from backend:
 *   GET  /chat/sessions?contentId=xxx         → { data: [ChatSession] }
 *   POST /chat/sessions                        → { data: ChatSession }
 *   GET  /chat/sessions/:id/messages           → { data: [ChatMessage] }
 *   POST /chat/ask                             → { data: { sessionId, userMessage, assistantMessage } }
 *   PATCH /chat/sessions/:id                   → { data: ChatSession }
 *   DELETE /chat/sessions/:id                  → { data: { deleted: true } }
 *
 * ChatMessage shape:
 *   { id, role ('USER'|'ASSISTANT'), content, citations, grounded, tokensUsed, createdAt }
 * Citation shape:
 *   { chunkId, speakerName, speakerLabel, timestamp, excerpt, timecode, score }
 */

const BASE = '/chat';

export const chatService = {
  /**
   * Load all chat sessions for a content item.
   */
  async getSessions(contentId) {
    const res = await apiClient.get(`${BASE}/sessions`, {
      params: contentId ? { contentId } : {}
    });
    return res.data || [];
  },

  /**
   * Create a new chat session for a content item.
   */
  async createSession(contentId, title = 'New Conversation') {
    const res = await apiClient.post(`${BASE}/sessions`, { contentId, title });
    return res.data;
  },

  /**
   * Rename a chat session.
   */
  async renameSession(sessionId, newTitle) {
    const res = await apiClient.patch(`${BASE}/sessions/${sessionId}`, { title: newTitle });
    return res.data;
  },

  /**
   * Delete a chat session and all its messages.
   */
  async deleteSession(sessionId) {
    const res = await apiClient.delete(`${BASE}/sessions/${sessionId}`);
    return res.data;
  },

  /**
   * Get all messages for a session.
   */
  async getMessages(sessionId) {
    const res = await apiClient.get(`${BASE}/sessions/${sessionId}/messages`);
    return res.data || [];
  },

  /**
   * Load chat history for a content item (used by AskAITab).
   * Returns a flat merged array of messages from the most recent session.
   */
  async getChatHistory(contentId) {
    try {
      const sessions = await chatService.getSessions(contentId);
      if (!sessions || sessions.length === 0) return [];
      // Get messages from the most recent session
      const latestSession = sessions[0];
      const messages = await chatService.getMessages(latestSession.id || latestSession._id);
      // Normalize to AskAITab's expected format:
      // AskAITab expects: { id, sender ('USER'|'ASSISTANT'), message, citations }
      return (messages || []).map((m) => ({
        id: m.id || m._id,
        sender: m.role,               // 'USER' | 'ASSISTANT'
        message: m.content,
        citations: (m.citations || []).map((c) => ({
          speaker: c.speakerName,
          speakerLabel: c.speakerLabel,
          timestamp: c.timestamp,
          timecode: c.timecode,
          excerpt: c.excerpt,
          chunkId: c.chunkId,
          score: c.score
        })),
        grounded: m.grounded,
        tokensUsed: m.tokensUsed,
        createdAt: m.createdAt,
        sessionId: latestSession.id || latestSession._id
      }));
    } catch (err) {
      console.error('[chatService.getChatHistory] failed:', err);
      return [];
    }
  },

  /**
   * Send a question and receive a grounded RAG answer.
   * AskAITab calls: chatService.askQuestion(contentId, text)
   *
   * Returns the assistant message in AskAITab-compatible format.
   */
  async askQuestion(contentId, questionText, sessionId = null) {
    const res = await apiClient.post(`${BASE}/ask`, {
      contentId,
      sessionId,
      question: questionText
    });

    const { sessionId: activeSessionId, assistantMessage } = res.data || {};
    if (!assistantMessage) return { id: null, sender: 'ASSISTANT', message: '', citations: [] };

    return {
      id: assistantMessage.id || assistantMessage._id,
      sender: 'ASSISTANT',
      message: assistantMessage.content,
      citations: (assistantMessage.citations || []).map((c) => ({
        speaker: c.speakerName,
        speakerLabel: c.speakerLabel,
        timestamp: c.timestamp,
        timecode: c.timecode,
        excerpt: c.excerpt,
        chunkId: c.chunkId,
        score: c.score
      })),
      grounded: assistantMessage.grounded,
      tokensUsed: assistantMessage.tokensUsed,
      sessionId: activeSessionId,
      createdAt: assistantMessage.createdAt
    };
  }
};
