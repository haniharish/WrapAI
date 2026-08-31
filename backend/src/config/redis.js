import { Redis } from 'ioredis';
import { config } from './environment.js';
import { logger } from '../utils/logger.js';

let sharedRedisConnection = null;

export function getRedisConnectionOptions() {
  if (config.redis.url) {
    return config.redis.url;
  }
  return {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    username: config.redis.username,
    tls: config.redis.tls,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy(times) {
      // Exponential backoff retry for Redis connection
      const delay = Math.min(times * 100, 3000);
      return delay;
    }
  };
}

export function createRedisClient() {
  const options = getRedisConnectionOptions();
  const client = typeof options === 'string'
    ? new Redis(options, { maxRetriesPerRequest: null, enableReadyCheck: false, lazyConnect: true })
    : new Redis(options);

  client.on('connect', () => {
    logger.info('Connected to Redis server');
  });

  client.on('error', (err) => {
    logger.warn('Redis connection issue:', { error: err.message });
  });

  client.on('close', () => {
    logger.info('Redis connection closed');
  });

  return client;
}

export function getSharedRedisClient() {
  if (!sharedRedisConnection) {
    sharedRedisConnection = createRedisClient();
  }
  return sharedRedisConnection;
}

export function getRedisClient() {
  return getSharedRedisClient();
}


export async function closeRedisConnections() {
  if (sharedRedisConnection) {
    await sharedRedisConnection.quit().catch(() => {});
    sharedRedisConnection = null;
  }
}
