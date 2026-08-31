import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { setupTestDb, teardownTestDb } from './setup.js';
import { seedDatabase } from '../src/database/seed.js';
import { executeMockProcessingPipeline } from '../src/workers/processingWorker.js';
import { processingJobRepository } from '../src/repositories/processingJobRepository.js';
import { contentRepository } from '../src/repositories/contentRepository.js';
import { analysisRepository } from '../src/repositories/analysisRepository.js';
import { User, Content, Analysis, Topic, Decision, ActionItem } from '../src/models/index.js';

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('Phase 9: LLM Content Intelligence & Structured Analysis Tests', () => {
  let rahulToken;
  let userBToken;
  let rahulUser;
  let testContentId;

  beforeAll(async () => {
    await seedDatabase();

    // Login Rahul (Owner)
    const rahulLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'rahul@wrapai.io',
      password: 'Password123'
    });
    rahulToken = rahulLogin.body.data.token;
    rahulUser = rahulLogin.body.data.user;

    // Create a non-admin User B
    const userPasswordHash = await User.hashPassword('Password123');
    await User.create({
      fullName: 'User B',
      email: 'user_b@wrapai.io',
      passwordHash: userPasswordHash,
      role: 'USER'
    });

    const userBLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'user_b@wrapai.io',
      password: 'Password123'
    });
    userBToken = userBLogin.body.data.token;

    // Get Rahul's completed seeded content
    const contentList = await request(app)
      .get('/api/v1/content')
      .set('Authorization', `Bearer ${rahulToken}`);
    const completedContent = contentList.body.data.find((c) => c.processingStatus === 'COMPLETED');
    testContentId = completedContent.id;
  });

  it('should run full AI pipeline, perform LLM analysis, and persist Analysis, Topics, Decisions, and ActionItems', async () => {
    // Create new content to run through worker
    const content = await Content.create({
      userId: rahulUser.id,
      title: 'WrapAI Phase 9 AI Intelligence Strategy Session',
      contentType: 'AUDIO',
      storageProvider: 'LOCAL_STORAGE',
      fileKey: 'uploads/sample-audio.wav',
      mediaDurationSeconds: 45.0,
      processingStatus: 'QUEUED'
    });

    const job = await processingJobRepository.create({
      contentId: content._id,
      userId: rahulUser.id,
      jobId: `job_${Date.now()}`,
      jobType: 'FULL_PIPELINE',
      stage: 'QUEUED',
      status: 'QUEUED'
    });

    await executeMockProcessingPipeline(job);

    // Verify DB state
    const updatedContent = await contentRepository.findById(content._id);
    expect(updatedContent.processingStatus).toBe('COMPLETED');
    expect(updatedContent.summary.executiveSummary).toBeDefined();
    expect(updatedContent.keyPoints.length).toBeGreaterThan(0);

    // Verify Analysis model
    const analysis = await analysisRepository.findLatestByContentId(content._id);
    expect(analysis).toBeDefined();
    expect(analysis.contentCategory).toBe('MEETING');
    expect(analysis.summary.short).toBeDefined();
    expect(analysis.topics.length).toBeGreaterThan(0);
    expect(analysis.decisions.length).toBeGreaterThan(0);
    expect(analysis.actionItems.length).toBeGreaterThan(0);
    expect(analysis.tokenUsage.totalTokens).toBeGreaterThan(0);

    // Verify discrete Topic, Decision, and ActionItem models
    const topics = await analysisRepository.findTopicsByContentId(content._id);
    const decisions = await analysisRepository.findDecisionsByContentId(content._id);
    const actionItems = await analysisRepository.findActionItemsByContentId(content._id);

    expect(topics.length).toBeGreaterThan(0);
    expect(decisions.length).toBeGreaterThan(0);
    expect(actionItems.length).toBeGreaterThan(0);
  });

  it('should retrieve structured intelligence via GET /api/v1/content/:contentId/analysis', async () => {
    const res = await request(app)
      .get(`/api/v1/content/${testContentId}/analysis`)
      .set('Authorization', `Bearer ${rahulToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.summary.short).toBeDefined();
    expect(data.summary.executive).toBeDefined();
    expect(data.topics.length).toBeGreaterThan(0);
    expect(data.decisions.length).toBeGreaterThan(0);
    expect(data.actionItems.length).toBeGreaterThan(0);
    expect(data.keyPoints.length).toBeGreaterThan(0);
    expect(data.highlights.length).toBeGreaterThan(0);
  });

  it('should trigger re-analysis without re-transcription via POST /api/v1/content/:contentId/analyze', async () => {
    const res = await request(app)
      .post(`/api/v1/content/${testContentId}/analyze`)
      .set('Authorization', `Bearer ${rahulToken}`)
      .send();

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobId).toBeDefined();
    expect(res.body.data.status).toBe('QUEUED');
  });

  it('should update an action item status via PATCH /api/v1/content/:contentId/action-items/:itemId', async () => {
    const actionItems = await analysisRepository.findActionItemsByContentId(testContentId);
    expect(actionItems.length).toBeGreaterThan(0);
    const targetItem = actionItems[0];

    const res = await request(app)
      .patch(`/api/v1/content/${testContentId}/action-items/${targetItem._id}`)
      .set('Authorization', `Bearer ${rahulToken}`)
      .send({
        status: 'COMPLETED',
        task: 'Implement Mongoose schemas and compound indexes (Completed & Verified)'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.task).toContain('Completed & Verified');
  });

  it('should update a decision via PATCH /api/v1/content/:contentId/decisions/:decisionId', async () => {
    const decisions = await analysisRepository.findDecisionsByContentId(testContentId);
    expect(decisions.length).toBeGreaterThan(0);
    const targetDecision = decisions[0];

    const res = await request(app)
      .patch(`/api/v1/content/${testContentId}/decisions/${targetDecision._id}`)
      .set('Authorization', `Bearer ${rahulToken}`)
      .send({
        title: 'Adopt MongoDB Atlas for Native Vector Search (Finalized with SLA)'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toContain('Finalized with SLA');
  });

  it('should enforce multi-tenant isolation and prevent User B from accessing or modifying User A analysis', async () => {
    // User B tries to get Rahul's analysis
    const getRes = await request(app)
      .get(`/api/v1/content/${testContentId}/analysis`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(getRes.status).toBe(403);

    // User B tries to trigger re-analysis on Rahul's content
    const reanalysisRes = await request(app)
      .post(`/api/v1/content/${testContentId}/analyze`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send();

    expect(reanalysisRes.status).toBe(403);
  });
});
