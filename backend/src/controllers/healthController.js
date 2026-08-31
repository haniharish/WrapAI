import mongoose from 'mongoose';
import { sendSuccess } from '../utils/responseHandler.js';
import { config } from '../config/environment.js';
import { getRedisClient } from '../config/redis.js';

export async function getHealth(req, res) {
  const dbStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
  let redisStatus = 'UNKNOWN';

  try {
    const redis = getRedisClient();
    if (redis && redis.status === 'ready') {
      redisStatus = 'CONNECTED';
    } else if (config.nodeEnv === 'test') {
      redisStatus = 'MOCK_READY';
    }
  } catch {
    redisStatus = 'UNAVAILABLE';
  }

  sendSuccess(
    res,
    {
      status: 'HEALTHY',
      service: 'WrapAI API Gateway',
      version: '1.2.0',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      database: dbStatus,
      redis: redisStatus,
      uptimeSeconds: Math.floor(process.uptime())
    },
    'WrapAI API Gateway is fully operational'
  );
}

export async function getReadiness(req, res) {
  const isDbReady = mongoose.connection.readyState === 1;
  const status = isDbReady ? 'READY' : 'DEGRADED';
  const statusCode = isDbReady ? 200 : 503;

  return res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    checks: {
      database: isDbReady ? 'OK' : 'FAIL',
      uptime: Math.floor(process.uptime())
    }
  });
}
