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
