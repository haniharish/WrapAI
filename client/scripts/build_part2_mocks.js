// client/scripts/build_part2_mocks.js
import fs from 'fs';
import path from 'path';

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function write(file, content) {
  const p = path.resolve('c:/Users/Lenovo/Desktop/wrapAI/client', file);
  ensureDir(p);
  fs.writeFileSync(p, content.trim() + '\n', 'utf8');
  console.log(`[OK] ${file}`);
}

// 1. src/mocks/mockUsers.js
write('src/mocks/mockUsers.js', `
export const mockUsers = [
  {
    id: 'usr_01',
    fullName: 'Rahul Sharma',
    email: 'rahul@wrapai.io',
    role: 'USER',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2026-01-15T09:30:00.000Z',
    storageUsedBytes: 1284505600, // ~1.28 GB
    storageLimitBytes: 5368709120, // 5 GB
    contentCount: 14,
    status: 'ACTIVE',
    timezone: 'UTC+05:30 (India Standard Time)'
  },
  {
    id: 'usr_02',
    fullName: 'Sarah Jenkins',
    email: 'sarah.j@enterprise.com',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2025-11-20T14:15:00.000Z',
    storageUsedBytes: 3829000000,
    storageLimitBytes: 10737418240, // 10 GB
    contentCount: 42,
    status: 'ACTIVE',
    timezone: 'UTC-04:00 (Eastern Time)'
  },
  {
    id: 'usr_03',
    fullName: 'Alexandre Dubois',
    email: 'alex@polytechnique.fr',
    role: 'USER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2026-02-10T11:00:00.000Z',
    storageUsedBytes: 450000000,
    storageLimitBytes: 5368709120,
    contentCount: 5,
    status: 'ACTIVE',
    timezone: 'UTC+01:00 (Central European Time)'
  },
  {
    id: 'usr_04',
    fullName: 'Elena Rostova',
    email: 'elena@deepresearch.org',
    role: 'USER',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2026-02-28T16:45:00.000Z',
    storageUsedBytes: 980000000,
    storageLimitBytes: 5368709120,
    contentCount: 9,
    status: 'INACTIVE',
    timezone: 'UTC+03:00 (Moscow Standard Time)'
  }
];

export const mockCurrentUser = mockUsers[0];
`);

