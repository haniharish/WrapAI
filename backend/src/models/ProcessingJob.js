import mongoose from 'mongoose';
import { PROCESSING_STATUS } from '../constants/contentTypes.js';

const processingJobSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    jobType: {
      type: String,
      enum: ['FULL_PIPELINE', 'AUDIO_EXTRACTION', 'TRANSCRIPTION', 'DIARIZATION', 'LLM_INTELLIGENCE', 'REPORT_GENERATION'],
      default: 'FULL_PIPELINE'
    },
    stage: {
      type: String,
      enum: Object.values(PROCESSING_STATUS),
      default: PROCESSING_STATUS.QUEUED
    },
    status: {
      type: String,
      enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'QUEUED',
      index: true
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    error: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    logs: {
      type: [String],
      default: []
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.contentId = ret.contentId ? ret.contentId.toString() : null;
        ret.userId = ret.userId ? ret.userId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

processingJobSchema.index({ status: 1, createdAt: -1 });

export const ProcessingJob = mongoose.model('ProcessingJob', processingJobSchema);
