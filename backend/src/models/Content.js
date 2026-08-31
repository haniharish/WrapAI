import mongoose from 'mongoose';
import { CONTENT_TYPES, PROCESSING_STATUS } from '../constants/contentTypes.js';

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
    sourceUrl: {
      type: String,
      default: null
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
    tags: {
      type: [String],
      default: []
    },
    hasReport: {
      type: Boolean,
      default: false
    },
    speakersCount: {
      type: Number,
      default: 0
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
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
contentSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Content = mongoose.model('Content', contentSchema);
