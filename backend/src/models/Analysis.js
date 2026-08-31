import mongoose from 'mongoose';

const topicItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    summary: { type: String, default: '' },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    sequence: { type: Number, default: 1 },
    keyTakeaway: { type: String, default: '' }
  },
  { _id: false }
);

const keyPointItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    importance: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
    timestamp: { type: Number, default: 0 },
    speakerName: { type: String, default: 'Speaker 1' },
    category: { type: String, default: 'General' }
  },
  { _id: false }
);

const decisionItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: Number, default: 0 },
    category: { type: String, default: 'Architecture' },
    agreedByNames: { type: [String], default: [] }
  },
  { _id: false }
);

const actionItemDataSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    task: { type: String, required: true },
    ownerName: { type: String, default: 'Unassigned' },
    deadlineRaw: { type: String, default: 'Next Sprint' },
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'PENDING' },
    timestamp: { type: Number, default: 0 }
  },
  { _id: false }
);

const questionItemSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    askedBy: { type: String, default: null },
    timestamp: { type: Number, default: 0 },
    answered: { type: Boolean, default: true }
  },
  { _id: false }
);

const highlightItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    timestamp: { type: Number, required: true },
    importance: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'HIGH' }
  },
  { _id: false }
);

const summaryDataSchema = new mongoose.Schema(
  {
    short: { type: String, required: true },
    executive: { type: String, required: true },
    overview: { type: String, default: '' },
    keyTakeaway: { type: String, default: '' }
  },
  { _id: false }
);

const tokenUsageSchema = new mongoose.Schema(
  {
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    estimatedCostUsd: { type: Number, default: 0.0 }
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
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
      default: null,
      index: true
    },
    version: {
      type: Number,
      default: 1
    },
    contentCategory: {
      type: String,
      enum: ['MEETING', 'LECTURE', 'INTERVIEW', 'PRESENTATION', 'DISCUSSION', 'GENERAL'],
      default: 'MEETING'
    },
    summary: {
      type: summaryDataSchema,
      required: true
    },
    topics: {
      type: [topicItemSchema],
      default: []
    },
    keyPoints: {
      type: [keyPointItemSchema],
      default: []
    },
    decisions: {
      type: [decisionItemSchema],
      default: []
    },
    actionItems: {
      type: [actionItemDataSchema],
      default: []
    },
    questions: {
      type: [questionItemSchema],
      default: []
    },
    highlights: {
      type: [highlightItemSchema],
      default: []
    },
    llmProvider: {
      type: String,
      default: 'heuristic'
    },
    llmModel: {
      type: String,
      default: 'gemini-2.5-flash'
    },
    promptVersion: {
      type: String,
      default: 'v1.0'
    },
    tokenUsage: {
      type: tokenUsageSchema,
      default: () => ({})
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'FAILED'],
      default: 'COMPLETED'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.contentId = ret.contentId ? ret.contentId.toString() : null;
        ret.transcriptId = ret.transcriptId ? ret.transcriptId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

analysisSchema.index({ contentId: 1, version: -1 });

export const Analysis = mongoose.model('Analysis', analysisSchema);
