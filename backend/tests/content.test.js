import request from 'supertest';
import app from '../src/app.js';
import { setupTestDb, teardownTestDb, clearTestDb } from './setup.js';

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

describe('Content Management APIs (/api/v1/content)', () => {
  let token;

  beforeEach(async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Rahul Sharma',
      email: 'rahul@wrapai.io',
      password: 'SecurePassword123'
    });
    token = reg.body.data.token;
  });

  it('should create content item', async () => {
    const res = await request(app)
      .post('/api/v1/content')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Q3 Engineering Sync',
        description: 'Architecture review meeting',
        contentType: 'AUDIO',
        tags: ['Engineering', 'Q3']
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Q3 Engineering Sync');
    expect(res.body.data.processingStatus).toBe('UPLOADED');
  });

  it('should list content items with pagination', async () => {
    await request(app)
      .post('/api/v1/content')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Item 1', contentType: 'AUDIO' });

    await request(app)
      .post('/api/v1/content')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Item 2', contentType: 'VIDEO' });

    const res = await request(app)
      .get('/api/v1/content?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(2);
  });
});
