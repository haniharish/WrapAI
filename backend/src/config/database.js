import mongoose from 'mongoose';
import { config } from './environment.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDatabase(customUri = null) {
  const uri = customUri || config.mongoUri || config.database?.uri || process.env.MONGODB_URI;

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const opts = {
      autoIndex: config.nodeEnv !== 'production',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    const conn = await mongoose.connect(uri, opts);
    isConnected = true;
    logger.info(`MongoDB Connected: ${conn.connection.host || 'in-memory'} / ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnection...');
      isConnected = false;
    });

    return conn;
  } catch (err) {
    logger.error('Failed to connect to MongoDB:', { error: err.message });
    if (config.nodeEnv !== 'test') {
      // Allow startup in degraded mode if database is temporarily unavailable during scaffolding
      logger.warn('Running in degraded mode without permanent database connection');
    }
    return null;
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected gracefully');
  }
}