// 2. src/mocks/mockContent.js
write('src/mocks/mockContent.js', `
export const mockContent = [
  {
    id: 'cnt_01',
    userId: 'usr_01',
    title: 'Q3 Engineering Sync — Database & Ingestion Architecture',
    description: 'Core architectural discussion covering MongoDB Atlas vector search, BullMQ background job queues, and FastAPI audio pipelines.',
    contentType: 'VIDEO',
    sourceUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    mediaDurationSeconds: 3120, // 52 mins
    fileSizeBytes: 485000000,
    mimeType: 'video/mp4',
    processingStatus: 'COMPLETED',
    processingProgress: 100,
    hasReport: true,
    tags: ['Architecture', 'Engineering', 'Database', 'Q3 Sync'],
    speakersCount: 3,
    createdAt: '2026-08-28T10:30:00.000Z',
    updatedAt: '2026-08-28T11:25:00.000Z'
  },
  {
    id: 'cnt_02',
    userId: 'usr_01',
    title: 'CS-842: Distributed Consensus & Raft Protocols',
    description: 'Lecture covering leader election, log replication, and Byzantine fault tolerance in distributed computing clusters.',
    contentType: 'AUDIO',
    sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    mediaDurationSeconds: 4680, // 1 hr 18 mins
    fileSizeBytes: 72000000,
    mimeType: 'audio/mp3',
    processingStatus: 'COMPLETED',
    processingProgress: 100,
    hasReport: true,
    tags: ['Computer Science', 'Distributed Systems', 'Lecture'],
    speakersCount: 2,
    createdAt: '2026-08-25T14:00:00.000Z',
    updatedAt: '2026-08-25T15:20:00.000Z'
  },
  {
    id: 'cnt_03',
    userId: 'usr_01',
    title: 'Staff AI Engineer Candidate Interview — Sarah Chen',
    description: 'Technical deep-dive on speaker diarization algorithms, Whisper latency optimization, and streaming vector embeddings.',
    contentType: 'VIDEO',
    sourceUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    mediaDurationSeconds: 2700, // 45 mins
    fileSizeBytes: 340000000,
    mimeType: 'video/mp4',
    processingStatus: 'COMPLETED',
    processingProgress: 100,
    hasReport: true,
    tags: ['Hiring', 'Interview', 'Staff Engineer', 'AI/ML'],
    speakersCount: 3,
    createdAt: '2026-08-22T16:00:00.000Z',
    updatedAt: '2026-08-22T16:50:00.000Z'
  },
  {
    id: 'cnt_04',
    userId: 'usr_01',
    title: 'The AI Revolution Podcast — Future of Multimodal RAG',
    description: 'Discussion with industry researchers regarding context windows, hybrid search, and production agent architectures.',
    contentType: 'AUDIO',
    sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    mediaDurationSeconds: 3600, // 1 hr
    fileSizeBytes: 58000000,
    mimeType: 'audio/mp3',
    processingStatus: 'COMPLETED',
    processingProgress: 100,
    hasReport: true,
    tags: ['Podcast', 'Multimodal', 'RAG', 'Future AI'],
    speakersCount: 2,
    createdAt: '2026-08-19T09:15:00.000Z',
    updatedAt: '2026-08-19T10:20:00.000Z'
  },
  {
    id: 'cnt_05',
    userId: 'usr_01',
    title: 'Product Roadmap & AI Strategy Whitepaper Draft',
    description: 'Internal strategy brief outlining autonomous agent workflows, enterprise privacy boundaries, and customer retention metrics.',
    contentType: 'DOCUMENT',
    sourceUrl: null,
    mediaDurationSeconds: null,
    fileSizeBytes: 420000,
    mimeType: 'text/plain',
    processingStatus: 'COMPLETED',
    processingProgress: 100,
    hasReport: true,
    tags: ['Strategy', 'Roadmap', 'Whitepaper'],
    speakersCount: 1,
    createdAt: '2026-08-15T11:00:00.000Z',
    updatedAt: '2026-08-15T11:05:00.000Z'
  },
  {
    id: 'cnt_06',
    userId: 'usr_01',
    title: 'Keynote Address — Modern Cloud Native Infrastructure',
    description: 'Conference presentation covering serverless scaling, global edge data caching, and container orchestration.',
    contentType: 'URL',
    sourceUrl: 'https://youtube.com/watch?v=mock_cloud_keynote',
    mediaDurationSeconds: 1980,
    fileSizeBytes: 210000000,
    mimeType: 'video/mp4',
    processingStatus: 'PROCESSING',
    processingProgress: 68,
    hasReport: false,
    tags: ['Conference', 'Keynote', 'Cloud'],
    speakersCount: 1,
    createdAt: '2026-08-31T07:10:00.000Z',
    updatedAt: '2026-08-31T07:15:00.000Z'
  }
];
`);

