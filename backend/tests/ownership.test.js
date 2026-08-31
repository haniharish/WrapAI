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

describe('Resource Ownership Verification', () => {
  let user1Token;
  let user2Token;
  let user1ContentId;

  beforeEach(async () => {
    // Register User 1
    const reg1 = await request(app).post('/api/v1/auth/register').send({
      fullName: 'User One',
      email: 'user1@test.com',
      password: 'Password123'
    });
    user1Token = reg1.body.data.token;

    // Register User 2
    const reg2 = await request(app).post('/api/v1/auth/register').send({
      fullName: 'User Two',
      email: 'user2@test.com',
      password: 'Password123'
    });
    user2Token = reg2.body.data.token;

    // User 1 creates content
    const contentRes = await request(app)
      .post('/api/v1/content')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'User 1 Private Recording', contentType: 'AUDIO' });

    user1ContentId = contentRes.body.data.id;
  });

  it('should allow User 1 to access their own content', async () => {
    const res = await request(app)
      .get(`/api/v1/content/${user1ContentId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user1ContentId);
  });

  it('should block User 2 from accessing User 1 content with 403 Forbidden', async () => {
    const res = await request(app)
      .get(`/api/v1/content/${user1ContentId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
