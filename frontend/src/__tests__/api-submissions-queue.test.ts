import { describe, test, expect, mock } from 'bun:test';
import { POST, GET } from '../app/api/submissions/queue/route';
import { redis } from '../lib/redis';

type RedisMock = Record<string, unknown>;

describe('Submissions Queue API Route', () => {
    test('POST /api/submissions/queue enqueues job into Redis', async () => {
        const originalRpush = redis.rpush;
        const rpushSpy = mock((_queue: string, _item: string) => Promise.resolve(1));
        (redis as unknown as RedisMock).rpush = rpushSpy;

        try {
            const jobPayload = {
                problem_id: 'prob-1',
                problem_slug: 'two-sum',
                language: 'python',
                method_name: 'twoSum',
                code: 'def twoSum(nums, target): return [0, 1]',
                user: 'milan',
                user_id: 'u1',
                submission_id: 'sub-123',
            };

            const req = new Request('http://localhost:3000/api/submissions/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newSubmit: jobPayload }),
            });

            const res = await POST(req);
            expect(res.status).toBe(200);

            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.queue).toBe('jobs');
            expect(json.queueLength).toBe(1);
            expect(json.job.submission_id).toBe('sub-123');

            expect(rpushSpy).toHaveBeenCalled();
        } finally {
            (redis as unknown as RedisMock).rpush = originalRpush;
        }
    });

    test('POST /api/submissions/queue returns 400 when body is empty or invalid', async () => {
        const req = new Request('http://localhost:3000/api/submissions/queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(null),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.error).toBe('Missing newSubmit job data');
    });

    test('GET /api/submissions/queue returns queued items from Redis', async () => {
        const originalLlen = redis.llen;
        const originalLrange = redis.lrange;

        const sampleJob = JSON.stringify({
            problem_id: 'prob-1',
            user: 'milan',
        });

        (redis as unknown as RedisMock).llen = mock(() => Promise.resolve(1));
        (redis as unknown as RedisMock).lrange = mock(() => Promise.resolve([sampleJob]));

        try {
            const res = await GET();
            expect(res.status).toBe(200);

            const json = await res.json();
            expect(json.queue).toBe('jobs');
            expect(json.totalLength).toBe(1);
            expect(json.jobs.length).toBe(1);
            expect(json.jobs[0].problem_id).toBe('prob-1');
        } finally {
            (redis as unknown as RedisMock).llen = originalLlen;
            (redis as unknown as RedisMock).lrange = originalLrange;
        }
    });
});
