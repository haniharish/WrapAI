// backend/scripts/build_phase5_tests.js
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

write('tests/uploads.test.js', `
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Content } from '../src/models/Content.js';
import { setupTestDb, teardownTestDb, clearTestDb } from './setup.js';

let userToken;
let otherUserToken;
let userId;

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();

  // Create primary user
  const reg1 = await request(app)
    .post('/api/v1/auth/register')
    .send({ fullName: 'Content Owner', email: 'owner@test.com', password: 'Password123' });
  userToken = reg1.body.data.token;
  userId = reg1.body.data.user.id;

  // Create secondary user
  const reg2 = await request(app)
    .post('/api/v1/auth/register')
    .send({ fullName: 'Other User', email: 'other@test.com', password: 'Password123' });
  otherUserToken = reg2.body.data.token;
});

describe('Phase 5 File Upload, Storage & Content Management', () => {
  it('should upload an audio file and create an UPLOADED content record', async () => {
    const fakeAudioBuffer = Buffer.from('FAKE_AUDIO_SAMPLE_DATA_MP3');

    const res = await request(app)
      .post('/api/v1/content/upload')
      .set('Authorization', \`Bearer \${userToken}\`)
      .field('title', 'Weekly Team Standup')
      .attach('file', fakeAudioBuffer, { filename: 'standup.mp3', contentType: 'audio/mpeg' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Weekly Team Standup');
    expect(res.body.data.contentType).toBe('AUDIO');
    expect(res.body.data.processingStatus).toBe('UPLOADED');
    expect(res.body.data.storageKey).toBeDefined();
    expect(res.body.data.fileSizeBytes).toBe(fakeAudioBuffer.length);
  });

  it('should upload a video file and track user storage usage', async () => {
    const fakeVideoBuffer = Buffer.from('FAKE_VIDEO_SAMPLE_DATA_MP4_LONG');

    const res = await request(app)
      .post('/api/v1/content/upload')
      .set('Authorization', \`Bearer \${userToken}\`)
      .field('title', 'Product Keynote 2026')
      .attach('file', fakeVideoBuffer, { filename: 'keynote.mp4', contentType: 'video/mp4' });

    expect(res.status).toBe(201);
    expect(res.body.data.contentType).toBe('VIDEO');

    // Check user storage quota update
    const user = await User.findById(userId);
    expect(user.storageUsedBytes).toBe(fakeVideoBuffer.length);
  });

  it('should ingest raw text submission', async () => {
    const textData = 'Sprint retro notes: Architecture finalized, deployment verified.';

    const res = await request(app)
      .post('/api/v1/content/text')
      .set('Authorization', \`Bearer \${userToken}\`)
      .send({
        title: 'Retro Notes',
        text: textData,
        tags: ['retro', 'sprint']
      });

    expect(res.status).toBe(201);
    expect(res.body.data.contentType).toBe('TEXT');
    expect(res.body.data.sourceType).toBe('TEXT');
    expect(res.body.data.rawText).toBe(textData);
  });

  it('should ingest URL submission and reject internal SSRF addresses', async () => {
    // 1. Valid public URL
    const validRes = await request(app)
      .post('/api/v1/content/url')
      .set('Authorization', \`Bearer \${userToken}\`)
      .send({
        title: 'AI Lecture',
        url: 'https://example.com/videos/lecture.mp4'
      });

    expect(validRes.status).toBe(201);
    expect(validRes.body.data.contentType).toBe('URL');

    // 2. Malicious SSRF local URL
    const ssrfRes = await request(app)
      .post('/api/v1/content/url')
      .set('Authorization', \`Bearer \${userToken}\`)
      .send({
        title: 'Internal Metadata',
        url: 'http://localhost:5000/internal'
      });

    expect(ssrfRes.status).toBe(400);
    expect(ssrfRes.body.success).toBe(false);
  });

  it('should list content with search, type filter, and pagination', async () => {
    await request(app)
      .post('/api/v1/content/text')
      .set('Authorization', \`Bearer \${userToken}\`)
      .send({ title: 'Searchable Alpha Doc', text: 'Sample text body.' });

    await request(app)
      .post('/api/v1/content/text')
      .set('Authorization', \`Bearer \${userToken}\`)
      .send({ title: 'Beta Document', text: 'Another text body.' });

    const listRes = await request(app)
      .get('/api/v1/content?search=Alpha')
      .set('Authorization', \`Bearer \${userToken}\`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].title).toBe('Searchable Alpha Doc');
  });

  it('should enforce multi-tenant isolation and prevent unauthorized access or deletion', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/content/text')
      .set('Authorization', \`Bearer \${userToken}\`)
      .send({ title: 'Private User 1 Notes', text: 'Secret confidential notes.' });

    const contentId = uploadRes.body.data.id;

    // User 2 attempts to get User 1's content -> 403 Forbidden
    const forbiddenGet = await request(app)
      .get(\`/api/v1/content/\${contentId}\`)
      .set('Authorization', \`Bearer \${otherUserToken}\`);
    expect(forbiddenGet.status).toBe(403);

    // User 2 attempts to delete User 1's content -> 403 Forbidden
    const forbiddenDel = await request(app)
      .delete(\`/api/v1/content/\${contentId}\`)
      .set('Authorization', \`Bearer \${otherUserToken}\`);
    expect(forbiddenDel.status).toBe(403);

    // User 1 successfully gets and deletes their own content
    const ownerDel = await request(app)
      .delete(\`/api/v1/content/\${contentId}\`)
      .set('Authorization', \`Bearer \${userToken}\`);
    expect(ownerDel.status).toBe(200);
  });

  it('should generate secure signed access URL for uploaded media', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/content/upload')
      .set('Authorization', \`Bearer \${userToken}\`)
      .field('title', 'Interview Audio')
      .attach('file', Buffer.from('AUDIO_BYTES'), { filename: 'interview.mp3', contentType: 'audio/mpeg' });

    const contentId = uploadRes.body.data.id;

    const accessRes = await request(app)
      .get(\`/api/v1/content/\${contentId}/access\`)
      .set('Authorization', \`Bearer \${userToken}\`);

    expect(accessRes.status).toBe(200);
    expect(accessRes.body.data.signedUrl).toBeDefined();
  });
});
`);

console.log('Phase 5 Test Suites Generated.');
