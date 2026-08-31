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
      .set('Authorization', `Bearer ${userToken}`);
    contentId = contentRes.body.data[0].id;
  });

  it('should retrieve full transcript with speakers and diarized segments', async () => {
    const res = await request(app)
      .get(`/api/v1/content/${contentId}/transcript`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transcript).toBeDefined();
    expect(res.body.data.speakers.length).toBeGreaterThan(0);
    expect(res.body.data.segments.length).toBeGreaterThan(0);
  });

  it('should rename a speaker and cascade the change across all segments', async () => {
    const res = await request(app)
      .patch(`/api/v1/content/${contentId}/speakers`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ speakerLabel: 'SPEAKER_00', displayName: 'Rahul Sharma (Lead Architect)' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify transcript segments now reflect new display name
    const transcriptRes = await request(app)
      .get(`/api/v1/content/${contentId}/transcript`)
      .set('Authorization', `Bearer ${userToken}`);

    const updatedSegment = transcriptRes.body.data.segments.find((s) => s.speakerLabel === 'SPEAKER_00');
    expect(updatedSegment.speakerDisplayName).toBe('Rahul Sharma (Lead Architect)');
  });

  it('should retrieve structured intelligence (topics, decisions, action items)', async () => {
    const res = await request(app)
      .get(`/api/v1/content/${contentId}/intelligence`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.topics.length).toBeGreaterThan(0);
    expect(res.body.data.decisions.length).toBeGreaterThan(0);
    expect(res.body.data.actionItems.length).toBeGreaterThan(0);
  });

  it('should update action item status (PENDING -> COMPLETED)', async () => {
    const intelRes = await request(app)
      .get(`/api/v1/content/${contentId}/intelligence`)
      .set('Authorization', `Bearer ${userToken}`);

    const actionItem = intelRes.body.data.actionItems[0];

    const updateRes = await request(app)
      .patch(`/api/v1/content/actions/${actionItem.id}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'COMPLETED' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('COMPLETED');
  });
});
