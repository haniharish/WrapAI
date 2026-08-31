import mongoose from 'mongoose';
import { REPORT_TYPES } from '../constants/contentTypes.js';

const reportSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true
    },
    contentTitle: {
      type: String,
      default: ''
    },
    reportType: {
      type: String,
      enum: Object.values(REPORT_TYPES),
      default: REPORT_TYPES.MEETING_MINUTES
    },
    htmlContent: {
      type: String,
      default: ''
    },
    markdownContent: {
      type: String,
      default: ''
    },
    pdfStorageKey: {
      type: String,
      default: null
    },
    docxStorageKey: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['DRAFT', 'GENERATED', 'VIEWED'],
      default: 'GENERATED'
    },
    sections: {
      type: [String],
      default: ['Executive Summary', 'Key Decisions', 'Action Items', 'Topics', 'Diarized Minutes']
    },
    version: {
      type: Number,
      default: 1
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

reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ contentId: 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);
