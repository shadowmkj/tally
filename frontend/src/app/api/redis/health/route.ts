import { NextResponse } from 'next/server';
import { isRedisHealthy, redis } from '@/lib/redis';

export async function GET() {
  try {
    const healthy = await isRedisHealthy();
    let redisInfo = null;

    if (healthy) {
      try {
        redisInfo = await redis.info('server');
      } catch {
        redisInfo = 'connected';
      }
    }

    return NextResponse.json({
      status: healthy ? 'ok' : 'degraded',
      redis: {
        connected: healthy,
        info: redisInfo,
        url: process.env.REDIS_URL ? '[CONFIGURED]' : 'redis://localhost:6379 (default)',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Redis error';
    return NextResponse.json(
      {
        status: 'error',
        message,
        connected: false,
      },
      { status: 500 }
    );
  }
}
