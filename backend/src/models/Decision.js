import mongoose from 'mongoose';

const decisionSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    context: {
      type: String,
      default: ''
    },
    agreedBySpeakers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Speaker'
      }
    ],
    agreedByNames: {
      type: [String],
      default: []
    },
    timestamp: {
      type: Number,
      required: true
    },
    sourceSegmentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TranscriptSegment'
      }
    ],
    category: {
      type: String,
      default: 'Architecture'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.contentId = ret.contentId ? ret.contentId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

decisionSchema.index({ contentId: 1, timestamp: 1 });

export const Decision = mongoose.model('Decision', decisionSchema);
