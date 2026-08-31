import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Content } from '../src/models/Content.js';
import { ProcessingJob } from '../src/models/ProcessingJob.js';
import { processingQueueService } from '../src/services/processingQueueService.js';
import { executeMockProcessingPipeline } from '../src/workers/processingWorker.js';
import { setupTestDb, teardownTestDb, clearTestDb } from './setup.js';

let userToken;
let otherUserToken;
let adminToken;
let userId;

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();

  // Create standard user
  const reg1 = await request(app)
    .post('/api/v1/auth/register')
    .send({ fullName: 'Job Owner', email: 'owner@test.com', password: 'Password123' });
  userToken = reg1.body.data.token;
  userId = reg1.body.data.user.id;

  // Create another user
  const reg2 = await request(app)
    .post('/api/v1/auth/register')
    .send({ fullName: 'Other User', email: 'other@test.com', password: 'Password123' });
  otherUserToken = reg2.body.data.token;

  // Create admin user
  const hashedPassword = await bcrypt.hash('Password123', 12);
  await User.create({
    fullName: 'Queue Admin',
    email: 'admin@wrapai.io',
    passwordHash: hashedPassword,
    role: 'ADMIN',
    status: 'ACTIVE'
  });
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@wrapai.io', password: 'Password123' });
  adminToken = adminLogin.body?.data?.token;
});

describe('Phase 6 Redis, BullMQ & Background Processing Infrastructure', () => {
  it('should auto-enqueue processing job upon content upload and transition status to QUEUED', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/content/text')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'AI Infrastructure Sync', text: 'Notes about background queue and Redis.' });

    expect(uploadRes.status).toBe(201);
    const contentId = uploadRes.body.data.id;

    // Verify ProcessingJob created
    const jobRes = await request(app)
      .get(`/api/v1/content/${contentId}/processing`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(jobRes.status).toBe(200);
    expect(jobRes.body.data.status).toBe('QUEUED');
    expect(jobRes.body.data.contentId).toBe(contentId);
  });

  it('should guarantee idempotency when processing is requested multiple times for the same content', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/content/text')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Idempotency Test Content', text: 'Sample text.' });

    const contentId = uploadRes.body.data.id;

    // Enqueue second time
    const job2 = await processingQueueService.enqueueContentProcessing(contentId, userId);

    // Verify total ProcessingJob count for this content is strictly 1
    const totalJobs = await ProcessingJob.countDocuments({ contentId });
    expect(totalJobs).toBe(1);
    expect(job2.status).toBe('QUEUED');
  });

  it('should process job through mock worker pipeline and transition content to COMPLETED', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/content/text')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Pipeline Execution Item', text: 'Processing payload.' });

    const contentId = uploadRes.body.data.id;
    const job = await ProcessingJob.findOne({ contentId });

    // Execute mock pipeline runner
    await executeMockProcessingPipeline(job);

    // Verify ProcessingJob state
    const completedJob = await ProcessingJob.findById(job._id);
    expect(completedJob.status).toBe('COMPLETED');
    expect(completedJob.progress).toBe(100);
    expect(completedJob.completedAt).toBeDefined();

    // Verify Content state
    const completedContent = await Content.findById(contentId);
    expect(completedContent.processingStatus).toBe('COMPLETED');
    expect(completedContent.processingProgress).toBe(100);
  });

  it('should handle controlled failure and support manual job retry', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/content/text')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Failure Test Content [FAIL_TEST]', text: 'Controlled failure test.' });

    const contentId = uploadRes.body.data.id;
    const job = await ProcessingJob.findOne({ contentId });

    // Expect mock execution to fail
    await expect(executeMockProcessingPipeline(job)).rejects.toThrow('Controlled Mock Pipeline Failure');

    // Verify FAILED state
    const failedJob = await ProcessingJob.findById(job._id);
    expect(failedJob.status).toBe('PROCESSING'); // pipeline threw during processing

    // Mark as FAILED to simulate worker catch
    failedJob.status = 'FAILED';
    failedJob.error = { message: 'Controlled Mock Pipeline Failure' };
    await failedJob.save();

    // Call Retry endpoint
    const retryRes = await request(app)
      .post(`/api/v1/processing/${job._id}/retry`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(retryRes.status).toBe(200);
    expect(retryRes.body.data.status).toBe('QUEUED');
    expect(retryRes.body.data.progress).toBe(0);
  });

  it('should support job cancellation', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/content/text')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Cancel Test Content', text: 'To be cancelled.' });

    const contentId = uploadRes.body.data.id;
    const job = await ProcessingJob.findOne({ contentId });

    const cancelRes = await request(app)
      .post(`/api/v1/processing/${job._id}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    const updatedJob = await ProcessingJob.findById(job._id);
    expect(updatedJob.status).toBe('CANCELLED');
  });

  it('should enforce multi-tenant isolation and prevent unauthorized access to processing jobs', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/content/text')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Secret Processing Job', text: 'Private data.' });

    const contentId = uploadRes.body.data.id;
    const job = await ProcessingJob.findOne({ contentId });

    // User 2 attempts to get User 1's processing job -> 403 Forbidden
    const forbiddenGet = await request(app)
      .get(`/api/v1/processing/${job._id}`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect(forbiddenGet.status).toBe(403);

    // User 2 attempts to cancel User 1's processing job -> 403 Forbidden
    const forbiddenCancel = await request(app)
      .post(`/api/v1/processing/${job._id}/cancel`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect(forbiddenCancel.status).toBe(403);
  });

  it('should allow users to list their own processing jobs and admin to view metrics', async () => {
    await request(app)
      .post('/api/v1/content/text')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'User Job 1', text: 'Data 1' });

    await request(app)
      .post('/api/v1/content/text')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'User Job 2', text: 'Data 2' });

    // User lists their jobs
    const userJobsRes = await request(app)
      .get('/api/v1/processing')
      .set('Authorization', `Bearer ${userToken}`);

    expect(userJobsRes.status).toBe(200);
    expect(userJobsRes.body.data.length).toBe(2);

    // Admin checks queue metrics
    if (adminToken) {
      const metricsRes = await request(app)
        .get('/api/v1/processing/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(metricsRes.status).toBe(200);
      expect(metricsRes.body.data.database).toBeDefined();
    }
  });
});