// 3. src/mocks/mockTranscripts.js
write('src/mocks/mockTranscripts.js', `
export const mockTranscripts = {
  cnt_01: {
    contentId: 'cnt_01',
    language: 'en',
    speakers: [
      { id: 'SPK_00', name: 'Rahul Sharma', color: '#302b2f', segmentCount: 18, duration: 1140 },
      { id: 'SPK_01', name: 'Sarah Jenkins', color: '#9f8d8b', segmentCount: 14, duration: 920 },
      { id: 'SPK_02', name: 'Alexandre Dubois', color: '#171e19', segmentCount: 12, duration: 1060 }
    ],
    segments: [
      {
        id: 'seg_01',
        startTime: 0,
        endTime: 45,
        speakerId: 'SPK_00',
        speakerName: 'Rahul Sharma',
        text: 'Good morning everyone. Welcome to the Q3 engineering sync. Today we need to align on three major items: our MongoDB Atlas vector search integration, our background BullMQ queue strategy, and how we handle audio alignment with Whisper and pyannote.'
      },
      {
        id: 'seg_02',
        startTime: 46,
        endTime: 92,
        speakerId: 'SPK_01',
        speakerName: 'Sarah Jenkins',
        text: 'Thanks Rahul. On the database front, we evaluated running separate vector stores like Pinecone versus leveraging MongoDB Atlas Vector Search natively. Given that our documents and metadata already live in Atlas, native vector search eliminates distributed transactions and reduces latency.'
      },
      {
        id: 'seg_03',
        startTime: 93,
        endTime: 165,
        speakerId: 'SPK_02',
        speakerName: 'Alexandre Dubois',
        text: 'I completely agree with Sarah. We benchmarked 1536-dimensional OpenAI embeddings against Atlas vector indexes with cosine similarity. With a pre-filter on userId and contentId, query latency stays well below 45 milliseconds even with high concurrent loads.'
      },
      {
        id: 'seg_04',
        startTime: 166,
        endTime: 230,
        speakerId: 'SPK_00',
        speakerName: 'Rahul Sharma',
        text: 'That is outstanding performance. Let us formally confirm MongoDB Atlas for both operational persistence and vector search. Next, let us discuss background processing. When users upload 500 megabyte video files, how are we preventing Node.js event loop blocks?'
      },
      {
        id: 'seg_05',
        startTime: 231,
        endTime: 315,
        speakerId: 'SPK_01',
        speakerName: 'Sarah Jenkins',
        text: 'We architected a dedicated BullMQ worker pool backed by Redis. Clients upload directly to S3 via presigned URLs. Once uploaded, the API enqueues a job into BullMQ. The background worker pulls the job, strips 16kHz mono audio via FFmpeg, and calls our Python FastAPI engine.'
      },
      {
        id: 'seg_06',
        startTime: 316,
        endTime: 410,
        speakerId: 'SPK_02',
        speakerName: 'Alexandre Dubois',
        text: 'In the Python service, we run Whisper large-v3 for word timestamps and pyannote 3.1 for speaker diarization. We wrote a temporal intersection algorithm that merges word tokens into speaker intervals with sub-second precision.'
      },
      {
        id: 'seg_07',
        startTime: 411,
        endTime: 490,
        speakerId: 'SPK_00',
        speakerName: 'Rahul Sharma',
        text: 'What is our fallback strategy if the LLM produces invalid JSON during the structured intelligence extraction step?'
      },
      {
        id: 'seg_08',
        startTime: 491,
        endTime: 580,
        speakerId: 'SPK_01',
        speakerName: 'Sarah Jenkins',
        text: 'We enforce Pydantic schemas using OpenAI JSON mode. If validation fails, our service triggers an immediate single-shot self-correction retry with the error trace. If that fails, it falls back to a deterministic regex parser so user jobs never crash.'
      },
      {
        id: 'seg_09',
        startTime: 581,
        endTime: 680,
        speakerId: 'SPK_00',
        speakerName: 'Rahul Sharma',
        text: 'Excellent. For deadlines: Sarah, can you finish the BullMQ worker retry configuration by Friday, September 4th? And Alexandre, please deliver the RAG cosine threshold benchmarks by Tuesday, September 8th.'
      },
      {
        id: 'seg_10',
        startTime: 681,
        endTime: 745,
        speakerId: 'SPK_01',
        speakerName: 'Sarah Jenkins',
        text: 'Understood Rahul. I have marked Friday on my calendar and will push the PR with integration tests.'
      },
      {
        id: 'seg_11',
        startTime: 746,
        endTime: 820,
        speakerId: 'SPK_02',
        speakerName: 'Alexandre Dubois',
        text: 'Tuesday works perfectly for me. I will also include the citation grounding score analysis in the report.'
      },
      {
        id: 'seg_12',
        startTime: 821,
        endTime: 900,
        speakerId: 'SPK_00',
        speakerName: 'Rahul Sharma',
        text: 'Great. Let us wrap up the meeting. Thank you team for the solid preparation.'
      }
    ]
  }
};
`);

