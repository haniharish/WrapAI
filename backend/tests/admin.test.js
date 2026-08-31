import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
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

describe('Admin Authorization (/api/v1/admin)', () => {
  let userToken;
  let adminToken;

  beforeEach(async () => {
    // Normal User
    const regUser = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Normal User',
      email: 'user@wrapai.io',
      password: 'Password123'
    });
    userToken = regUser.body.data.token;

    // Admin User
    const regAdmin = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Admin User',
      email: 'admin@wrapai.io',
      password: 'Password123'
    });
    // Promote to ADMIN directly in database for test
    await User.findByIdAndUpdate(regAdmin.body.data.user.id, { role: 'ADMIN' });

    // Re-login to get JWT with ADMIN role
    const loginAdmin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@wrapai.io',
      password: 'Password123'
    });
    adminToken = loginAdmin.body.data.token;
  });

  it('should reject normal USER from accessing /api/v1/admin/overview with 403', async () => {
    const res = await request(app)
      .get('/api/v1/admin/overview')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow ADMIN to access /api/v1/admin/overview', async () => {
    const res = await request(app)
      .get('/api/v1/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalUsers).toBeDefined();
  });

  it('should allow ADMIN to list all registered users', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });
});
