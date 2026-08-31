import { Queue } from 'bullmq';
import { config } from '../config/environment.js';
import { getRedisConnectionOptions } from '../config/redis.js';
import { logger } from '../utils/logger.js';

let processingQueue = null;

class TestMockQueue {
  constructor(name) {
    this.name = name;
    this.jobs = new Map();
  }

  async add(name, data, opts = {}) {
    const id = opts.jobId || `mock_job_${Date.now()}_${Math.random()}`;
    const job = {
      id,
      name,
      data,
      opts,
      progress: 0,
      attemptsMade: 0,
      updateProgress: async (p) => { job.progress = p; },
      remove: async () => { this.jobs.delete(id); }
    };
    this.jobs.set(id, job);
    return job;
  }

  async getJob(id) {
    return this.jobs.get(id) || null;
  }

  async getJobCounts() {
    return {
      waiting: this.jobs.size,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0
    };
  }

  async close() {
    this.jobs.clear();
  }
}

export function getProcessingQueue() {
  if (config.nodeEnv === 'test') {
    if (!processingQueue) {
      processingQueue = new TestMockQueue(config.queue.name);
    }
    return processingQueue;
  }

  if (!processingQueue) {
    const connection = getRedisConnectionOptions();
    processingQueue = new Queue(config.queue.name, {
      connection,
      defaultJobOptions: {
        attempts: config.queue.jobAttempts,
        backoff: {
          type: 'exponential',
          delay: config.queue.backoffDelay
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 }
      }
    });

    processingQueue.on('error', (err) => {
      logger.warn('BullMQ Processing Queue error:', { error: err.message });
    });

    logger.info('BullMQ Content Processing Queue initialized', { queueName: config.queue.name });
  }
  return processingQueue;
}

export async function closeProcessingQueue() {
  if (processingQueue) {
    await processingQueue.close();
    processingQueue = null;
  }
}
