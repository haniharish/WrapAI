import app from './app.js';
import { config } from './config/environment.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

let server;

async function startServer() {
  logger.info('Starting WrapAI Backend Gateway...');
  
  // Connect to Database
  await connectDatabase();

  server = app.listen(config.port, () => {
    logger.info(`WrapAI API listening on port ${config.port} in [${config.nodeEnv}] mode`);
    logger.info(`API Base URL: http://localhost:${config.port}/api/v1`);
    logger.info(`Swagger Documentation: http://localhost:${config.port}/api/v1/docs`);
  });
}

// Graceful Shutdown
async function handleShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer };
