// backend/scripts/build_phase3_models.js
import fs from 'fs';
import path from 'path';

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function write(file, content) {
  const p = path.resolve('c:/Users/Lenovo/Desktop/wrapAI/backend', file);
  ensureDir(p);
  fs.writeFileSync(p, content.trim() + '\n', 'utf8');
  console.log(`[OK] ${file}`);
}

// 1. src/models/User.js
write('src/models/User.js', `
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, USER_STATUS } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE
    },
    storageUsedBytes: {
      type: Number,
      default: 0
    },
    storageLimitBytes: {
      type: Number,
      default: 5368709120 // 5 GB default
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: { theme: 'light', emailNotifications: true, autoSummarize: true }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
};

export const User = mongoose.model('User', userSchema);
`);

// 2. src/models/Content.js
write('src/models/Content.js', `
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
`);

// 3. src/models/Transcript.js
write('src/models/Transcript.js', `
import mongoose from 'mongoose';

const transcriptSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    language: {
      type: String,
      default: 'en'
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    wordCount: {
      type: Number,
      default: 0
    },
    processingModel: {
      type: String,
      default: 'whisper-large-v3'
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'COMPLETED'
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

export const Transcript = mongoose.model('Transcript', transcriptSchema);
`);

// 4. src/models/TranscriptSegment.js
write('src/models/TranscriptSegment.js', `
import mongoose from 'mongoose';

const wordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    confidence: { type: Number, default: 0.95 }
  },
  { _id: false }
);

const transcriptSegmentSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true
    },
    transcriptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transcript',
      required: true,
      index: true
    },
    speakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Speaker',
      default: null,
      index: true
    },
    speakerLabel: {
      type: String,
      required: true,
      default: 'SPEAKER_00'
    },
    speakerDisplayName: {
      type: String,
      required: true,
      default: 'Speaker 1'
    },
    startTime: {
      type: Number,
      required: true
    },
    endTime: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    words: {
      type: [wordSchema],
      default: []
    },
    sequence: {
      type: Number,
      required: true
    },
    confidence: {
      type: Number,
      default: 0.95
    },
    // Reserved for Phase 10 Vector Search embeddings
    embedding: {
      type: [Number],
      default: undefined,
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.contentId = ret.contentId ? ret.contentId.toString() : null;
        ret.transcriptId = ret.transcriptId ? ret.transcriptId.toString() : null;
        ret.speakerId = ret.speakerId ? ret.speakerId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

transcriptSegmentSchema.index({ contentId: 1, sequence: 1 });
transcriptSegmentSchema.index({ contentId: 1, startTime: 1 });
transcriptSegmentSchema.index({ contentId: 1, speakerId: 1 });
transcriptSegmentSchema.index({ text: 'text' });

export const TranscriptSegment = mongoose.model('TranscriptSegment', transcriptSegmentSchema);
`);

// 5. src/models/Speaker.js
write('src/models/Speaker.js', `
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
`);

// 6. src/models/Topic.js
write('src/models/Topic.js', `
import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
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
    summary: {
      type: String,
      default: ''
    },
    startTime: {
      type: Number,
      required: true
    },
    endTime: {
      type: Number,
      required: true
    },
    segmentCount: {
      type: Number,
      default: 0
    },
    sequence: {
      type: Number,
      required: true
    },
    keyTakeaway: {
      type: String,
      default: ''
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

topicSchema.index({ contentId: 1, sequence: 1 });

export const Topic = mongoose.model('Topic', topicSchema);
`);

// 7. src/models/Decision.js
write('src/models/Decision.js', `
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
`);

// 8. src/models/ActionItem.js
write('src/models/ActionItem.js', `
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
`);

// 9. src/models/Report.js
write('src/models/Report.js', `
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
`);

// 10. src/models/ChatSession.js
write('src/models/ChatSession.js', `
import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'Discussion on Content'
    },
    messageCount: {
      type: Number,
      default: 0
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.userId = ret.userId ? ret.userId.toString() : null;
        ret.contentId = ret.contentId ? ret.contentId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

chatSessionSchema.index({ userId: 1, contentId: 1, createdAt: -1 });

export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
`);

// 11. src/models/ChatMessage.js
write('src/models/ChatMessage.js', `
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
`);

// 12. src/models/ProcessingJob.js
write('src/models/ProcessingJob.js', `
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
`);

// 13. src/models/AuditLog.js
write('src/models/AuditLog.js', `
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'USER_LOGIN',
        'USER_REGISTER',
        'USER_PASSWORD_CHANGE',
        'CONTENT_CREATED',
        'CONTENT_UPDATED',
        'CONTENT_DELETED',
        'SPEAKER_RENAMED',
        'ACTION_ITEM_UPDATED',
        'REPORT_GENERATED',
        'CHAT_MESSAGE_SENT',
        'ADMIN_USER_STATUS_CHANGE',
        'ADMIN_JOB_RETRY'
      ]
    },
    resourceType: {
      type: String,
      required: true,
      enum: ['USER', 'CONTENT', 'TRANSCRIPT', 'REPORT', 'CHAT', 'JOB', 'SYSTEM']
    },
    resourceId: {
      type: String,
      default: null,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
`);

// 14. src/models/index.js
write('src/models/index.js', `
export { User } from './User.js';
export { Content } from './Content.js';
export { Transcript } from './Transcript.js';
export { TranscriptSegment } from './TranscriptSegment.js';
export { Speaker } from './Speaker.js';
export { Topic } from './Topic.js';
export { Decision } from './Decision.js';
export { ActionItem } from './ActionItem.js';
export { Report } from './Report.js';
export { ChatSession } from './ChatSession.js';
export { ChatMessage } from './ChatMessage.js';
export { ProcessingJob } from './ProcessingJob.js';
export { AuditLog } from './AuditLog.js';
`);

console.log('Phase 3 Models Generated Successfully.');
