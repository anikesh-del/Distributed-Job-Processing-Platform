import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { getRedisClient } from '../config/redis';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'unreachable';
  }

  let redisStatus = 'disconnected';
  try {
    const redis = getRedisClient();
    const pong = await redis.ping();
    redisStatus = pong === 'PONG' ? 'connected' : 'unreachable';
  } catch {
    redisStatus = 'unreachable';
  }

  const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
