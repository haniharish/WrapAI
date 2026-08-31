import request from 'supertest';
import app from '../src/app.js';
import { setupTestDb, teardownTestDb } from './setup.js';

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('GET /api/v1/health', () => {
  it('should return 200 OK with system status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('HEALTHY');
    expect(res.body.data.service).toBe('WrapAI API Gateway');
  });

  it('should return 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/v1/nonexistent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });
});
