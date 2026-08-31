import request from 'supertest';
import app from '../src/app.js';
import { setupTestDb, teardownTestDb, clearTestDb } from './setup.js';
import { Content } from '../src/models/Content.js';
import { Speaker } from '../src/models/Speaker.js';
import { Transcript } from '../src/models/Transcript.js';
import { TranscriptSegment } from '../src/models/TranscriptSegment.js';
import { ProcessingJob } from '../src/models/ProcessingJob.js';
import { executeMockProcessingPipeline } from '../src/workers/processingWorker.js';

describe('Phase 8: Speaker Diarization & Speaker-Aware Transcripts', () => {
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
      .send({ fullName: 'User A', email: 'speaker_user_a@wrapai.io', password: 'Password123' });
    userAToken = regA.body.data.token;
    userAId = regA.body.data.user.id;

    // Create User B
    const regB = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'User B', email: 'speaker_user_b@wrapai.io', password: 'Password123' });
    userBToken = regB.body.data.token;
    userBId = regB.body.data.user.id;
  });

  it('should process multi-speaker audio media, persist multiple Speaker records, and link speakerId in segments', async () => {
    const content = await Content.create({
      userId: userAId,
      title: 'Quarterly Executive Review Meeting',
      contentType: 'AUDIO',
      sourceType: 'UPLOAD',
      fileKey: 'users/test/content/quarterly.wav',
      mimeType: 'audio/wav',
      fileSizeBytes: 40960,
      processingStatus: 'QUEUED'
    });

    const job = await ProcessingJob.create({
      jobId: 'job_phase8_diarize_01',
      contentId: content._id,
      userId: userAId,
      status: 'QUEUED',
      stage: 'QUEUED',
      progress: 0,
      logs: []
    });

    // Execute processing pipeline
    await executeMockProcessingPipeline(job);

    // 1. Verify Content updated with speakersCount
    const updatedContent = await Content.findById(content._id);
    expect(updatedContent.processingStatus).toBe('COMPLETED');
    expect(updatedContent.processingProgress).toBe(100);
    expect(updatedContent.speakersCount).toBeGreaterThanOrEqual(2);

    // 2. Verify Speaker documents in MongoDB
    const speakers = await Speaker.find({ contentId: content._id }).sort({ speakerLabel: 1 });
    expect(speakers.length).toBe(2);
    expect(speakers[0].speakerLabel).toBe('SPEAKER_00');
    expect(speakers[0].displayName).toBe('Speaker 1');
    expect(speakers[0].totalSpeakingTimeSeconds).toBeGreaterThan(0);
    expect(speakers[1].speakerLabel).toBe('SPEAKER_01');
    expect(speakers[1].displayName).toBe('Speaker 2');

    // 3. Verify TranscriptSegments have valid speakerId refs
    const segments = await TranscriptSegment.find({ contentId: content._id }).sort({ sequence: 1 });
    expect(segments.length).toBe(3);

    expect(segments[0].speakerId.toString()).toBe(speakers[0]._id.toString());
    expect(segments[0].speakerLabel).toBe('SPEAKER_00');

    expect(segments[1].speakerId.toString()).toBe(speakers[1]._id.toString());
    expect(segments[1].speakerLabel).toBe('SPEAKER_01');

    expect(segments[2].speakerId.toString()).toBe(speakers[0]._id.toString());
    expect(segments[2].speakerLabel).toBe('SPEAKER_00');
  });

  it('should fetch detected speakers with speaking statistics via GET /api/v1/content/:contentId/speakers', async () => {
    const content = await Content.create({
      userId: userAId,
      title: 'Client Interview Session',
      contentType: 'AUDIO',
      sourceType: 'UPLOAD',
      fileKey: 'users/test/content/interview.wav',
      processingStatus: 'QUEUED'
    });

    const job = await ProcessingJob.create({
      jobId: 'job_phase8_speakers_list',
      contentId: content._id,
      userId: userAId,
      status: 'QUEUED',
      stage: 'QUEUED',
      progress: 0,
      logs: []
    });

    await executeMockProcessingPipeline(job);

    const res = await request(app)
      .get(`/api/v1/content/${content._id}/speakers`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);

    const spk1 = res.body.data.find((s) => s.speakerLabel === 'SPEAKER_00');
    expect(spk1).toBeDefined();
    expect(spk1.displayName).toBe('Speaker 1');
    expect(spk1.speakingPercentage).toBeGreaterThan(0);
    expect(spk1.totalSpeakingTimeSeconds).toBeGreaterThan(0);
  });

  it('should rename a speaker via PATCH /api/v1/speakers/:id and cascade name to all segments', async () => {
    const content = await Content.create({
      userId: userAId,
      title: 'Planning Discussion',
      contentType: 'AUDIO',
      sourceType: 'UPLOAD',
      fileKey: 'users/test/content/planning.wav',
      processingStatus: 'QUEUED'
    });

    const job = await ProcessingJob.create({
      jobId: 'job_phase8_rename_by_id',
      contentId: content._id,
      userId: userAId,
      status: 'QUEUED',
      stage: 'QUEUED',
      progress: 0,
      logs: []
    });

    await executeMockProcessingPipeline(job);

    const speaker = await Speaker.findOne({ contentId: content._id, speakerLabel: 'SPEAKER_00' });
    expect(speaker).toBeDefined();

    // Rename via PATCH /api/v1/speakers/:id
    const renameRes = await request(app)
      .patch(`/api/v1/speakers/${speaker._id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ displayName: 'Dr. Sarah Jenkins' });

    expect(renameRes.status).toBe(200);
    expect(renameRes.body.success).toBe(true);
    expect(renameRes.body.data.speaker.displayName).toBe('Dr. Sarah Jenkins');
    expect(renameRes.body.data.speaker.speakerLabel).toBe('SPEAKER_00'); // Preserves underlying AI label

    // Verify all segments for SPEAKER_00 are updated
    const updatedSegments = await TranscriptSegment.find({ contentId: content._id, speakerLabel: 'SPEAKER_00' });
    expect(updatedSegments.length).toBeGreaterThan(0);
    updatedSegments.forEach((seg) => {
      expect(seg.speakerDisplayName).toBe('Dr. Sarah Jenkins');
    });
  });

  it('should rename a speaker via PATCH /api/v1/content/:contentId/speakers', async () => {
    const content = await Content.create({
      userId: userAId,
      title: 'Sprint Retrospective',
      contentType: 'AUDIO',
      sourceType: 'UPLOAD',
      fileKey: 'users/test/content/retro.wav',
      processingStatus: 'QUEUED'
    });

    const job = await ProcessingJob.create({
      jobId: 'job_phase8_rename_by_content',
      contentId: content._id,
      userId: userAId,
      status: 'QUEUED',
      stage: 'QUEUED',
      progress: 0,
      logs: []
    });

    await executeMockProcessingPipeline(job);

    const renameRes = await request(app)
      .patch(`/api/v1/content/${content._id}/speakers`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ speakerLabel: 'SPEAKER_01', displayName: 'Alex Rivera' });

    expect(renameRes.status).toBe(200);
    expect(renameRes.body.success).toBe(true);

    const speaker1 = await Speaker.findOne({ contentId: content._id, speakerLabel: 'SPEAKER_01' });
    expect(speaker1.displayName).toBe('Alex Rivera');

    const seg = await TranscriptSegment.findOne({ contentId: content._id, speakerLabel: 'SPEAKER_01' });
    expect(seg.speakerDisplayName).toBe('Alex Rivera');
  });

  it('should enforce multi-tenant isolation and forbid User B from accessing or renaming User A speakers', async () => {
    const content = await Content.create({
      userId: userAId,
      title: 'Private User A Meeting',
      contentType: 'AUDIO',
      sourceType: 'UPLOAD',
      fileKey: 'users/test/content/private.wav',
      processingStatus: 'QUEUED'
    });

    const job = await ProcessingJob.create({
      jobId: 'job_phase8_isolation',
      contentId: content._id,
      userId: userAId,
      status: 'QUEUED',
      stage: 'QUEUED',
      progress: 0,
      logs: []
    });

    await executeMockProcessingPipeline(job);

    const speaker = await Speaker.findOne({ contentId: content._id, speakerLabel: 'SPEAKER_00' });

    // User B tries to fetch speakers list
    const getRes = await request(app)
      .get(`/api/v1/content/${content._id}/speakers`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(getRes.status).toBe(403);

    // User B tries to rename speaker by ID
    const patchRes = await request(app)
      .patch(`/api/v1/speakers/${speaker._id}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ displayName: 'Malicious Rename' });

    expect(patchRes.status).toBe(403);
  });
});
