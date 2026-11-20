import { PrismaClient } from '@prisma/client';
import { config } from './env';
import { logger } from './logger';

const dbLogger = logger.child({ component: 'database' });

// Avoid multiple PrismaClient instances in development due to tsx/watch hot reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  });

if (config.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    dbLogger.info('Successfully connected to PostgreSQL via Prisma');
  } catch (error) {
    dbLogger.error({ error }, 'Failed to connect to PostgreSQL');
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    dbLogger.info('Disconnected cleanly from PostgreSQL');
  } catch (error) {
    dbLogger.error({ error }, 'Error disconnecting from PostgreSQL');
  }
}
