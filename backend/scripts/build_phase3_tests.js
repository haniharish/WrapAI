// backend/scripts/build_phase3_tests.js
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

// 1. tests/models.test.js
write('tests/models.test.js', `
import { setupTestDb, teardownTestDb, clearTestDb } from './setup.js';
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
} from '../src/models/index.js';

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

describe('Phase 3 Mongoose Models Validation & Invariants', () => {
  it('should validate and create a User with passwordHash and exclusion in JSON', async () => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      passwordHash: await User.hashPassword('Secret123'),
      role: 'USER'
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
    const json = user.toJSON();
    expect(json.passwordHash).toBeUndefined();
  });

  it('should enforce unique email in User model', async () => {
    await User.create({
      fullName: 'User 1',
      email: 'duplicate@example.com',
      passwordHash: 'hash1'
    });

    await expect(
      User.create({
        fullName: 'User 2',
        email: 'duplicate@example.com',
        passwordHash: 'hash2'
      })
    ).rejects.toThrow();
  });

  it('should create Content with embedded summary and key points', async () => {
    const user = await User.create({
      fullName: 'Owner',
      email: 'owner@test.com',
      passwordHash: 'hash'
    });

    const content = await Content.create({
      userId: user._id,
      title: 'Sprint Planning',
      contentType: 'AUDIO',
      summary: { keyTakeaway: 'Great progress' },
      keyPoints: [{ id: 'kp1', text: 'Point 1', importance: 'HIGH' }]
    });

    expect(content.title).toBe('Sprint Planning');
    expect(content.summary.keyTakeaway).toBe('Great progress');
    expect(content.keyPoints.length).toBe(1);
    expect(content.isDeleted).toBe(false);
  });

  it('should create Transcript and indexed TranscriptSegments with words array', async () => {
    const user = await User.create({ fullName: 'User', email: 'u@test.com', passwordHash: 'hash' });
    const content = await Content.create({ userId: user._id, title: 'Interview', contentType: 'AUDIO' });
    const transcript = await Transcript.create({ contentId: content._id, userId: user._id, language: 'en' });

    const segment = await TranscriptSegment.create({
      contentId: content._id,
      transcriptId: transcript._id,
      speakerLabel: 'SPEAKER_00',
      speakerDisplayName: 'Interviewer',
      startTime: 0.0,
      endTime: 15.5,
      sequence: 1,
      text: 'Welcome to the interview.',
      words: [{ word: 'Welcome', start: 0, end: 1, confidence: 0.99 }]
    });

    expect(segment.sequence).toBe(1);
    expect(segment.words[0].word).toBe('Welcome');
  });

  it('should create ProcessingJob and AuditLog records', async () => {
    const user = await User.create({ fullName: 'User', email: 'audit@test.com', passwordHash: 'hash' });
    const content = await Content.create({ userId: user._id, title: 'Keynote', contentType: 'VIDEO' });

    const job = await ProcessingJob.create({
      contentId: content._id,
      userId: user._id,
      jobId: 'job_test_01',
      stage: 'ANALYZING',
      status: 'PROCESSING',
      progress: 50
    });

    const audit = await AuditLog.create({
      userId: user._id,
      action: 'CONTENT_CREATED',
      resourceType: 'CONTENT',
      resourceId: content._id.toString()
    });

    expect(job.jobId).toBe('job_test_01');
    expect(audit.action).toBe('CONTENT_CREATED');
  });
});
`);