// 4. src/mocks/mockIntelligence.js
write('src/mocks/mockIntelligence.js', `
export const mockIntelligence = {
  cnt_01: {
    summary: {
      executive: 'The engineering team aligned on using MongoDB Atlas for both operational data and vector search, validated BullMQ and Redis for background job concurrency, and finalized the Whisper + pyannote diarization pipeline with Pydantic self-correcting JSON extraction.',
      detailed: 'During the 52-minute Q3 engineering sync, Rahul Sharma, Sarah Jenkins, and Alexandre Dubois reviewed the platform technical topology. Native MongoDB Atlas Vector Search was chosen over standalone vector databases (e.g., Pinecone) to eliminate distributed transaction overhead and maintain sub-45ms query latencies under user/content pre-filtering. Background processing uses direct-to-S3 presigned uploads and BullMQ worker pools running FFmpeg audio normalization. The AI pipeline integrates Whisper large-v3 and pyannote 3.1 with temporal intersection alignment. Deadlines were established for worker retry configurations and RAG cosine similarity benchmarks.',
      takeaway: 'WrapAI architecture is standardized on Node.js/Express, MongoDB Atlas, Redis/BullMQ, and Python/FastAPI, with hard deliverables scheduled for September 4th and 8th.'
    },
    topics: [
      {
        id: 'top_01',
        number: '01',
        title: 'DATABASE ARCHITECTURE & ATLAS VECTOR SEARCH',
        description: 'Comparison between standalone vector databases and native MongoDB Atlas Vector Search. Benchmarks demonstrated sub-45ms latency with tenant filtering.',
        timestamp: 46,
        segmentCount: 4
      },
      {
        id: 'top_02',
        number: '02',
        title: 'BACKGROUND JOB ORCHESTRATION & S3 INGESTION',
        description: 'Decoupling client uploads using presigned S3 URLs and BullMQ Redis queues to prevent Node.js event loop blocks on multi-gigabyte media.',
        timestamp: 231,
        segmentCount: 3
      },
      {
        id: 'top_03',
        number: '03',
        title: 'SPEECH-TO-TEXT & SPEAKER DIARIZATION PIPELINE',
        description: 'Integration of Whisper large-v3 for word timestamps and pyannote 3.1 for speaker segmentation, linked via temporal intersection.',
        timestamp: 316,
        segmentCount: 2
      },
      {
        id: 'top_04',
        number: '04',
        title: 'STRUCTURED LLM EXTRACTION & DEFENSIVE PARSING',
        description: 'Enforcing Pydantic schemas with JSON mode and implementing single-shot self-correction fallbacks for structured intelligence extraction.',
        timestamp: 491,
        segmentCount: 2
      },
      {
        id: 'top_05',
        number: '05',
        title: 'ACTION ITEMS, ASSIGNMENTS & SPRINT DEADLINES',
        description: 'Formal assignment of deliverables across engineering leads with completion targets set for September 4th and September 8th.',
        timestamp: 581,
        segmentCount: 3
      }
    ],
    keyPoints: [
      {
        id: 'kp_01',
        statement: 'MongoDB Atlas Vector Search adopted natively, eliminating external vector DB sync overhead.',
        speaker: 'Sarah Jenkins',
        timestamp: 46,
        importance: 'HIGH'
      },
      {
        id: 'kp_02',
        statement: 'Tenant-filtered vector queries execute in <45ms with 1536-dimensional embeddings.',
        speaker: 'Alexandre Dubois',
        timestamp: 93,
        importance: 'HIGH'
      },
      {
        id: 'kp_03',
        statement: 'Direct S3 presigned uploads decouple media ingestion from web server threads.',
        speaker: 'Sarah Jenkins',
        timestamp: 231,
        importance: 'MEDIUM'
      },
      {
        id: 'kp_04',
        statement: 'Pydantic self-correction retry guarantees valid JSON extraction without job failures.',
        speaker: 'Sarah Jenkins',
        timestamp: 491,
        importance: 'HIGH'
      }
    ],
    highlights: [
      {
        id: 'hl_01',
        timecode: '00:00:46',
        timestamp: 46,
        title: 'Vector Search Architectural Decision',
        description: 'Agreement to eliminate Pinecone in favor of native Atlas Vector Search.'
      },
      {
        id: 'hl_02',
        timecode: '00:03:51',
        timestamp: 231,
        title: 'Ingestion & Queue Scaling Strategy',
        description: 'BullMQ and presigned S3 storage workflow established.'
      },
      {
        id: 'hl_03',
        timecode: '00:08:11',
        timestamp: 491,
        title: 'Defensive AI Schema Validation',
        description: 'Explanation of Pydantic JSON self-correction fallback loop.'
      },
      {
        id: 'hl_04',
        timecode: '00:09:41',
        timestamp: 581,
        title: 'Sprint Commitment & Deadlines',
        description: 'Formal assignments for worker configuration and RAG benchmarks.'
      }
    ],
    decisions: [
      {
        id: 'dec_01',
        decision: 'Adopt MongoDB Atlas Vector Search for unified operational and semantic search storage.',
        context: 'Evaluated against Pinecone; chose Atlas to eliminate cross-database sync latency and simplify operational maintenance.',
        timestamp: 166,
        timecode: '00:02:46',
        participants: ['Rahul Sharma', 'Sarah Jenkins', 'Alexandre Dubois']
      },
      {
        id: 'dec_02',
        decision: 'Enforce direct S3 presigned URL uploads with BullMQ asynchronous queue orchestration.',
        context: 'Prevents heavy multimedia ingestion from consuming Node.js API gateway memory and bandwidth.',
        timestamp: 231,
        timecode: '00:03:51',
        participants: ['Rahul Sharma', 'Sarah Jenkins']
      },
      {
        id: 'dec_03',
        decision: 'Standardize AI Engine on Python FastAPI with Pydantic JSON schema self-correction.',
        context: 'Guarantees reliable structured intelligence outputs without unhandled parsing exceptions.',
        timestamp: 491,
        timecode: '00:08:11',
        participants: ['Sarah Jenkins', 'Alexandre Dubois']
      }
    ],
    actionItems: [
      {
        id: 'act_01',
        task: 'Configure BullMQ worker exponential backoff and dead-letter queue handlers',
        owner: 'Sarah Jenkins',
        deadline: '2026-09-04',
        status: 'In Progress',
        timestamp: 581,
        timecode: '00:09:41'
      },
      {
        id: 'act_02',
        task: 'Benchmark Atlas Vector Search cosine similarity thresholds (>0.72) for RAG accuracy',
        owner: 'Alexandre Dubois',
        deadline: '2026-09-08',
        status: 'Pending',
        timestamp: 581,
        timecode: '00:09:41'
      },
      {
        id: 'act_03',
        task: 'Implement temporal intersection algorithm for Whisper and pyannote word alignment',
        owner: 'Alexandre Dubois',
        deadline: '2026-09-02',
        status: 'Completed',
        timestamp: 316,
        timecode: '00:05:16'
      },
      {
        id: 'act_04',
        task: 'Finalize Swagger/OpenAPI contracts for Node.js API Gateway endpoints',
        owner: 'Rahul Sharma',
        deadline: '2026-09-05',
        status: 'In Progress',
        timestamp: 581,
        timecode: '00:09:41'
      }
    ]
  }
};
`);

