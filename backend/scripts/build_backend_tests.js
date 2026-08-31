// backend/scripts/build_backend_tests.js
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

// 1. tests/setup.js
write('tests/setup.js', `
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

let mongoServer;

export async function setupTestDb() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDatabase(uri);
}

export async function teardownTestDb() {
  await disconnectDatabase();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export async function clearTestDb() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
`);

// 2. tests/health.test.js
write('tests/health.test.js', `
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
`);

// 3. tests/auth.test.js
write('tests/auth.test.js', `
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
      .set('Authorization', \`Bearer \${token}\`);

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
`);

// 4. tests/user.test.js
write('tests/user.test.js', `
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
      .set('Authorization', \`Bearer \${token}\`);

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Rahul Sharma');
  });

  it('should update user profile', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', \`Bearer \${token}\`)
      .send({ fullName: 'Rahul Sharma V2', timezone: 'UTC+05:30' });

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Rahul Sharma V2');
    expect(res.body.data.timezone).toBe('UTC+05:30');
  });

  it('should change password with valid current password', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me/password')
      .set('Authorization', \`Bearer \${token}\`)
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
`);

// 5. tests/content.test.js
write('tests/content.test.js', `
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
      .set('Authorization', \`Bearer \${token}\`)
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
      .set('Authorization', \`Bearer \${token}\`)
      .send({ title: 'Item 1', contentType: 'AUDIO' });

    await request(app)
      .post('/api/v1/content')
      .set('Authorization', \`Bearer \${token}\`)
      .send({ title: 'Item 2', contentType: 'VIDEO' });

    const res = await request(app)
      .get('/api/v1/content?page=1&limit=10')
      .set('Authorization', \`Bearer \${token}\`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(2);
  });
});
`);

// 6. tests/ownership.test.js
write('tests/ownership.test.js', `
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
      .set('Authorization', \`Bearer \${user1Token}\`)
      .send({ title: 'User 1 Private Recording', contentType: 'AUDIO' });

    user1ContentId = contentRes.body.data.id;
  });

  it('should allow User 1 to access their own content', async () => {
    const res = await request(app)
      .get(\`/api/v1/content/\${user1ContentId}\`)
      .set('Authorization', \`Bearer \${user1Token}\`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user1ContentId);
  });

  it('should block User 2 from accessing User 1 content with 403 Forbidden', async () => {
    const res = await request(app)
      .get(\`/api/v1/content/\${user1ContentId}\`)
      .set('Authorization', \`Bearer \${user2Token}\`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
`);

// 7. tests/admin.test.js
write('tests/admin.test.js', `
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
      .set('Authorization', \`Bearer \${userToken}\`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow ADMIN to access /api/v1/admin/overview', async () => {
    const res = await request(app)
      .get('/api/v1/admin/overview')
      .set('Authorization', \`Bearer \${adminToken}\`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalUsers).toBeDefined();
  });

  it('should allow ADMIN to list all registered users', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', \`Bearer \${adminToken}\`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });
});
`);

console.log('Backend test suites written.');
