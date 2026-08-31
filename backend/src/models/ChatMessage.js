import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    segmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TranscriptSegment', default: null },
    speakerName: { type: String, default: '' },
    timestamp: { type: Number, required: true },
    excerpt: { type: String, required: true }
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
      index: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['USER', 'ASSISTANT', 'SYSTEM'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    citations: {
      type: [citationSchema],
      default: []
    },
    tokensUsed: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.sessionId = ret.sessionId ? ret.sessionId.toString() : null;
        ret.contentId = ret.contentId ? ret.contentId.toString() : null;
        ret.userId = ret.userId ? ret.userId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
