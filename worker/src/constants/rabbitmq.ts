export const RABBITMQ_TOPOLOGY = {
  EXCHANGES: {
    JOBS: 'jobs.exchange',
    RETRY: 'jobs.retry.exchange',
    DLX: 'jobs.dlx'
  },
  QUEUES: {
    MAIN: 'jobs.main',
    RETRY: 'jobs.retry',
    DLQ: 'jobs.dlq'
  },
  ROUTING_KEYS: {
    DISPATCH: 'jobs.dispatch',
    RETRY: 'jobs.retry',
    DEAD: 'jobs.dead'
  }
} as const;
