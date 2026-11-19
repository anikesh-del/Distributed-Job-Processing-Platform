import amqp, { Channel, ChannelModel } from 'amqplib';
import { RABBITMQ_TOPOLOGY } from '../constants/rabbitmq';
import { createComponentLogger } from '../logger/logger';

const log = createComponentLogger('RabbitMQ');

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export interface RabbitMQClient {
  connection: ChannelModel;
  channel: Channel;
}

/**
 * Declares all required RabbitMQ exchanges, durable queues, and bindings.
 */
export async function setupTopology(ch: Channel): Promise<void> {
  log.info('Declaring exchanges and queues topology...');

  // 1. Dead Letter Exchange (DLX) & Queue (DLQ)
  await ch.assertExchange(RABBITMQ_TOPOLOGY.EXCHANGES.DLX, 'direct', { durable: true });
  await ch.assertQueue(RABBITMQ_TOPOLOGY.QUEUES.DLQ, { durable: true });
  await ch.bindQueue(
    RABBITMQ_TOPOLOGY.QUEUES.DLQ,
    RABBITMQ_TOPOLOGY.EXCHANGES.DLX,
    RABBITMQ_TOPOLOGY.ROUTING_KEYS.DEAD
  );

  // 2. Main Exchange & Durable Main Job Queue
  // Unrecoverable failures or rejected messages are sent to DLX
  await ch.assertExchange(RABBITMQ_TOPOLOGY.EXCHANGES.JOBS, 'direct', { durable: true });
  await ch.assertQueue(RABBITMQ_TOPOLOGY.QUEUES.MAIN, {
    durable: true,
    deadLetterExchange: RABBITMQ_TOPOLOGY.EXCHANGES.DLX,
    deadLetterRoutingKey: RABBITMQ_TOPOLOGY.ROUTING_KEYS.DEAD
  });
  await ch.bindQueue(
    RABBITMQ_TOPOLOGY.QUEUES.MAIN,
    RABBITMQ_TOPOLOGY.EXCHANGES.JOBS,
    RABBITMQ_TOPOLOGY.ROUTING_KEYS.DISPATCH
  );

  // 3. Retry Exchange & Retry Queue (Delayed Queue with TTL backoff)
  // When messages expire in the retry queue, RabbitMQ automatically re-routes them to the Main Exchange
  await ch.assertExchange(RABBITMQ_TOPOLOGY.EXCHANGES.RETRY, 'direct', { durable: true });
  await ch.assertQueue(RABBITMQ_TOPOLOGY.QUEUES.RETRY, {
    durable: true,
    deadLetterExchange: RABBITMQ_TOPOLOGY.EXCHANGES.JOBS,
    deadLetterRoutingKey: RABBITMQ_TOPOLOGY.ROUTING_KEYS.DISPATCH
  });
  await ch.bindQueue(
    RABBITMQ_TOPOLOGY.QUEUES.RETRY,
    RABBITMQ_TOPOLOGY.EXCHANGES.RETRY,
    RABBITMQ_TOPOLOGY.ROUTING_KEYS.RETRY
  );

  log.info('Topology successfully initialized.');
}

/**
 * Connects to RabbitMQ, sets prefetch, and verifies topology.
 */
export async function connectRabbitMQ(url: string, prefetchCount: number): Promise<RabbitMQClient> {
  log.info({ url }, 'Connecting to RabbitMQ broker...');
  connection = await amqp.connect(url);

  connection.on('error', (err) => {
    log.error({ err }, 'RabbitMQ broker connection error');
  });

  connection.on('close', () => {
    log.warn('RabbitMQ broker connection closed');
  });

  channel = await connection.createChannel();
  await channel.prefetch(prefetchCount);
  log.info({ prefetchCount }, 'Channel created with prefetch count');

  await setupTopology(channel);

  return { connection, channel };
}

/**
 * Gracefully closes the channel and connection to RabbitMQ.
 */
export async function closeRabbitMQ(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
      channel = null;
      log.info('Channel closed cleanly');
    }
    if (connection) {
      await connection.close();
      connection = null;
      log.info('Connection closed cleanly');
    }
  } catch (err) {
    log.error({ err }, 'Error while closing RabbitMQ connection');
  }
}
