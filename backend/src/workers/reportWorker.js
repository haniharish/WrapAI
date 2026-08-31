import { Worker } from 'bullmq';
import { config } from '../config/environment.js';
import { getRedisConnectionOptions } from '../config/redis.js';
import { reportService } from '../services/reportService.js';
import { logger } from '../utils/logger.js';

export function createReportWorker() {
  if (config.nodeEnv === 'test') {
    logger.info('Report Worker running in test mock mode (sync execution)');
    return {
      close: async () => {}
    };
  }

  const connection = getRedisConnectionOptions();
  const worker = new Worker(
    config.reports.queueName,
    async (job) => {
      const { reportId, contentId, userId, format } = job.data;
      logger.info(`[Report Worker] Processing report job ${job.id}`, { reportId, contentId, format });

      await job.updateProgress(10);
      const report = await reportService.executeReportGeneration(reportId);
      await job.updateProgress(100);

      return { reportId, status: report?.status };
    },
    {
      connection,
      concurrency: config.reports.concurrency
    }
  );

  worker.on('completed', (job) => {
    logger.info(`[Report Worker] Job ${job.id} completed successfully`, { returnvalue: job.returnvalue });
  });

  worker.on('failed', (job, err) => {
    logger.error(`[Report Worker] Job ${job?.id} failed`, { error: err.message });
  });

  return worker;
}