// 5. src/mocks/mockChat.js
write('src/mocks/mockChat.js', `
export const mockChatSessions = {
  cnt_01: [
    {
      id: 'msg_01',
      sender: 'USER',
      message: 'What decision was made regarding the database and vector search?',
      timestamp: '2026-08-31T07:20:00.000Z'
    },
    {
      id: 'msg_02',
      sender: 'ASSISTANT',
      message: 'The team decided to natively adopt MongoDB Atlas for both relational document storage and 1536-dimensional vector search. This choice eliminates distributed transaction overhead and keeps query latency under 45 milliseconds when pre-filtered by tenant.',
      timestamp: '2026-08-31T07:20:03.000Z',
      citations: [
        {
          segmentId: 'seg_02',
          speaker: 'Sarah Jenkins',
          timestamp: 46,
          timecode: '00:00:46',
          excerpt: 'Given that our documents and metadata already live in Atlas, native vector search eliminates distributed transactions and reduces latency.'
        },
        {
          segmentId: 'seg_04',
          speaker: 'Rahul Sharma',
          timestamp: 166,
          timecode: '00:02:46',
          excerpt: 'Let us formally confirm MongoDB Atlas for both operational persistence and vector search.'
        }
      ]
    },
    {
      id: 'msg_03',
      sender: 'USER',
      message: 'Who is responsible for the BullMQ retry configuration and when is the deadline?',
      timestamp: '2026-08-31T07:22:00.000Z'
    },
    {
      id: 'msg_04',
      sender: 'ASSISTANT',
      message: 'Sarah Jenkins is assigned to finish the BullMQ worker retry and backoff configuration with a deadline of Friday, September 4th, 2026.',
      timestamp: '2026-08-31T07:22:02.000Z',
      citations: [
        {
          segmentId: 'seg_09',
          speaker: 'Rahul Sharma',
          timestamp: 581,
          timecode: '00:09:41',
          excerpt: 'Sarah, can you finish the BullMQ worker retry configuration by Friday, September 4th?'
        },
        {
          segmentId: 'seg_10',
          speaker: 'Sarah Jenkins',
          timestamp: 681,
          timecode: '00:11:21',
          excerpt: 'Understood Rahul. I have marked Friday on my calendar and will push the PR with integration tests.'
        }
      ]
    }
  ]
};
`);

