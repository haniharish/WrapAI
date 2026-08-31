import { mockTranscripts } from '../mocks/mockTranscripts.js';
import { mockDelay, createApiResponse, createApiError } from './api.js';

let localTranscripts = { ...mockTranscripts };

export const transcriptService = {
  async getTranscript(contentId) {
    await mockDelay(300);
    // Fallback to sample transcript if ID doesn't have custom mock
    const t = localTranscripts[contentId] || localTranscripts['cnt_01'];
    if (!t) createApiError('TRANSCRIPT_NOT_FOUND', 'Transcript not found');
    return createApiResponse(t);
  },

  async updateSpeakerName(contentId, speakerId, newName) {
    await mockDelay(300);
    const tKey = localTranscripts[contentId] ? contentId : 'cnt_01';
    const transcript = localTranscripts[tKey];
    if (!transcript) createApiError('TRANSCRIPT_NOT_FOUND', 'Transcript not found');

    // Update speaker entry
    transcript.speakers = transcript.speakers.map((s) => (s.id === speakerId ? { ...s, name: newName } : s));
    // Update segments
    transcript.segments = transcript.segments.map((seg) =>
      seg.speakerId === speakerId ? { ...seg, speakerName: newName } : seg
    );

    return createApiResponse(transcript, 'Speaker renamed successfully across all segments');
  }
};