// 2. tests/intelligence.test.js
write('tests/intelligence.test.js', `
import request from 'supertest';
import app from '../src/app.js';
import { setupTestDb, teardownTestDb, clearTestDb } from './setup.js';
import { seedDatabase } from '../src/database/seed.js';

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('Phase 3 Intelligence & Transcript APIs', () => {
  let userToken;
  let contentId;

  beforeAll(async () => {
    await seedDatabase();
    // Login as Rahul
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'rahul@wrapai.io',
      password: 'Password123'
    });
    userToken = res.body.data.token;

    // Get Rahul's content
    const contentRes = await request(app)
      .get('/api/v1/content')
      .set('Authorization', \`Bearer \${userToken}\`);
    contentId = contentRes.body.data[0].id;
  });

  it('should retrieve full transcript with speakers and diarized segments', async () => {
    const res = await request(app)
      .get(\`/api/v1/content/\${contentId}/transcript\`)
      .set('Authorization', \`Bearer \${userToken}\`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transcript).toBeDefined();
    expect(res.body.data.speakers.length).toBeGreaterThan(0);
    expect(res.body.data.segments.length).toBeGreaterThan(0);
  });

  it('should rename a speaker and cascade the change across all segments', async () => {
    const res = await request(app)
      .patch(\`/api/v1/content/\${contentId}/speakers\`)
      .set('Authorization', \`Bearer \${userToken}\`)
      .send({ speakerLabel: 'SPEAKER_00', displayName: 'Rahul Sharma (Lead Architect)' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify transcript segments now reflect new display name
    const transcriptRes = await request(app)
      .get(\`/api/v1/content/\${contentId}/transcript\`)
      .set('Authorization', \`Bearer \${userToken}\`);

    const updatedSegment = transcriptRes.body.data.segments.find((s) => s.speakerLabel === 'SPEAKER_00');
    expect(updatedSegment.speakerDisplayName).toBe('Rahul Sharma (Lead Architect)');
  });

  it('should retrieve structured intelligence (topics, decisions, action items)', async () => {
    const res = await request(app)
      .get(\`/api/v1/content/\${contentId}/intelligence\`)
      .set('Authorization', \`Bearer \${userToken}\`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.topics.length).toBeGreaterThan(0);
    expect(res.body.data.decisions.length).toBeGreaterThan(0);
    expect(res.body.data.actionItems.length).toBeGreaterThan(0);
  });

  it('should update action item status (PENDING -> COMPLETED)', async () => {
    const intelRes = await request(app)
      .get(\`/api/v1/content/\${contentId}/intelligence\`)
      .set('Authorization', \`Bearer \${userToken}\`);

    const actionItem = intelRes.body.data.actionItems[0];

    const updateRes = await request(app)
      .patch(\`/api/v1/content/actions/\${actionItem.id}/status\`)
      .set('Authorization', \`Bearer \${userToken}\`)
      .send({ status: 'COMPLETED' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('COMPLETED');
  });
});
`);

// 3. tests/chat.test.js
write('tests/chat.test.js', `
import request from 'supertest';
import app from '../src/app.js';
import { setupTestDb, teardownTestDb } from './setup.js';
import { seedDatabase } from '../src/database/seed.js';

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('Phase 3 Chat & RAG Preparation APIs (/api/v1/chat)', () => {
  let userToken;
  let contentId;

  beforeAll(async () => {
    await seedDatabase();
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'rahul@wrapai.io',
      password: 'Password123'
    });
    userToken = res.body.data.token;

    const contentRes = await request(app)
      .get('/api/v1/content')
      .set('Authorization', \`Bearer \${userToken}\`);
    contentId = contentRes.body.data[0].id;
  });

  it('should list existing chat sessions for user content', async () => {
    const res = await request(app)
      .get(\`/api/v1/chat/sessions?contentId=\${contentId}\`)
      .set('Authorization', \`Bearer \${userToken}\`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should post a question and receive grounded answer with citations', async () => {
    const res = await request(app)
      .post('/api/v1/chat/ask')
      .set('Authorization', \`Bearer \${userToken}\`)
      .send({
        contentId,
        question: 'What decisions were made about vector databases?'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sessionId).toBeDefined();
    expect(res.body.data.userMessage.content).toBe('What decisions were made about vector databases?');
    expect(res.body.data.assistantMessage.citations.length).toBeGreaterThan(0);
    expect(res.body.data.assistantMessage.citations[0].timestamp).toBeDefined();
  });
});
`);

// 4. tests/aggregations.test.js
write('tests/aggregations.test.js', `
import request from 'supertest';
import app from '../src/app.js';
import { setupTestDb, teardownTestDb } from './setup.js';
import { seedDatabase } from '../src/database/seed.js';

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('Phase 3 Admin Aggregations & Analytics', () => {
  let adminToken;

  beforeAll(async () => {
    await seedDatabase();
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'sarah.jenkins@wrapai.io',
      password: 'Password123'
    });
    adminToken = res.body.data.token;
  });

  it('should return aggregated metrics using MongoDB aggregation pipelines', async () => {
    const res = await request(app)
      .get('/api/v1/admin/overview')
      .set('Authorization', \`Bearer \${adminToken}\`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalUsers).toBe(2);
    expect(res.body.data.activeUsers).toBe(2);
    expect(res.body.data.totalContent).toBe(1);
    expect(res.body.data.totalReports).toBe(1);
    expect(res.body.data.systemHealth).toBe('HEALTHY');
  });

  it('should return content type distribution breakdown', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', \`Bearer \${adminToken}\`);

    expect(res.status).toBe(200);
    expect(res.body.data.contentTypesBreakdown).toBeDefined();
    expect(res.body.data.dailyUploads).toBeDefined();
  });
});
`);

console.log('Phase 3 Test Suites Generated.');
