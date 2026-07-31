import { describe, test, expect, mock } from 'bun:test';
import { GET } from '../app/api/submissions/[id]/route';
import prisma from '../lib/prisma';

describe('Submission Status Poll API Route GET /api/submissions/[id]', () => {
    test('returns 404 when submission is not found', async () => {
        const originalFindUnique = prisma.submission.findUnique;
        (prisma.submission as any).findUnique = mock(() => Promise.resolve(null));

        try {
            const req = new Request('http://localhost:3000/api/submissions/non-existent');
            const params = Promise.resolve({ id: 'non-existent' });

            const res = await GET(req, { params });
            expect(res.status).toBe(404);

            const json = await res.json();
            expect(json.error).toBe('Submission not found');
            expect(json.completed).toBe(false);
        } finally {
            (prisma.submission as any).findUnique = originalFindUnique;
        }
    });

    test('returns completed = false when submission status is Evaluating', async () => {
        const originalFindUnique = prisma.submission.findUnique;
        const mockSub = {
            id: 'sub-eval',
            status: 'Evaluating',
            problemId: 'prob-1',
            testCasesPassed: 0,
            totalTestCases: 5,
            results: [],
        };
        (prisma.submission as any).findUnique = mock(() => Promise.resolve(mockSub));

        try {
            const req = new Request('http://localhost:3000/api/submissions/sub-eval');
            const params = Promise.resolve({ id: 'sub-eval' });

            const res = await GET(req, { params });
            expect(res.status).toBe(200);

            const json = await res.json();
            expect(json.id).toBe('sub-eval');
            expect(json.status).toBe('Evaluating');
            expect(json.completed).toBe(false);
            expect(json.submission).toEqual(mockSub);
        } finally {
            (prisma.submission as any).findUnique = originalFindUnique;
        }
    });

    test('returns completed = true when submission status is Accepted', async () => {
        const originalFindUnique = prisma.submission.findUnique;
        const mockSub = {
            id: 'sub-ac',
            status: 'Accepted',
            problemId: 'prob-1',
            testCasesPassed: 5,
            totalTestCases: 5,
            results: [
                { id: 'res-1', passed: true, expectedOutput: '1', actualOutput: '1' }
            ],
        };
        (prisma.submission as any).findUnique = mock(() => Promise.resolve(mockSub));

        try {
            const req = new Request('http://localhost:3000/api/submissions/sub-ac');
            const params = Promise.resolve({ id: 'sub-ac' });

            const res = await GET(req, { params });
            expect(res.status).toBe(200);

            const json = await res.json();
            expect(json.id).toBe('sub-ac');
            expect(json.status).toBe('Accepted');
            expect(json.completed).toBe(true);
        } finally {
            (prisma.submission as any).findUnique = originalFindUnique;
        }
    });
});
