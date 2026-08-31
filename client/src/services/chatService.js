import { mockChatSessions } from '../mocks/mockChat.js';
import { mockDelay, createApiResponse } from './api.js';

let localSessions = { ...mockChatSessions };

export const chatService = {
  async getChatHistory(contentId) {
    await mockDelay(200);
    const history = localSessions[contentId] || localSessions['cnt_01'] || [];
    return createApiResponse(history);
  },

  async askQuestion(contentId, questionText) {
    await mockDelay(800); // Simulate RAG query + LLM generation
    const key = localSessions[contentId] ? contentId : 'cnt_01';
    if (!localSessions[key]) localSessions[key] = [];

    const userMsg = {
      id: `msg_${Date.now()}`,
      sender: 'USER',
      message: questionText,
      timestamp: new Date().toISOString()
    };
    localSessions[key].push(userMsg);

    // Context-sensitive mock responses
    let answerText = 'Based on the discussion, the team aligned on using MongoDB Atlas for vector search and BullMQ with Redis for background task orchestration.';
    let citations = [
      {
        segmentId: 'seg_03',
        speaker: 'Alexandre Dubois',
        timestamp: 93,
        timecode: '00:01:33',
        excerpt: 'We benchmarked 1536-dimensional OpenAI embeddings against Atlas vector indexes with cosine similarity...'
      }
    ];

    if (questionText.toLowerCase().includes('deadline') || questionText.toLowerCase().includes('sarah')) {
      answerText = 'Sarah Jenkins has a deadline of Friday, September 4th to finish the BullMQ worker retry configuration.';
      citations = [
        {
          segmentId: 'seg_09',
          speaker: 'Rahul Sharma',
          timestamp: 581,
          timecode: '00:09:41',
          excerpt: 'Sarah, can you finish the BullMQ worker retry configuration by Friday, September 4th?'
        }
      ];
    }

    const aiMsg = {
      id: `msg_${Date.now() + 1}`,
      sender: 'ASSISTANT',
      message: answerText,
      timestamp: new Date().toISOString(),
      citations
    };
    localSessions[key].push(aiMsg);

    return createApiResponse(aiMsg);
  }
};
