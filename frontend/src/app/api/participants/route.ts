import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { participant } = body;

        const comp = await prisma.competition.findFirst({
            where: { accessCode: participant.accessCode },
        });

        const solvedStr = typeof participant.solvedProblems === 'string'
            ? participant.solvedProblems
            : JSON.stringify(participant.solvedProblems || {});

        const updated = await prisma.participant.upsert({
            where: { id: participant.id },
            update: {
                name: participant.name,
                collegeId: participant.collegeId,
                accessCode: participant.accessCode,
                totalScore: Number(participant.totalScore || 0),
                totalPenaltyTimeMinutes: Number(participant.totalPenaltyTimeMinutes || 0),
                solvedProblems: solvedStr,
                lastActive: new Date(participant.lastActive || Date.now()),
                competitionId: comp?.id || null,
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
                competitionId: comp?.id || null,
            },
        });

        return NextResponse.json({ participant: updated });
    } catch (error) {
        console.error('Failed to upsert participant via Prisma:', error);
        return NextResponse.json({ error: 'Failed to upsert participant' }, { status: 500 });
    }
}
