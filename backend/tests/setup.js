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
