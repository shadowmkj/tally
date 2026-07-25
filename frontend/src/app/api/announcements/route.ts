import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { compAccessCode, title, text } = body;

        const comp = await prisma.competition.findUnique({
            where: { accessCode: compAccessCode },
        });

        if (!comp) {
            return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
        }

        const announcement = await prisma.announcement.create({
            data: {
                id: `ann-${Date.now()}`,
                title,
                text,
                timestamp: new Date(),
                pinned: true,
                competitionId: comp.id,
            },
        });

        return NextResponse.json({ announcement });
    } catch (error) {
        console.error('Failed to create announcement via Prisma:', error);
        return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }
}
