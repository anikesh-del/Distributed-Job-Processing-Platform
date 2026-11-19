import { Channel } from 'amqplib';
import Redis from 'ioredis';
import { config } from './config/env';
import { connectRabbitMQ, closeRabbitMQ } from './queue/rabbitmq';
import { startJobConsumer, stopJobConsumer } from './consumer/job.consumer';
import { connectRedis, closeRedis } from './redis/redis.client';
import { startHeartbeat, stopHeartbeat } from './heartbeat/heartbeat.service';
import { createComponentLogger, workerId } from './logger/logger';

const log = createComponentLogger('Lifecycle');

log.info({ workerId, nodeEnv: config.nodeEnv, concurrency: config.concurrency }, 'Starting background worker...');

let isShuttingDown = false;
let activeChannel: Channel | null = null;
let activeRedis: Redis | null = null;

async function bootstrap(): Promise<void> {
  try {
    // 1. Connect to Redis and start worker heartbeat pulse
    log.info('Connecting to Redis for worker heartbeat...');
    activeRedis = await connectRedis();
    await startHeartbeat(activeRedis);

    // 2. Connect to RabbitMQ and start job consumer
    log.info('Connecting to RabbitMQ broker and declaring topology...');
    const { channel } = await connectRabbitMQ(config.rabbitmqUrl, config.concurrency);
    activeChannel = channel;

    // 3. Start consuming messages from the main job queue
    await startJobConsumer(activeChannel);

    log.info('Worker initialization complete. Heartbeat active and listening for jobs.');
  } catch (error) {
    log.fatal({ err: error }, 'Fatal error during worker bootstrap');
    process.exit(1);
  }
}

// Graceful shutdown handling
async function handleShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  log.info({ signal }, 'Received termination signal. Starting graceful shutdown...');

  // 1. Stop consuming new messages first
  await stopJobConsumer(activeChannel);

  // 2. Stop heartbeat and deregister worker key from Redis
  await stopHeartbeat(activeRedis);

  // 3. Close RabbitMQ channels and connections cleanly
  await closeRabbitMQ();

  // 4. Close Redis connection
  await closeRedis();

  log.info('Worker graceful shutdown completed cleanly.');
  process.exit(0);
}

process.on('SIGTERM', () => {
  void handleShutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void handleShutdown('SIGINT');
});

void bootstrap();
