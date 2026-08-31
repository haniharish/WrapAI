import mongoose from 'mongoose';

const usageRecordSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    metric: {
      type: String,
      enum: [
        'UPLOADS_COUNT',
        'STORAGE_BYTES',
        'MEDIA_MINUTES',
        'TRANSCRIPTION_SECONDS',
        'LLM_ANALYSIS_COUNT',
        'EMBEDDINGS_COUNT',
        'RAG_QUERIES_COUNT',
        'REPORTS_COUNT'
      ],
      required: [true, 'Metric name is required'],
      index: true
    },
    amount: {
      type: Number,
      default: 0
    },
    period: {
      type: String,
      default: () => new Date().toISOString().slice(0, 7) // 'YYYY-MM'
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

usageRecordSchema.index({ workspaceId: 1, metric: 1, period: 1 });

export const UsageRecord = mongoose.model('UsageRecord', usageRecordSchema);
export default UsageRecord;
