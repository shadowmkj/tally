import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const newSubmit = body?.newSubmit || body;

    if (!newSubmit || (typeof newSubmit === 'object' && Object.keys(newSubmit).length === 0)) {
      return NextResponse.json(
        { error: 'Missing newSubmit job data' },
        { status: 400 }
      );
    }

    const serializedJob = JSON.stringify(newSubmit);

    // Push the job onto the Redis list/queue named "jobs"
    const queueLength = await redis.rpush('jobs', serializedJob);

    return NextResponse.json({
      success: true,
      queue: 'jobs',
      queueLength,
      job: newSubmit,
      submittedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[Redis Queue] Failed to push to "jobs":', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to push job to Redis queue' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Inspect current items in the Redis "jobs" queue
    const length = await redis.llen('jobs');
    const jobs = await redis.lrange('jobs', 0, 49);

    const parsedJobs = jobs.map((item) => {
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    });

    return NextResponse.json({
      queue: 'jobs',
      totalLength: length,
      jobs: parsedJobs,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch Redis queue' },
      { status: 500 }
    );
  }
}
