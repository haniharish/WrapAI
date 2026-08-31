import mongoose from 'mongoose';
import { sendSuccess } from '../utils/responseHandler.js';
import { config } from '../config/environment.js';

export function getHealth(req, res) {
  const dbStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
  sendSuccess(
    res,
    {
      status: 'HEALTHY',
      service: 'WrapAI API Gateway',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptimeSeconds: Math.floor(process.uptime())
    },
    'WrapAI API Gateway is fully operational'
  );
}
