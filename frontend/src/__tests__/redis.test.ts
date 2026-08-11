import { describe, test, expect, mock } from 'bun:test';
import { getCache, setCache, delCache, invalidatePattern, isRedisHealthy, redis } from '../lib/redis';

// The redis object is a class instance whose methods we need to patch for testing.
// We cast through `unknown` to avoid `any`, using a typed intermediate so we can
// assign mock functions to specific string-keyed properties.
type RedisMock = Record<string, unknown>;

describe('Redis cache helpers', () => {
    test('setCache and getCache with mock redis store', async () => {
        const store = new Map<string, string>();

        const getSpy = mock((key: string) => Promise.resolve(store.get(key) || null));
        const setSpy = mock((key: string, val: string, _mode?: string, _ttl?: number) => {
            store.set(key, val);
            return Promise.resolve('OK');
        });

        // Temporarily patch redis methods
        const originalGet = redis.get;
        const originalSet = redis.set;
        (redis as unknown as RedisMock).get = getSpy;
        (redis as unknown as RedisMock).set = setSpy;

        try {
            await setCache('test-key', { id: 1, name: 'Tally' });
            expect(setSpy).toHaveBeenCalled();

            const cached = await getCache<{ id: number; name: string }>('test-key');
            expect(cached).toEqual({ id: 1, name: 'Tally' });
        } finally {
            (redis as unknown as RedisMock).get = originalGet;
            (redis as unknown as RedisMock).set = originalSet;
        }
    });

    test('getCache returns null on missing key or JSON parse error', async () => {
        const originalGet = redis.get;
        (redis as unknown as RedisMock).get = mock(() => Promise.resolve('invalid-json{{{'));

        try {
            const res = await getCache('bad-json-key');
            expect(res).toBeNull();
        } finally {
            (redis as unknown as RedisMock).get = originalGet;
        }
    });

    test('delCache deletes keys', async () => {
        const originalDel = redis.del;
        const delSpy = mock((...keys: string[]) => Promise.resolve(keys.length));
        (redis as unknown as RedisMock).del = delSpy;

        try {
            await delCache('key1', 'key2');
            expect(delSpy).toHaveBeenCalledWith('key1', 'key2');
        } finally {
            (redis as unknown as RedisMock).del = originalDel;
        }
    });

    test('invalidatePattern calls keys and deletes matched keys', async () => {
        const originalKeys = redis.keys;
        const originalDel = redis.del;

        (redis as unknown as RedisMock).keys = mock(() => Promise.resolve(['comp:1', 'comp:2']));
        const delSpy = mock(() => Promise.resolve(2));
        (redis as unknown as RedisMock).del = delSpy;

        try {
            await invalidatePattern('comp:*');
            expect(delSpy).toHaveBeenCalledWith('comp:1', 'comp:2');
        } finally {
            (redis as unknown as RedisMock).keys = originalKeys;
            (redis as unknown as RedisMock).del = originalDel;
        }
    });

    test('isRedisHealthy checks ping response', async () => {
        const originalPing = redis.ping;
        (redis as unknown as RedisMock).ping = mock(() => Promise.resolve('PONG'));

        try {
            const healthy = await isRedisHealthy();
            expect(healthy).toBe(true);
        } finally {
            (redis as unknown as RedisMock).ping = originalPing;
        }
    });
});
