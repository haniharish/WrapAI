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

describe('Phase 3 Chat & RAG Preparation APIs (/api/v1/chat)', () => {
  let userToken;
  let contentId;

  beforeAll(async () => {
    await seedDatabase();
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'rahul@wrapai.io',
      password: 'Password123'
    });
    userToken = res.body.data.token;

    const contentRes = await request(app)
      .get('/api/v1/content')
      .set('Authorization', `Bearer ${userToken}`);
    contentId = contentRes.body.data[0].id;
  });

  it('should list existing chat sessions for user content', async () => {
    const res = await request(app)
      .get(`/api/v1/chat/sessions?contentId=${contentId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should post a question and receive grounded answer with citations', async () => {
    const res = await request(app)
      .post('/api/v1/chat/ask')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        contentId,
        question: 'What decisions were made about vector databases?'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sessionId).toBeDefined();
    expect(res.body.data.userMessage.content).toBe('What decisions were made about vector databases?');
    expect(res.body.data.assistantMessage.citations.length).toBeGreaterThan(0);
    expect(res.body.data.assistantMessage.citations[0].timestamp).toBeDefined();
  });
});
