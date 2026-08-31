import mongoose from 'mongoose';

const wordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    confidence: { type: Number, default: 0.95 }
  },
  { _id: false }
);

const transcriptSegmentSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true
    },
    transcriptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transcript',
      required: true,
      index: true
    },
    speakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Speaker',
      default: null,
      index: true
    },
    speakerLabel: {
      type: String,
      required: true,
      default: 'SPEAKER_00'
    },
    speakerDisplayName: {
      type: String,
      required: true,
      default: 'Speaker 1'
    },
    startTime: {
      type: Number,
      required: true
    },
    endTime: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    words: {
      type: [wordSchema],
      default: []
    },
    sequence: {
      type: Number,
      required: true
    },
    confidence: {
      type: Number,
      default: 0.95
    },
    // Reserved for Phase 10 Vector Search embeddings
    embedding: {
      type: [Number],
      default: undefined,
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.contentId = ret.contentId ? ret.contentId.toString() : null;
        ret.transcriptId = ret.transcriptId ? ret.transcriptId.toString() : null;
        ret.speakerId = ret.speakerId ? ret.speakerId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

transcriptSegmentSchema.index({ contentId: 1, sequence: 1 });
transcriptSegmentSchema.index({ contentId: 1, startTime: 1 });
transcriptSegmentSchema.index({ contentId: 1, speakerId: 1 });
transcriptSegmentSchema.index({ text: 'text' });

export const TranscriptSegment = mongoose.model('TranscriptSegment', transcriptSegmentSchema);
