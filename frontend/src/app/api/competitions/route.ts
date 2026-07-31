import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCache, setCache, delCache } from '@/lib/redis';
import type { Announcement, Problem, SampleTestCase, TestCase } from '@/context/CompetitionContext';

const COMPETITIONS_CACHE_KEY = 'cache:competitions_data';
const CACHE_TTL_SECONDS = 15;

export async function GET() {
    try {
        // Try reading from Redis cache first
        const cachedData = await getCache<{
            competitions: unknown[];
            participants: unknown[];
            submissions: unknown[];
        }>(COMPETITIONS_CACHE_KEY);

        if (cachedData) {
            return NextResponse.json(cachedData, {
                headers: { 'X-Cache': 'HIT' },
            });
        }

        const competitions = await prisma.competition.findMany({
            include: {
                announcements: {
                    orderBy: { timestamp: 'desc' },
                },
                problems: {
                    include: {
                        sampleTestCases: true,
                        testCases: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const participants = await prisma.participant.findMany({
            orderBy: { totalScore: 'desc' },
        });

        const submissions = await prisma.submission.findMany({
            orderBy: { timestamp: 'desc' },
        });

        const responsePayload = { competitions, participants, submissions };

        // Save to Redis cache asynchronously
        await setCache(COMPETITIONS_CACHE_KEY, responsePayload, CACHE_TTL_SECONDS);

        return NextResponse.json(responsePayload, {
            headers: { 'X-Cache': 'MISS' },
        });
    } catch (error) {
        console.error('Failed to fetch data via Prisma:', error);
        return NextResponse.json(
            { error: 'Failed to fetch database records via Prisma' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { competition } = body;

        if (!competition || !competition.accessCode || !competition.title) {
            return NextResponse.json(
                { error: 'Missing required competition fields (accessCode, title)' },
                { status: 400 }
            );
        }

        const newComp = await prisma.competition.create({
            data: {
                id: competition.id || undefined,
                accessCode: competition.accessCode,
                title: competition.title,
                subtitle: competition.subtitle || '',
                description: competition.description || '',
                startTime: new Date(competition.startTime || Date.now()),
                durationMinutes: Number(competition.durationMinutes || 120),
                isLive: Boolean(competition.isLive),
                isLeaderboardFrozen: Boolean(competition.isLeaderboardFrozen),
                announcements: {
                    create: (competition.announcements || []).map((ann: Announcement) => ({
                        id: ann.id || undefined,
                        title: ann.title,
                        text: ann.text,
                        timestamp: new Date(ann.timestamp || Date.now()),
                        pinned: Boolean(ann.pinned),
                    })),
                },
                problems: {
                    create: (competition.problems || []).map((prob: Problem) => ({
                        id: prob.id || undefined,
                        title: prob.title,
                        slug: prob.slug,
                        methodName: prob.methodName || 'solve',
                        typeSchema: prob.typeSchema || null,
                        difficulty: prob.difficulty,
                        points: Number(prob.points || 100),
                        timeLimitMs: Number(prob.timeLimitMs || 1000),
                        memoryLimitMb: Number(prob.memoryLimitMb || 256),
                        acceptanceRate: prob.acceptanceRate ? Number(prob.acceptanceRate) : null,
                        tags: typeof prob.tags === 'string' ? prob.tags : JSON.stringify(prob.tags || []),
                        description: prob.description || '',
                        inputFormat: prob.inputFormat || '',
                        outputFormat: prob.outputFormat || '',
                        constraints: typeof prob.constraints === 'string' ? prob.constraints : JSON.stringify(prob.constraints || []),
                        starterTemplates: typeof prob.starterTemplates === 'string' ? prob.starterTemplates : JSON.stringify(prob.starterTemplates || {}),
                        sampleTestCases: {
                            create: (prob.sampleTestCases || []).map((stc: SampleTestCase) => ({
                                id: stc.id || undefined,
                                input: stc.input,
                                output: stc.output,
                                explanation: stc.explanation || null,
                            })),
                        },
                        testCases: {
                            create: (prob.testCases || []).map((tc: TestCase) => ({
                                id: tc.id || undefined,
                                input: tc.input,
                                output: tc.output,
                                hidden: Boolean(tc.hidden),
                            })),
                        },
                    })),
                },
            },
            include: {
                announcements: true,
                problems: {
                    include: {
                        sampleTestCases: true,
                        testCases: true,
                    },
                },
            },
        });

        await delCache(COMPETITIONS_CACHE_KEY);
        return NextResponse.json({ competition: newComp });
    } catch (error: any) {
        console.error('Failed to create competition via Prisma:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to create competition' },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { competition } = body;

        if (!competition || (!competition.accessCode && !competition.id)) {
            return NextResponse.json({ error: 'Missing competition identity' }, { status: 400 });
        }

        const targetWhere = competition.id ? { id: competition.id } : { accessCode: competition.accessCode };

        // 1. Update basic competition scalar fields
        const updatedComp = await prisma.competition.update({
            where: targetWhere,
            data: {
                title: competition.title,
                subtitle: competition.subtitle,
                description: competition.description,
                startTime: new Date(competition.startTime),
                durationMinutes: Number(competition.durationMinutes),
                isLive: Boolean(competition.isLive),
                isLeaderboardFrozen: Boolean(competition.isLeaderboardFrozen),
            },
            include: {
                announcements: true,
                problems: {
                    include: {
                        sampleTestCases: true,
                        testCases: true,
                    },
                },
            },
        });

        // 2. Handle problem creation/upsert if problems array is passed
        if (Array.isArray(competition.problems)) {
            for (const prob of competition.problems) {
                const existingProblem = await prisma.problem.findUnique({
                    where: { id: prob.id },
                });

                if (!existingProblem) {
                    await prisma.problem.create({
                        data: {
                            id: prob.id || undefined,
                            title: prob.title,
                            slug: prob.slug,
                            methodName: prob.methodName || 'solve',
                            typeSchema: prob.typeSchema || null,
                            difficulty: prob.difficulty,
                            points: Number(prob.points || 100),
                            timeLimitMs: Number(prob.timeLimitMs || 1000),
                            memoryLimitMb: Number(prob.memoryLimitMb || 256),
                            acceptanceRate: prob.acceptanceRate ? Number(prob.acceptanceRate) : null,
                            tags: typeof prob.tags === 'string' ? prob.tags : JSON.stringify(prob.tags || []),
                            description: prob.description || '',
                            inputFormat: prob.inputFormat || '',
                            outputFormat: prob.outputFormat || '',
                            constraints: typeof prob.constraints === 'string' ? prob.constraints : JSON.stringify(prob.constraints || []),
                            starterTemplates: typeof prob.starterTemplates === 'string' ? prob.starterTemplates : JSON.stringify(prob.starterTemplates || {}),
                            competitionId: updatedComp.id,
                            sampleTestCases: {
                                create: (prob.sampleTestCases || []).map((stc: SampleTestCase) => ({
                                    id: stc.id || undefined,
                                    input: stc.input,
                                    output: stc.output,
                                    explanation: stc.explanation || null,
                                })),
                            },
                            testCases: {
                                create: (prob.testCases || []).map((tc: TestCase) => ({
                                    id: tc.id || undefined,
                                    input: tc.input,
                                    output: tc.output,
                                    hidden: Boolean(tc.hidden),
                                })),
                            },
                        },
                    });
                }
            }
        }

        // Re-fetch updated competition with all problems
        const finalComp = await prisma.competition.findUnique({
            where: { id: updatedComp.id },
            include: {
                announcements: true,
                problems: {
                    include: {
                        sampleTestCases: true,
                        testCases: true,
                    },
                },
            },
        });

        await delCache(COMPETITIONS_CACHE_KEY);
        return NextResponse.json({ competition: finalComp });
    } catch (error: any) {
        console.error('Failed to update competition via Prisma:', error);
        return NextResponse.json({ error: error?.message || 'Failed to update competition' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const accessCode = searchParams.get('accessCode');

        if (!id && !accessCode) {
            return NextResponse.json({ error: 'Missing id or accessCode query parameter' }, { status: 400 });
        }

        const targetWhere = id ? { id } : { accessCode: accessCode! };

        await prisma.competition.delete({
            where: targetWhere,
        });

        await delCache(COMPETITIONS_CACHE_KEY);
        return NextResponse.json({ success: true, message: 'Competition deleted successfully' });
    } catch (error: any) {
        console.error('Failed to delete competition via Prisma:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to delete competition' },
            { status: 500 }
        );
    }
}