// 6. src/mocks/mockProcessingJobs.js
write('src/mocks/mockProcessingJobs.js', `
export const mockProcessingJobs = [
  {
    id: 'job_10495',
    contentId: 'cnt_06',
    contentTitle: 'Keynote Address — Modern Cloud Native Infrastructure',
    user: 'Rahul Sharma',
    userEmail: 'rahul@wrapai.io',
    contentType: 'URL',
    currentStage: 'TRANSCRIPTION',
    progress: 68,
    startedAt: '2026-08-31T07:10:00.000Z',
    status: 'Processing',
    durationSeconds: 142,
    stages: [
      { name: 'UPLOAD', status: 'COMPLETED', progress: 100, label: 'Upload Complete' },
      { name: 'AUDIO_EXTRACTION', status: 'COMPLETED', progress: 100, label: '16kHz Audio Extracted' },
      { name: 'TRANSCRIPTION', status: 'RUNNING', progress: 68, label: 'Whisper Transcribing (68%)' },
      { name: 'SPEAKER_ANALYSIS', status: 'PENDING', progress: 0, label: 'Speaker Diarization' },
      { name: 'AI_ANALYSIS', status: 'PENDING', progress: 0, label: 'Structured Intelligence' },
      { name: 'REPORT', status: 'PENDING', progress: 0, label: 'Report Compilation' }
    ]
  },
  {
    id: 'job_10494',
    contentId: 'cnt_01',
    contentTitle: 'Q3 Engineering Sync — Database & Ingestion Architecture',
    user: 'Rahul Sharma',
    userEmail: 'rahul@wrapai.io',
    contentType: 'VIDEO',
    currentStage: 'REPORT',
    progress: 100,
    startedAt: '2026-08-28T10:30:00.000Z',
    status: 'Completed',
    durationSeconds: 218,
    stages: [
      { name: 'UPLOAD', status: 'COMPLETED', progress: 100 },
      { name: 'AUDIO_EXTRACTION', status: 'COMPLETED', progress: 100 },
      { name: 'TRANSCRIPTION', status: 'COMPLETED', progress: 100 },
      { name: 'SPEAKER_ANALYSIS', status: 'COMPLETED', progress: 100 },
      { name: 'AI_ANALYSIS', status: 'COMPLETED', progress: 100 },
      { name: 'REPORT', status: 'COMPLETED', progress: 100 }
    ]
  },
  {
    id: 'job_10493',
    contentId: 'cnt_99',
    contentTitle: 'Corrupted Stream Test Upload',
    user: 'Alexandre Dubois',
    userEmail: 'alex@polytechnique.fr',
    contentType: 'AUDIO',
    currentStage: 'AUDIO_EXTRACTION',
    progress: 24,
    startedAt: '2026-08-30T14:12:00.000Z',
    status: 'Failed',
    durationSeconds: 32,
    errorMessage: 'FFmpeg non-zero exit code: Invalid AAC audio stream header'
  }
];
`);

