import { describe, test, expect, mock } from 'bun:test';
import { POST } from '../app/api/submissions/route';
import prisma from '../lib/prisma';

describe('Submission API Route POST /api/submissions', () => {
    test('returns 400 when competition is not found', async () => {
        const origCompFindFirst = prisma.competition.findFirst;
        (prisma.competition as any).findFirst = mock(() => Promise.resolve(null));

        try {
            const req = new Request('http://localhost:3000/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submission: {
                        id: 'sub-1',
                        competitionId: 'invalid-comp',
                        problemId: 'prob-1',
                    },
                }),
            });

            const res = await POST(req);
            expect(res.status).toBe(400);

            const json = await res.json();
            expect(json.error).toBe('No competition found in database');
        } finally {
            (prisma.competition as any).findFirst = origCompFindFirst;
        }
    });

    test('returns 400 when problem is not found', async () => {
        const origCompFindFirst = prisma.competition.findFirst;
        const origProbFindFirst = prisma.problem.findFirst;

        (prisma.competition as any).findFirst = mock(() => Promise.resolve({ id: 'comp-1' }));
        (prisma.problem as any).findFirst = mock(() => Promise.resolve(null));

        try {
            const req = new Request('http://localhost:3000/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submission: {
                        id: 'sub-1',
                        competitionId: 'comp-1',
                        problemId: 'missing-prob',
                    },
                }),
            });

            const res = await POST(req);
            expect(res.status).toBe(400);

            const json = await res.json();
            expect(json.error).toBe("Problem 'missing-prob' not found in database");
        } finally {
            (prisma.competition as any).findFirst = origCompFindFirst;
            (prisma.problem as any).findFirst = origProbFindFirst;
        }
    });

    test('creates submission successfully when competition and problem exist', async () => {
        const origCompFindFirst = prisma.competition.findFirst;
        const origProbFindFirst = prisma.problem.findFirst;
        const origPartFindFirst = prisma.participant.findFirst;
        const origSubUpsert = prisma.submission.upsert;
        const origPartUpsert = prisma.participant.upsert;

        (prisma.competition as any).findFirst = mock(() => Promise.resolve({ id: 'comp-1' }));
        (prisma.problem as any).findFirst = mock(() => Promise.resolve({ id: 'prob-1', title: 'Two Sum' }));
        (prisma.participant as any).findFirst = mock(() => Promise.resolve({ id: 'part-1' }));

        const createdSub = {
            id: 'sub-999',
            competitionId: 'comp-1',
            problemId: 'prob-1',
            status: 'Evaluating',
            code: 'def solution(): pass',
        };
        (prisma.submission as any).upsert = mock(() => Promise.resolve(createdSub));
        (prisma.participant as any).upsert = mock(() => Promise.resolve({ id: 'part-1' }));

        try {
            const req = new Request('http://localhost:3000/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submission: {
                        id: 'sub-999',
                        competitionId: 'comp-1',
                        problemId: 'prob-1',
                        problemTitle: 'Two Sum',
                        participantName: 'Alice',
                        collegeId: 'C1',
                        language: 'python',
                        code: 'def solution(): pass',
                        status: 'Evaluating',
                    },
                    participant: {
                        id: 'part-1',
                        name: 'Alice',
                        collegeId: 'C1',
                        accessCode: 'ABC123',
                        totalScore: 100,
                    },
                }),
            });

            const res = await POST(req);
            expect(res.status).toBe(200);

            const json = await res.json();
            expect(json.submission).toEqual(createdSub);
        } finally {
            (prisma.competition as any).findFirst = origCompFindFirst;
            (prisma.problem as any).findFirst = origProbFindFirst;
            (prisma.participant as any).findFirst = origPartFindFirst;
            (prisma.submission as any).upsert = origSubUpsert;
            (prisma.participant as any).upsert = origPartUpsert;
        }
    });
});
