import { createApp } from './app';
import { config } from './config/env';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[API] Server listening on port ${config.port} in ${config.nodeEnv} mode`);
});

// Graceful shutdown handling
function handleShutdown(signal: string): void {
  console.log(`[API] Received ${signal}. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      console.error('[API] Error during server close:', err);
      process.exit(1);
    }
    console.log('[API] Server closed cleanly.');
    process.exit(0);
  });

  // Force shutdown after timeout if pending connections don't drain
  setTimeout(() => {
    console.error('[API] Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export { server };
