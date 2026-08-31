import { transcriptRepository } from '../repositories/transcriptRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { ApiError } from '../utils/ApiError.js';

export const transcriptService = {
  async getTranscript(contentId) {
    const { transcript, speakers, segments } = await transcriptRepository.findByContentId(contentId);
    if (!transcript) {
      throw ApiError.notFound('Transcript not found for this content');
    }
    return {
      transcript,
      speakers,
      segments
    };
  },

  async updateSpeakerName(contentId, userId, speakerLabel, displayName) {
    if (!displayName || displayName.trim().length === 0) {
      throw ApiError.badRequest('Speaker display name cannot be empty');
    }

    const result = await transcriptRepository.updateSpeakerName(contentId, speakerLabel, displayName.trim());
    if (!result.speaker) {
      throw ApiError.notFound(`Speaker ${speakerLabel} not found in content transcript`);
    }

    await auditLogRepository.createLog({
      userId,
      action: 'SPEAKER_RENAMED',
      resourceType: 'TRANSCRIPT',
      resourceId: contentId.toString(),
      metadata: { speakerLabel, newDisplayName: displayName }
    });

    return result;
  }
};
