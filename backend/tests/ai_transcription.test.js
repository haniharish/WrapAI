import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Content } from '../src/models/Content.js';
import { Transcript } from '../src/models/Transcript.js';
import { TranscriptSegment } from '../src/models/TranscriptSegment.js';
import { Speaker } from '../src/models/Speaker.js';
import { ProcessingJob } from '../src/models/ProcessingJob.js';
import { processingQueueService } from '../src/services/processingQueueService.js';
import { executeMockProcessingPipeline } from '../src/workers/processingWorker.js';
import { setupTestDb, teardownTestDb, clearTestDb } from './setup.js';

describe('Phase 7: Python AI Service & Speech-to-Text Integration Tests', () => {
  let userAToken;
  let userAId;
  let userBToken;
  let userBId;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    // Create User A
    const regA = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Rahul Sharma', email: 'rahul@wrapai.io', password: 'Password123' });
    userAToken = regA.body.data.token;
    userAId = regA.body.data.user.id;

    // Create User B
    const regB = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Alice Walker', email: 'alice@wrapai.io', password: 'Password123' });
    userBToken = regB.body.data.token;
    userBId = regB.body.data.user.id;
  });

  it('should process audio media through AI speech-to-text pipeline and persist timestamped transcript', async () => {
    // 1. Upload sample audio file
    const uploadRes = await request(app)
      .post('/api/v1/content/upload')
      .set('Authorization', `Bearer ${userAToken}`)
      .field('title', 'Q3 Engineering Strategy Audio')
      .attach('file', Buffer.from('RIFF....WAVEfmt ....data....'), 'meeting.wav');

    expect(uploadRes.status).toBe(201);
    const contentId = uploadRes.body.data.id;

    // 2. Locate created processing job
    const jobRecord = await ProcessingJob.findOne({ contentId });
    expect(jobRecord).toBeDefined();
    expect(jobRecord.status).toBe('QUEUED');

    // 3. Worker executes processing pipeline
    await executeMockProcessingPipeline(jobRecord);

    // 4. Verify MongoDB Content state
    const updatedContent = await Content.findById(contentId);
    expect(updatedContent.processingStatus).toBe('COMPLETED');
    expect(updatedContent.processingProgress).toBe(100);
    expect(updatedContent.mediaDurationSeconds).toBeGreaterThan(0);

    // 5. Verify MongoDB Transcript collection
    const transcript = await Transcript.findOne({ contentId });
    expect(transcript).toBeDefined();
    expect(transcript.language).toBe('en');
    expect(transcript.wordCount).toBeGreaterThan(0);
    expect(transcript.status).toBe('COMPLETED');

    // 6. Verify MongoDB TranscriptSegment collection
    const segments = await TranscriptSegment.find({ contentId }).sort({ sequence: 1 });
    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0].startTime).toBeDefined();
    expect(segments[0].endTime).toBeGreaterThan(segments[0].startTime);
    expect(segments[0].text).toBeTruthy();
    expect(segments[0].sequence).toBe(1);

    // 7. Verify GET /api/v1/content/:id/transcript REST endpoint
    const transcriptRes = await request(app)
      .get(`/api/v1/content/${contentId}/transcript`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(transcriptRes.status).toBe(200);
    expect(transcriptRes.body.success).toBe(true);
    expect(transcriptRes.body.data.transcript).toBeDefined();
    expect(transcriptRes.body.data.segments.length).toBe(segments.length);
    expect(transcriptRes.body.data.speakers.length).toBeGreaterThan(0);
  });

  it('should process raw text content without speech-to-text and segment into sequential paragraphs', async () => {
    // 1. Submit text content
    const textRes = await request(app)
      .post('/api/v1/content/text')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'Executive Meeting Notes',
        text: 'Paragraph 1: Welcome to the board meeting.\n\nParagraph 2: We have reached our quarterly growth targets.\n\nParagraph 3: Next sprint begins next Monday.'
      });

    expect(textRes.status).toBe(201);
    const contentId = textRes.body.data.id;

    // 2. Execute worker pipeline
    const jobRecord = await ProcessingJob.findOne({ contentId });
    await executeMockProcessingPipeline(jobRecord);

    // 3. Verify transcript segments generated from text
    const segments = await TranscriptSegment.find({ contentId }).sort({ sequence: 1 });
    expect(segments.length).toBe(3);
    expect(segments[0].text).toBe('Paragraph 1: Welcome to the board meeting.');
    expect(segments[1].text).toBe('Paragraph 2: We have reached our quarterly growth targets.');
    expect(segments[2].text).toBe('Paragraph 3: Next sprint begins next Monday.');
    expect(segments[0].sequence).toBe(1);
    expect(segments[1].sequence).toBe(2);
    expect(segments[2].sequence).toBe(3);
  });

  it('should enforce idempotency and replace previous transcript on job retry without creating duplicates', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/content/upload')
      .set('Authorization', `Bearer ${userAToken}`)
      .field('title', 'Idempotency Validation Sync')
      .attach('file', Buffer.from('RIFF....WAVEfmt ....data....'), 'sync.wav');

    const contentId = uploadRes.body.data.id;
    const jobRecord = await ProcessingJob.findOne({ contentId });

    // Execute first time
    await executeMockProcessingPipeline(jobRecord);
    const firstCount = await TranscriptSegment.countDocuments({ contentId });
    expect(firstCount).toBeGreaterThan(0);

    // Execute second time (simulating retry)
    await executeMockProcessingPipeline(jobRecord);
    const secondCount = await TranscriptSegment.countDocuments({ contentId });

    // Count should be identical, no duplicate segments created
    expect(secondCount).toBe(firstCount);
    const transcriptCount = await Transcript.countDocuments({ contentId });
    expect(transcriptCount).toBe(1);
  });

  it('should allow renaming a speaker and update speaker manifest and segments', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/content/upload')
      .set('Authorization', `Bearer ${userAToken}`)
      .field('title', 'Speaker Renaming Sync')
      .attach('file', Buffer.from('RIFF....WAVEfmt ....data....'), 'speech.wav');

    const contentId = uploadRes.body.data.id;
    const jobRecord = await ProcessingJob.findOne({ contentId });
    await executeMockProcessingPipeline(jobRecord);

    // Rename speaker from SPEAKER_00 to "Dr. Harish"
    const patchRes = await request(app)
      .patch(`/api/v1/content/${contentId}/speakers`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        speakerLabel: 'SPEAKER_00',
        displayName: 'Dr. Harish'
      });

    expect(patchRes.status).toBe(200);

    // Verify Speaker document
    const speaker = await Speaker.findOne({ contentId, speakerLabel: 'SPEAKER_00' });
    expect(speaker.displayName).toBe('Dr. Harish');

    // Verify TranscriptSegment document updated
    const segments = await TranscriptSegment.find({ contentId });
    expect(segments[0].speakerDisplayName).toBe('Dr. Harish');
  });

  it('should enforce multi-tenant isolation and prevent User B from accessing User A transcript', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/content/upload')
      .set('Authorization', `Bearer ${userAToken}`)
      .field('title', 'Private User A Audio')
      .attach('file', Buffer.from('RIFF....WAVEfmt ....data....'), 'private.wav');

    const contentId = uploadRes.body.data.id;
    const jobRecord = await ProcessingJob.findOne({ contentId });
    await executeMockProcessingPipeline(jobRecord);

    // User B attempts to access User A's transcript -> 403 Forbidden
    const unauthRes = await request(app)
      .get(`/api/v1/content/${contentId}/transcript`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(unauthRes.status).toBe(403);
  });
});
