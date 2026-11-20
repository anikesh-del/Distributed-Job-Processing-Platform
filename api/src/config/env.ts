import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 65535, {
      message: 'PORT must be a valid port number between 1 and 65535',
    }),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z
    .string()
    .url({ message: 'DATABASE_URL must be a valid PostgreSQL connection URL' })
    .default('postgresql://postgres:postgres@localhost:5432/job_platform?schema=public'),
  REDIS_URL: z
    .string()
    .url({ message: 'REDIS_URL must be a valid Redis connection URL' })
    .default('redis://localhost:6379'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[Config] Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const config = {
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  databaseUrl: parsed.data.DATABASE_URL,
  redisUrl: parsed.data.REDIS_URL,
  logLevel: parsed.data.LOG_LEVEL,
} as const;

export type AppConfig = typeof config;