// 7. src/mocks/mockAnalytics.js
write('src/mocks/mockAnalytics.js', `
export const mockAnalytics = {
  overview: {
    totalUsers: 1420,
    totalContent: 6840,
    activeJobs: 12,
    completedJobs: 6790,
    failedJobs: 38,
    aiRequests: 248900,
    totalStorageBytes: 4294967296000, // ~4.29 TB
    estimatedCostUsd: 1482.50,
    systemHealth: 'HEALTHY'
  },
  dailyUploads: [
    { date: 'Aug 25', uploads: 184, hours: 92 },
    { date: 'Aug 26', uploads: 210, hours: 114 },
    { date: 'Aug 27', uploads: 265, hours: 148 },
    { date: 'Aug 28', uploads: 310, hours: 172 },
    { date: 'Aug 29', uploads: 295, hours: 160 },
    { date: 'Aug 30', uploads: 240, hours: 130 },
    { date: 'Aug 31', uploads: 342, hours: 198 }
  ],
  contentTypesBreakdown: [
    { type: 'Meetings', percentage: 48, count: 3280, color: '#171e19' },
    { type: 'Lectures', percentage: 24, count: 1640, color: '#9f8d8b' },
    { type: 'Interviews', percentage: 16, count: 1095, color: '#b7c6c2' },
    { type: 'Podcasts & Other', percentage: 12, count: 825, color: '#302b2f' }
  ],
  systemServices: [
    { name: 'API Gateway (Node/Express)', status: 'ONLINE', latencyMs: 24, uptime: '99.98%' },
    { name: 'MongoDB Atlas Cluster', status: 'ONLINE', latencyMs: 12, uptime: '99.99%' },
    { name: 'Atlas Vector Search Engine', status: 'ONLINE', latencyMs: 38, uptime: '99.95%' },
    { name: 'Python AI Engine (FastAPI)', status: 'ONLINE', latencyMs: 180, uptime: '99.90%' },
    { name: 'BullMQ Worker Pool (Redis)', status: 'HEALTHY', activeWorkers: 8, uptime: '100%' },
    { name: 'AWS S3 Storage Ingress', status: 'ONLINE', latencyMs: 45, uptime: '99.99%' }
  ]
};
`);

console.log('Part 2 mock datasets generated successfully.');
