import mongoose from 'mongoose';

const speakerSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true
    },
    speakerLabel: {
      type: String,
      required: true // e.g. "SPEAKER_00"
    },
    displayName: {
      type: String,
      required: true // e.g. "Rahul Sharma"
    },
    totalSpeakingTimeSeconds: {
      type: Number,
      default: 0
    },
    segmentCount: {
      type: Number,
      default: 0
    },
    avatarColor: {
      type: String,
      default: '#b7c6c2'
    },
    confidence: {
      type: Number,
      default: 0.92
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

speakerSchema.index({ contentId: 1, speakerLabel: 1 }, { unique: true });

export const Speaker = mongoose.model('Speaker', speakerSchema);
