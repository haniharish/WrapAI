import mongoose from 'mongoose';
import { CONTENT_TYPES, PROCESSING_STATUS } from '../constants/contentTypes.js';

const summarySchema = new mongoose.Schema(
  {
    keyTakeaway: { type: String, default: '' },
    executiveSummary: { type: String, default: '' },
    detailedSummary: { type: String, default: '' },
    modelVersion: { type: String, default: 'gemini-1.5-pro' },
    generatedAt: { type: Date, default: null }
  },
  { _id: false }
);

const keyPointSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    importance: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
    speakerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Speaker', default: null },
    speakerName: { type: String, default: '' },
    category: { type: String, default: 'General' },
    startTime: { type: Number, default: 0 },
    endTime: { type: Number, default: 0 }
  },
  { _id: false }
);

const highlightSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    importance: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'HIGH' }
  },
  { _id: false }
);

const contentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Content title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    contentType: {
      type: String,
      enum: Object.values(CONTENT_TYPES),
      required: true
    },
    sourceType: {
      type: String,
      enum: ['UPLOAD', 'URL', 'TEXT'],
      default: 'UPLOAD'
    },
    originalFileName: {
      type: String,
      default: null
    },
    sourceUrl: {
      type: String,
      default: null
    },
    rawText: {
      type: String,
      default: null
    },
    storageProvider: {
      type: String,
      enum: ['AWS_S3', 'LOCAL_STORAGE'],
      default: 'AWS_S3'
    },
    storageKey: {
      type: String,
      default: null
    },
    mediaDurationSeconds: {
      type: Number,
      default: null
    },
    fileSizeBytes: {
      type: Number,
      default: 0
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream'
    },
    processingStatus: {
      type: String,
      enum: Object.values(PROCESSING_STATUS),
      default: PROCESSING_STATUS.UPLOADED,
      index: true
    },
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    processingError: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    language: {
      type: String,
      default: 'en'
    },
    speakersCount: {
      type: Number,
      default: 0
    },
    hasReport: {
      type: Boolean,
      default: false
    },
    tags: {
      type: [String],
      default: []
    },
    summary: {
      type: summarySchema,
      default: () => ({})
    },
    keyPoints: {
      type: [keyPointSchema],
      default: []
    },
    highlights: {
      type: [highlightSchema],
      default: []
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.userId = ret.userId ? ret.userId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

contentSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
contentSchema.index({ userId: 1, processingStatus: 1 });
contentSchema.index({ userId: 1, contentType: 1 });
contentSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Content = mongoose.model('Content', contentSchema);
