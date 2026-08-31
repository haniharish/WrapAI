import mongoose from 'mongoose';
import {
  REPORT_TYPES,
  REPORT_FORMATS,
  REPORT_DETAIL_LEVELS,
  REPORT_STATUS
} from '../constants/contentTypes.js';

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
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
      default: null
    },
    transcriptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transcript',
      default: null
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
      default: REPORT_TYPES.MEETING_REPORT
    },
    template: {
      type: String,
      default: 'MEETING'
    },
    detailLevel: {
      type: String,
      enum: Object.values(REPORT_DETAIL_LEVELS),
      default: REPORT_DETAIL_LEVELS.STANDARD
    },
    format: {
      type: String,
      enum: Object.values(REPORT_FORMATS),
      default: REPORT_FORMATS.PDF
    },
    sections: {
      type: [String],
      default: ['SUMMARY', 'TOPICS', 'DECISIONS', 'ACTION_ITEMS', 'HIGHLIGHTS', 'PARTICIPANTS']
    },
    structuredData: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    htmlContent: {
      type: String,
      default: ''
    },
    markdownContent: {
      type: String,
      default: ''
    },
    storageKey: {
      type: String,
      default: null
    },
    pdfStorageKey: {
      type: String,
      default: null
    },
    docxStorageKey: {
      type: String,
      default: null
    },
    fileSizeBytes: {
      type: Number,
      default: 0
    },
    mimeType: {
      type: String,
      default: 'application/pdf'
    },
    status: {
      type: String,
      enum: ['QUEUED', 'GENERATING', 'COMPLETED', 'FAILED', 'DRAFT', 'GENERATED', 'VIEWED'],
      default: 'COMPLETED'
    },
    errorMessage: {
      type: String,
      default: null
    },
    version: {
      type: Number,
      default: 1
    },
    analysisVersion: {
      type: Number,
      default: 1
    },
    transcriptVersion: {
      type: Number,
      default: 1
    },
    // Secure Sharing Fields
    isShared: {
      type: Boolean,
      default: false,
      index: true
    },
    shareToken: {
      type: String,
      default: null
    },

    shareExpiresAt: {
      type: Date,
      default: null
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.contentId = ret.contentId ? ret.contentId.toString() : null;
        ret.userId = ret.userId ? ret.userId.toString() : null;
        ret.analysisId = ret.analysisId ? ret.analysisId.toString() : null;
        ret.transcriptId = ret.transcriptId ? ret.transcriptId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ contentId: 1, createdAt: -1 });
reportSchema.index({ contentId: 1, version: -1 });
reportSchema.index({ shareToken: 1 }, { sparse: true });

export const Report = mongoose.model('Report', reportSchema);

