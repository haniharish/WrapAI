import { transcriptService } from '../services/transcriptService.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const transcriptController = {
  async getTranscript(req, res) {
    const data = await transcriptService.getTranscript(req.params.contentId);
    sendSuccess(res, data, 'Transcript retrieved successfully');
  },

  async getSpeakers(req, res) {
    const speakers = await transcriptService.getSpeakers(req.params.contentId);
    sendSuccess(res, speakers, 'Speakers retrieved successfully');
  },

  async renameSpeaker(req, res) {
    const { speakerLabel, displayName } = req.body;
    const result = await transcriptService.updateSpeakerName(
      req.params.contentId,
      req.user.id,
      speakerLabel,
      displayName
    );
    sendSuccess(res, result, 'Speaker renamed successfully across all segments');
  },

  async renameSpeakerById(req, res) {
    const { displayName } = req.body;
    const result = await transcriptService.updateSpeakerById(
      req.params.id,
      req.user.id,
      displayName
    );
    sendSuccess(res, result, 'Speaker renamed successfully');
  }
};
