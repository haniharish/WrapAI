import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { createProcessingWorker } from './processingWorker.js';
import { createReportWorker } from './reportWorker.js';
import { closeRedisConnections } from '../config/redis.js';
import { logger } from '../utils/logger.js';

logger.info('Starting WrapAI Background Processing Worker Process...');

async function start() {
  await connectDatabase();
  const processingWorker = createProcessingWorker();
  const reportWorker = createReportWorker();

  const handleShutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down worker process gracefully...`);
    await processingWorker.close();
    await reportWorker.close();
    await closeRedisConnections();
    await disconnectDatabase();
    logger.info('Worker process exited cleanly.');
    process.exit(0);
  };


  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

start().catch((err) => {
  logger.error('Fatal error starting worker process:', { error: err.message });
  process.exit(1);
});
