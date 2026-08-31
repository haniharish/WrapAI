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

describe('User Profile APIs (/api/v1/users)', () => {
  let token;

  beforeEach(async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Rahul Sharma',
      email: 'rahul@wrapai.io',
      password: 'SecurePassword123'
    });
    token = reg.body.data.token;
  });

  it('should get current user profile', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Rahul Sharma');
  });

  it('should update user profile', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Rahul Sharma V2', timezone: 'UTC+05:30' });

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Rahul Sharma V2');
    expect(res.body.data.timezone).toBe('UTC+05:30');
  });

  it('should change password with valid current password', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'SecurePassword123', newPassword: 'NewSecurePassword456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify new password works
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'rahul@wrapai.io', password: 'NewSecurePassword456' });
    expect(loginRes.status).toBe(200);
  });
});
