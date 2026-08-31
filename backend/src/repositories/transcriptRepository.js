import { Transcript } from '../models/Transcript.js';
import { TranscriptSegment } from '../models/TranscriptSegment.js';
import { Speaker } from '../models/Speaker.js';

export const transcriptRepository = {
  async findByContentId(contentId) {
    const [transcript, speakers, segments] = await Promise.all([
      Transcript.findOne({ contentId }).exec(),
      Speaker.find({ contentId }).sort({ speakerLabel: 1 }).exec(),
      TranscriptSegment.find({ contentId }).sort({ sequence: 1 }).exec()
    ]);
    return { transcript, speakers, segments };
  },

  async findSpeakersByContentId(contentId) {
    const speakers = await Speaker.find({ contentId }).sort({ speakerLabel: 1 }).exec();
    const totalSpeakingTime = speakers.reduce((acc, s) => acc + (s.totalSpeakingTimeSeconds || 0), 0) || 1;

    return speakers.map((spk) => {
      const json = spk.toJSON();
      const pct = Math.round(((spk.totalSpeakingTimeSeconds || 0) / totalSpeakingTime) * 1000) / 10;
      json.speakingPercentage = Math.min(100.0, pct);
      return json;
    });
  },

  async findSpeakerById(speakerId) {
    return Speaker.findById(speakerId).exec();
  },

  async createTranscript(data) {
    return Transcript.create(data);
  },

  async insertSegments(segments) {
    return TranscriptSegment.insertMany(segments);
  },

  async insertSpeakers(speakers) {
    return Speaker.insertMany(speakers);
  },

  async updateSpeakerName(contentId, speakerLabel, displayName) {
    const [speakerResult, segmentResult] = await Promise.all([
      Speaker.findOneAndUpdate(
        { contentId, speakerLabel },
        { displayName },
        { new: true }
      ),
      TranscriptSegment.updateMany(
        { contentId, speakerLabel },
        { speakerDisplayName: displayName }
      )
    ]);
    return { speaker: speakerResult, updatedSegmentsCount: segmentResult.modifiedCount };
  },

  async updateSpeakerById(speakerId, displayName) {
    const speaker = await Speaker.findByIdAndUpdate(
      speakerId,
      { displayName },
      { new: true }
    );
    if (!speaker) return null;

    const segmentResult = await TranscriptSegment.updateMany(
      { contentId: speaker.contentId, speakerLabel: speaker.speakerLabel },
      { speakerDisplayName: displayName }
    );

    return { speaker, updatedSegmentsCount: segmentResult.modifiedCount };
  },

  async updateSpeakerDisplayName(contentId, speakerLabel, displayName) {
    return this.updateSpeakerName(contentId, speakerLabel, displayName);
  },

  async deleteByContentId(contentId) {
    await Promise.all([
      Transcript.deleteOne({ contentId }),
      TranscriptSegment.deleteMany({ contentId }),
      Speaker.deleteMany({ contentId })
    ]);
  }
};
