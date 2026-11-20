import { createApp } from './app';
import { config } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/prisma';

const app = createApp();

const server = app.listen(config.port, async () => {
  logger.info(
    { port: config.port, nodeEnv: config.nodeEnv },
    `Server listening on port ${config.port} in ${config.nodeEnv} mode`
  );
  await connectDatabase();
});

// Graceful shutdown handling
async function handleShutdown(signal: string): Promise<void> {
  logger.info({ signal }, `Received ${signal}. Starting graceful shutdown...`);

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error during server close');
    } else {
      logger.info('HTTP server closed cleanly');
    }

    await disconnectDatabase();
    process.exit(err ? 1 : 0);
  });

  // Force shutdown after timeout if pending connections don't drain
  setTimeout(() => {
    logger.fatal('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export { server };
