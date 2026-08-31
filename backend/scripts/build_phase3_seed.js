// backend/scripts/build_phase3_seed.js
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

write('src/database/seed.js', `
import mongoose from 'mongoose';
import { config } from '../config/environment.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import {
  User,
  Content,
  Transcript,
  TranscriptSegment,
  Speaker,
  Topic,
  Decision,
  ActionItem,
  Report,
  ChatSession,
  ChatMessage,
  ProcessingJob,
  AuditLog
} from '../models/index.js';

export async function seedDatabase(customUri = null) {
  if (config.nodeEnv === 'production' && !process.env.ALLOW_PROD_SEED) {
    throw new Error('SECURITY ALERT: Seeding is blocked in production environment.');
  }

  logger.info('Initializing MongoDB Atlas seed routine...');
  await connectDatabase(customUri);

  // 1. Clear Collections
  logger.info('Cleaning existing development database...');
  await Promise.all([
    User.deleteMany({}),
    Content.deleteMany({}),
    Transcript.deleteMany({}),
    TranscriptSegment.deleteMany({}),
    Speaker.deleteMany({}),
    Topic.deleteMany({}),
    Decision.deleteMany({}),
    ActionItem.deleteMany({}),
    Report.deleteMany({}),
    ChatSession.deleteMany({}),
    ChatMessage.deleteMany({}),
    ProcessingJob.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  // 2. Create Users
  logger.info('Seeding test users...');
  const userPasswordHash = await User.hashPassword('Password123');

  const rahul = await User.create({
    fullName: 'Rahul Sharma',
    email: 'rahul@wrapai.io',
    passwordHash: userPasswordHash,
    role: 'USER',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    storageUsedBytes: 1374389534, // ~1.28 GB
    storageLimitBytes: 5368709120, // 5 GB
    preferences: { theme: 'light', emailNotifications: true, autoSummarize: true }
  });

  const sarah = await User.create({
    fullName: 'Sarah Jenkins',
    email: 'sarah.jenkins@wrapai.io',
    passwordHash: userPasswordHash,
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    storageUsedBytes: 524288000,
    storageLimitBytes: 10737418240, // 10 GB
    preferences: { theme: 'dark', emailNotifications: true, autoSummarize: true }
  });

  // 3. Create Content Items for Rahul
  logger.info('Seeding multi-modal content records...');
  const content1 = await Content.create({
    userId: rahul._id,
    title: 'Q3 Architecture Sync & MongoDB Scalability Review',
    description: 'Quarterly backend architecture alignment covering Atlas Vector Search, Diarization pipelines, and Redis caching.',
    contentType: 'VIDEO',
    sourceType: 'UPLOAD',
    originalFileName: 'q3-architecture-sync.mp4',
    sourceUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    storageKey: 'media/rahul/q3_sync.mp4',
    mediaDurationSeconds: 1845,
    fileSizeBytes: 142606336, // 136 MB
    mimeType: 'video/mp4',
    processingStatus: 'COMPLETED',
    processingProgress: 100,
    language: 'en',
    speakersCount: 3,
    hasReport: true,
    tags: ['Architecture', 'Q3', 'MongoDB', 'Redis', 'Meeting'],
    summary: {
      keyTakeaway: 'The engineering team unanimously approved migrating the Vector Search workloads to MongoDB Atlas Vector Search while establishing dedicated BullMQ queue clusters.',
      executiveSummary: 'This 30-minute sync addressed scaling bottlenecks in transcript chunking and vector indexing. Rahul presented the BullMQ queue pipeline, Sarah reviewed security governance, and Alexandre agreed on temporal alignment algorithms.',
      detailedSummary: 'The team evaluated two vector indexing paradigms: standalone Pinecone vs native Atlas Vector Search. MongoDB Atlas was selected due to unified multi-tenant isolation and eliminated synchronization lag.',
      modelVersion: 'gemini-1.5-pro',
      generatedAt: new Date()
    },
    keyPoints: [
      {
        id: 'kp_1',
        text: 'MongoDB Atlas Vector Search chosen over standalone solutions to maintain strict multi-tenant ACID consistency.',
        importance: 'HIGH',
        category: 'Architecture',
        startTime: 93,
        endTime: 165
      },
      {
        id: 'kp_2',
        text: 'BullMQ redis job queue will partition audio extraction, Whisper STT, and LLM extraction into isolated workers.',
        importance: 'HIGH',
        category: 'Infrastructure',
        startTime: 285,
        endTime: 410
      },
      {
        id: 'kp_3',
        text: 'Client media playback will synchronize in real-time with word-level diarization timestamps.',
        importance: 'MEDIUM',
        category: 'Frontend',
        startTime: 615,
        endTime: 740
      }
    ],
    highlights: [
      {
        id: 'hl_1',
        title: 'Atlas Vector Search Consensus',
        description: 'Unanimous team agreement on Atlas native vector indexes.',
        startTime: 145,
        endTime: 180,
        importance: 'HIGH'
      },
      {
        id: 'hl_2',
        title: 'Queue Concurrency Benchmark',
        description: 'Review of BullMQ 50-job concurrent scaling limit.',
        startTime: 380,
        endTime: 450,
        importance: 'HIGH'
      }
    ]
  });

  // 4. Create Speakers
  logger.info('Seeding speakers...');
  const speaker1 = await Speaker.create({
    contentId: content1._id,
    speakerLabel: 'SPEAKER_00',
    displayName: 'Rahul Sharma',
    totalSpeakingTimeSeconds: 840,
    segmentCount: 6,
    avatarColor: '#b7c6c2',
    confidence: 0.96
  });

  const speaker2 = await Speaker.create({
    contentId: content1._id,
    speakerLabel: 'SPEAKER_01',
    displayName: 'Sarah Jenkins',
    totalSpeakingTimeSeconds: 610,
    segmentCount: 4,
    avatarColor: '#bbe2f5',
    confidence: 0.94
  });

  const speaker3 = await Speaker.create({
    contentId: content1._id,
    speakerLabel: 'SPEAKER_02',
    displayName: 'Alexandre Dubois',
    totalSpeakingTimeSeconds: 395,
    segmentCount: 2,
    avatarColor: '#d5f4f9',
    confidence: 0.91
  });

  // 5. Create Transcript & Segments
  logger.info('Seeding diarized transcript & segments...');
  const transcript = await Transcript.create({
    contentId: content1._id,
    userId: rahul._id,
    language: 'en',
    durationSeconds: 1845,
    wordCount: 3820,
    processingModel: 'whisper-large-v3',
    status: 'COMPLETED'
  });

  const segments = [
    {
      contentId: content1._id,
      transcriptId: transcript._id,
      speakerId: speaker1._id,
      speakerLabel: 'SPEAKER_00',
      speakerDisplayName: 'Rahul Sharma',
      startTime: 0,
      endTime: 92,
      sequence: 1,
      text: 'Good morning everyone. Welcome to our Q3 Architecture Sync. Today we need to resolve our database scaling strategy and background queue topologies for WrapAI.',
      words: [
        { word: 'Good', start: 0.0, end: 0.4 },
        { word: 'morning', start: 0.4, end: 0.9 },
        { word: 'everyone.', start: 0.9, end: 1.5 }
      ]
    },
    {
      contentId: content1._id,
      transcriptId: transcript._id,
      speakerId: speaker2._id,
      speakerLabel: 'SPEAKER_01',
      speakerDisplayName: 'Sarah Jenkins',
      startTime: 93,
      endTime: 215,
      sequence: 2,
      text: 'Thanks Rahul. On the database side, keeping our relational and vector metadata inside MongoDB Atlas simplifies our deployment pipeline significantly.',
      words: [
        { word: 'Thanks', start: 93.0, end: 93.5 },
        { word: 'Rahul.', start: 93.5, end: 94.1 }
      ]
    },
    {
      contentId: content1._id,
      transcriptId: transcript._id,
      speakerId: speaker3._id,
      speakerLabel: 'SPEAKER_02',
      speakerDisplayName: 'Alexandre Dubois',
      startTime: 216,
      endTime: 340,
      sequence: 3,
      text: 'I completely agree. For pyannote diarization and Whisper timestamp alignment, we have validated sub-second precision on GPU workers.',
      words: [
        { word: 'I', start: 216.0, end: 216.3 },
        { word: 'completely', start: 216.3, end: 217.0 },
        { word: 'agree.', start: 217.0, end: 217.5 }
      ]
    }
  ];

  await TranscriptSegment.insertMany(segments);

  // 6. Create Topics
  logger.info('Seeding topics...');
  await Topic.insertMany([
    {
      contentId: content1._id,
      title: '1. Welcome & Meeting Objectives',
      summary: 'Rahul outlined goals: database scaling, queue topology, and timestamp synchronization.',
      startTime: 0,
      endTime: 92,
      segmentCount: 1,
      sequence: 1,
      keyTakeaway: 'Focus on production readiness.'
    },
    {
      contentId: content1._id,
      title: '2. MongoDB Atlas & Vector Search Architecture',
      summary: 'Sarah presented data models and multi-tenant security rules for vector indexing.',
      startTime: 93,
      endTime: 215,
      segmentCount: 1,
      sequence: 2,
      keyTakeaway: 'Atlas Vector Search adopted unanimously.'
    },
    {
      contentId: content1._id,
      title: '3. Diarization Alignment Pipeline',
      summary: 'Alexandre confirmed GPU worker latency and timestamp interpolation bounds.',
      startTime: 216,
      endTime: 340,
      segmentCount: 1,
      sequence: 3,
      keyTakeaway: 'pyannote 3.1 selected.'
    }
  ]);

  // 7. Create Decisions
  logger.info('Seeding decisions...');
  await Decision.insertMany([
    {
      contentId: content1._id,
      title: 'Adopt MongoDB Atlas for Native Vector Search',
      description: 'Unified Mongoose models and vector search in Atlas without external vector database dependencies.',
      context: 'Evaluated latency, synchronization risk, and multi-tenant isolation.',
      agreedBySpeakers: [speaker1._id, speaker2._id, speaker3._id],
      agreedByNames: ['Rahul Sharma', 'Sarah Jenkins', 'Alexandre Dubois'],
      timestamp: 165,
      category: 'Database'
    },
    {
      contentId: content1._id,
      title: 'Standardize on BullMQ with Redis for Pipeline Orchestration',
      description: 'Isolate heavy GPU audio transcription from lightweight API controllers.',
      context: 'Ensures API Gateway remains non-blocking under high concurrent upload loads.',
      agreedBySpeakers: [speaker1._id, speaker2._id],
      agreedByNames: ['Rahul Sharma', 'Sarah Jenkins'],
      timestamp: 310,
      category: 'Infrastructure'
    }
  ]);

  // 8. Create Action Items
  logger.info('Seeding action items...');
  await ActionItem.insertMany([
    {
      contentId: content1._id,
      task: 'Implement Mongoose schemas and compound indexes for transcript segments.',
      ownerSpeakerId: speaker1._id,
      ownerName: 'Rahul Sharma',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deadlineRaw: 'Friday EOD',
      status: 'IN_PROGRESS',
      timestamp: 185
    },
    {
      contentId: content1._id,
      task: 'Configure AWS S3 presigned URL ingress policies and CORS rules.',
      ownerSpeakerId: speaker2._id,
      ownerName: 'Sarah Jenkins',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      deadlineRaw: 'Next Sprint',
      status: 'PENDING',
      timestamp: 290
    }
  ]);

  // 9. Create Report
  logger.info('Seeding reports...');
  await Report.create({
    contentId: content1._id,
    userId: rahul._id,
    title: 'Executive Minutes: Q3 Architecture Sync',
    contentTitle: content1.title,
    reportType: 'MEETING_MINUTES',
    htmlContent: '<h1>Executive Minutes</h1><p>The team finalized the MongoDB Atlas database architecture and agreed on BullMQ worker topologies.</p>',
    markdownContent: '# Executive Minutes\\n\\nThe team finalized the MongoDB Atlas database architecture.',
    status: 'GENERATED',
    sections: ['Executive Summary', 'Key Decisions', 'Action Items', 'Topics', 'Diarized Minutes']
  });

  // 10. Create Chat Session & Messages
  logger.info('Seeding chat session...');
  const chatSession = await ChatSession.create({
    userId: rahul._id,
    contentId: content1._id,
    title: 'Database Architecture Discussion',
    messageCount: 2
  });

  await ChatMessage.create({
    sessionId: chatSession._id,
    contentId: content1._id,
    userId: rahul._id,
    role: 'USER',
    content: 'Why did the team choose MongoDB Atlas Vector Search?'
  });

  await ChatMessage.create({
    sessionId: chatSession._id,
    contentId: content1._id,
    userId: rahul._id,
    role: 'ASSISTANT',
    content: 'According to Sarah Jenkins at 01:33, MongoDB Atlas Vector Search was chosen to maintain unified multi-tenant ACID consistency and eliminate data synchronization lag.',
    citations: [
      {
        speakerName: 'Sarah Jenkins',
        timestamp: 93,
        excerpt: 'Keeping our relational and vector metadata inside MongoDB Atlas simplifies our deployment pipeline significantly.'
      }
    ],
    tokensUsed: 128
  });

  // 11. Create Processing Jobs & Audit Logs
  logger.info('Seeding processing jobs and audit logs...');
  await ProcessingJob.create({
    contentId: content1._id,
    userId: rahul._id,
    jobId: 'job_seed_101',
    jobType: 'FULL_PIPELINE',
    stage: 'COMPLETED',
    status: 'COMPLETED',
    progress: 100,
    startedAt: new Date(Date.now() - 3600000),
    completedAt: new Date()
  });

  await AuditLog.create({
    userId: rahul._id,
    action: 'CONTENT_CREATED',
    resourceType: 'CONTENT',
    resourceId: content1._id.toString(),
    metadata: { title: content1.title, contentType: 'VIDEO' }
  });

  logger.info('✅ WrapAI Database Seeding Completed Successfully.');
  if (customUri) {
    await disconnectDatabase();
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
`);

console.log('Phase 3 Seed Script Generated.');
