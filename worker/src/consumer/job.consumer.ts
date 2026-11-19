import { Channel, ConsumeMessage } from 'amqplib';
import { RABBITMQ_TOPOLOGY } from '../constants/rabbitmq';
import { createComponentLogger } from '../logger/logger';

const log = createComponentLogger('Consumer');

let activeConsumerTag: string | null = null;

/**
 * Message handler for messages received from the main jobs queue.
 */
export async function handleMessage(channel: Channel, msg: ConsumeMessage | null): Promise<void> {
  // If RabbitMQ cancels the consumer, it sends a null message
  if (!msg) {
    log.warn('Received null message (consumer cancelled by broker)');
    return;
  }

  const rawContent = msg.content.toString();
  log.info({ queue: RABBITMQ_TOPOLOGY.QUEUES.MAIN, size: msg.content.length }, 'Received message from queue');

  try {
    // Parse message payload (supports JSON or raw string)
    let payload: Record<string, unknown> | string;
    try {
      payload = JSON.parse(rawContent) as Record<string, unknown>;
    } catch {
      payload = rawContent;
    }

    const jobId = typeof payload === 'object' && payload !== null ? (payload.jobId as string) : undefined;
    const attempt = typeof payload === 'object' && payload !== null ? (payload.attempt as number) : undefined;

    log.info({ jobId, attempt, payload }, 'Processing job payload');

    // CRITICAL: Manual acknowledgement.
    // Tells RabbitMQ the message has been processed and can safely be deleted from the queue.
    channel.ack(msg);
    log.info({ jobId, attempt }, 'Successfully processed and manually ACKed message');
  } catch (error) {
    log.error({ err: error }, 'Error processing message, rejecting');
    // Reject message without requeue (RabbitMQ automatically forwards to DLQ via deadLetterExchange)
    channel.nack(msg, false, false);
    log.warn('Message NACKed without requeue (routed to DLQ)');
  }
}

/**
 * Starts consuming messages from the main job queue with manual acknowledgement.
 */
export async function startJobConsumer(channel: Channel): Promise<string> {
  log.info({ queue: RABBITMQ_TOPOLOGY.QUEUES.MAIN }, 'Starting job consumer...');

  const { consumerTag } = await channel.consume(
    RABBITMQ_TOPOLOGY.QUEUES.MAIN,
    (msg) => {
      void handleMessage(channel, msg);
    },
    {
      // noAck: false ensures RabbitMQ will NOT delete messages automatically.
      // RabbitMQ will wait until channel.ack(msg) is explicitly called.
      noAck: false
    }
  );

  activeConsumerTag = consumerTag;
  log.info({ consumerTag }, 'Job consumer active and listening');
  return consumerTag;
}

/**
 * Stops consuming new messages during graceful shutdown.
 */
export async function stopJobConsumer(channel: Channel | null): Promise<void> {
  if (channel && activeConsumerTag) {
    log.info({ consumerTag: activeConsumerTag }, 'Cancelling job consumer...');
    try {
      await channel.cancel(activeConsumerTag);
      log.info('Job consumer cancelled successfully');
    } catch (err) {
      log.warn({ err }, 'Error while cancelling consumer');
    } finally {
      activeConsumerTag = null;
    }
  }
}
