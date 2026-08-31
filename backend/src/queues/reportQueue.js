import { Queue } from 'bullmq';
import { config } from '../config/environment.js';
import { getRedisConnectionOptions } from '../config/redis.js';
import { logger } from '../utils/logger.js';

let reportQueue = null;

class TestMockQueue {
  constructor(name) {
    this.name = name;
    this.jobs = new Map();
  }

  async add(name, data, opts = {}) {
    const id = opts.jobId || `mock_report_job_${Date.now()}_${Math.random()}`;
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

export function getReportQueue() {
  if (config.nodeEnv === 'test') {
    if (!reportQueue) {
      reportQueue = new TestMockQueue(config.reports.queueName);
    }
    return reportQueue;
  }

  if (!reportQueue) {
    const connection = getRedisConnectionOptions();
    reportQueue = new Queue(config.reports.queueName, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 }
      }
    });

    reportQueue.on('error', (err) => {
      logger.warn('BullMQ Report Queue error:', { error: err.message });
    });

    logger.info('BullMQ Report Generation Queue initialized', { queueName: config.reports.queueName });
  }
  return reportQueue;
}

export async function closeReportQueue() {
  if (reportQueue) {
    await reportQueue.close();
    reportQueue = null;
  }
}
