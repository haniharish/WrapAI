// backend/scripts/build_phase4_tests.js
import fs from 'fs';
import path from 'path';

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function write(file, content) {
  const p = path.resolve('c:/Users/Lenovo/Desktop/wrapAI/backend', file);
  ensureDir(p);
  fs.writeFileSync(p, content.trim() + '\n', 'utf8');
  console.log(`[OK] ${file}`);
}

write('tests/auth_extended.test.js', `
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

describe('Phase 4 Extended Authentication & Security Flows', () => {
  it('should ignore role: "ADMIN" in registration and assign "USER"', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Sneaky User',
        email: 'sneaky@test.com',
        password: 'Password123',
        role: 'ADMIN' // Malicious attempt to escalate role on register
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('USER');
  });

  it('should reject login for a SUSPENDED account with 403 Forbidden', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Suspended User', email: 'suspended@test.com', password: 'Password123' });

    // Suspend user in DB
    await User.findByIdAndUpdate(reg.body.data.user.id, { status: 'SUSPENDED' });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'suspended@test.com', password: 'Password123' });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.success).toBe(false);
  });

  it('should handle token refresh via cookie/body', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Refresh User', email: 'refresh@test.com', password: 'Password123' });

    // Extract set-cookie
    const cookieHeader = reg.headers['set-cookie'];
    expect(cookieHeader).toBeDefined();

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieHeader);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.token).toBeDefined();
  });

  it('should complete forgot password and reset password flow', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Reset User', email: 'reset@test.com', password: 'OldPassword123' });

    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'reset@test.com' });

    expect(forgotRes.status).toBe(200);
    const resetToken = forgotRes.body.data.resetToken;
    expect(resetToken).toBeDefined();

    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, newPassword: 'BrandNewPassword456' });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.data.token).toBeDefined();

    // Verify login with new password
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'reset@test.com', password: 'BrandNewPassword456' });
    expect(loginRes.status).toBe(200);
  });
});
`);

console.log('Phase 4 Test Suites Generated.');
