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

describe('Authentication API (/api/v1/auth)', () => {
  const testUser = {
    fullName: 'Rahul Sharma',
    email: 'rahul@wrapai.io',
    password: 'SecurePassword123'
  };

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('should reject registration with duplicate email', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);
    const res = await request(app).post('/api/v1/auth/register').send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_RESOURCE');
  });

  it('should reject registration with invalid email or short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'R', email: 'invalid-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.email).toBeDefined();
  });

  it('should authenticate registered user with valid credentials', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('should reject login with wrong password', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should access /api/v1/auth/me with valid Bearer token', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send(testUser);
    const token = reg.body.data.token;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('should reject /api/v1/auth/me without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
