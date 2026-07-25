import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
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

        return NextResponse.json({ competitions, participants, submissions });
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

        const newComp = await prisma.competition.create({
            data: {
                id: competition.id,
                accessCode: competition.accessCode,
                title: competition.title,
                subtitle: competition.subtitle || '',
                description: competition.description || '',
                startTime: new Date(competition.startTime || Date.now()),
                durationMinutes: Number(competition.durationMinutes || 120),
                isLive: Boolean(competition.isLive),
                isLeaderboardFrozen: Boolean(competition.isLeaderboardFrozen),
                announcements: {
                    create: (competition.announcements || []).map((ann: any) => ({
                        id: ann.id,
                        title: ann.title,
                        text: ann.text,
                        timestamp: new Date(ann.timestamp || Date.now()),
                        pinned: Boolean(ann.pinned),
                    })),
                },
                problems: {
                    create: (competition.problems || []).map((prob: any) => ({
                        id: prob.id,
                        title: prob.title,
                        slug: prob.slug,
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
                            create: (prob.sampleTestCases || []).map((stc: any) => ({
                                id: stc.id,
                                input: stc.input,
                                output: stc.output,
                                explanation: stc.explanation || null,
                            })),
                        },
                        testCases: {
                            create: (prob.testCases || []).map((tc: any) => ({
                                id: tc.id,
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

        return NextResponse.json({ competition: newComp });
    } catch (error) {
        console.error('Failed to create competition via Prisma:', error);
        return NextResponse.json({ error: 'Failed to create competition' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { competition } = body;

        const updatedComp = await prisma.competition.update({
            where: { accessCode: competition.accessCode },
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

        return NextResponse.json({ competition: updatedComp });
    } catch (error) {
        console.error('Failed to update competition via Prisma:', error);
        return NextResponse.json({ error: 'Failed to update competition' }, { status: 500 });
    }
}
