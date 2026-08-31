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
      passwordHash: 'hash123456'
    });

    await expect(
      User.create({
        fullName: 'User 2',
        email: 'duplicate@example.com',
        passwordHash: 'hash123456'
      })
    ).rejects.toThrow();
  });

  it('should create Content with embedded summary and key points', async () => {
    const user = await User.create({
      fullName: 'Owner',
      email: 'owner@test.com',
      passwordHash: 'hash123456'
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
    const user = await User.create({ fullName: 'User', email: 'u@test.com', passwordHash: 'hash123456' });
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
    const user = await User.create({ fullName: 'User', email: 'audit@test.com', passwordHash: 'hash123456' });
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
