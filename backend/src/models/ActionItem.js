import mongoose from 'mongoose';

const actionItemSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true
    },
    task: {
      type: String,
      required: true,
      trim: true
    },
    ownerSpeakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Speaker',
      default: null
    },
    ownerName: {
      type: String,
      default: 'Unassigned'
    },
    deadline: {
      type: Date,
      default: null
    },
    deadlineRaw: {
      type: String,
      default: 'Next Sprint'
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING',
      index: true
    },
    timestamp: {
      type: Number,
      default: 0
    },
    sourceSegmentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TranscriptSegment'
      }
    ]
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.contentId = ret.contentId ? ret.contentId.toString() : null;
        ret.ownerSpeakerId = ret.ownerSpeakerId ? ret.ownerSpeakerId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

actionItemSchema.index({ contentId: 1, status: 1 });

export const ActionItem = mongoose.model('ActionItem', actionItemSchema);
