import { transcriptRepository } from '../repositories/transcriptRepository.js';
import { contentRepository } from '../repositories/contentRepository.js';
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

  async getSpeakers(contentId) {
    const speakers = await transcriptRepository.findSpeakersByContentId(contentId);
    return speakers;
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
      metadata: { speakerLabel, newDisplayName: displayName.trim() }
    });

    return result;
  },

  async updateSpeakerById(speakerId, userId, displayName) {
    if (!displayName || displayName.trim().length === 0) {
      throw ApiError.badRequest('Speaker display name cannot be empty');
    }

    const existingSpeaker = await transcriptRepository.findSpeakerById(speakerId);
    if (!existingSpeaker) {
      throw ApiError.notFound('Speaker not found');
    }

    // Verify content ownership through the speaker's contentId
    const content = await contentRepository.findById(existingSpeaker.contentId);
    if (!content) {
      throw ApiError.notFound('Associated content not found');
    }

    if (content.userId.toString() !== userId.toString()) {
      throw ApiError.forbidden('You do not have permission to modify speakers for this content');
    }

    const result = await transcriptRepository.updateSpeakerById(speakerId, displayName.trim());

    await auditLogRepository.createLog({
      userId,
      action: 'SPEAKER_RENAMED',
      resourceType: 'TRANSCRIPT',
      resourceId: speakerId.toString(),
      metadata: { contentId: existingSpeaker.contentId, speakerLabel: existingSpeaker.speakerLabel, newDisplayName: displayName.trim() }
    });

    return result;
  }
};
