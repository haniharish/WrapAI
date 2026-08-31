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
      .set('Authorization', `Bearer ${adminToken}`);

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
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.contentTypesBreakdown).toBeDefined();
    expect(res.body.data.dailyUploads).toBeDefined();
  });
});
