import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { submission, participant } = body;

        // 1. Resolve Competition ID (by ID or Access Code)
        let comp = await prisma.competition.findFirst({
            where: {
                OR: [
                    { id: submission.competitionId },
                    { accessCode: submission.competitionId },
                ],
            },
        });
        if (!comp) {
            comp = await prisma.competition.findFirst();
        }

        if (!comp) {
            return NextResponse.json(
                { error: 'No competition found in database' },
                { status: 400 }
            );
        }

        // 2. Resolve Problem ID (by ID or Slug)
        const problem = await prisma.problem.findFirst({
            where: {
                OR: [
                    { id: submission.problemId },
                    { slug: submission.problemId },
                ],
            },
        });

        if (!problem) {
            return NextResponse.json(
                { error: `Problem '${submission.problemId}' not found in database` },
                { status: 400 }
            );
        }

        const existingPart = await prisma.participant.findFirst({
            where: {
                OR: [
                    { id: submission.participantId },
                    { collegeId: submission.collegeId },
                ],
            },
        });

        const newSub = await prisma.submission.upsert({
            where: { id: submission.id },
            update: {
                status: submission.status,
                code: submission.code,
                testCasesPassed: Number(submission.testCasesPassed || 0),
                totalTestCases: Number(submission.totalTestCases || 0),
                runtimeMs: Number(submission.runtimeMs || 0),
                memoryMb: Number(submission.memoryMb || 0),
            },
            create: {
                id: submission.id,
                competitionId: comp.id,
                problemId: problem.id,
                problemTitle: submission.problemTitle || problem.title,
                participantId: existingPart?.id || null,
                participantName: submission.participantName,
                collegeId: submission.collegeId,
                language: submission.language,
                code: submission.code,
                status: submission.status,
                testCasesPassed: Number(submission.testCasesPassed || 0),
                totalTestCases: Number(submission.totalTestCases || 0),
                runtimeMs: Number(submission.runtimeMs || 0),
                runtimePercentile: Number(submission.runtimePercentile || 0),
                memoryMb: Number(submission.memoryMb || 0),
                memoryPercentile: Number(submission.memoryPercentile || 0),
                errorLog: submission.errorLog || null,
                timestamp: new Date(submission.timestamp || Date.now()),
            },
        });

        if (participant) {
            const solvedStr = typeof participant.solvedProblems === 'string'
                ? participant.solvedProblems
                : JSON.stringify(participant.solvedProblems || {});

            await prisma.participant.upsert({
                where: { id: participant.id },
                update: {
                    totalScore: Number(participant.totalScore || 0),
                    totalPenaltyTimeMinutes: Number(participant.totalPenaltyTimeMinutes || 0),
                    solvedProblems: solvedStr,
                    lastActive: new Date(participant.lastActive || Date.now()),
                },
                create: {
                    id: participant.id,
                    name: participant.name,
                    collegeId: participant.collegeId,
                    accessCode: participant.accessCode,
                    totalScore: Number(participant.totalScore || 0),
                    totalPenaltyTimeMinutes: Number(participant.totalPenaltyTimeMinutes || 0),
                    solvedProblems: solvedStr,
                    lastActive: new Date(participant.lastActive || Date.now()),
                    competitionId: comp.id,
                },
            });
        }

        return NextResponse.json({ submission: newSub });
    } catch (error) {
        console.error('Failed to create submission via Prisma:', error);
        return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
    }
}
