import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 });
        }

        const submission = await prisma.submission.findUnique({
            where: { id },
            include: {
                results: true,
            },
        });

        if (!submission) {
            return NextResponse.json(
                { error: 'Submission not found', completed: false },
                { status: 404 }
            );
        }

        const isEvaluating = submission.status.toLowerCase() === 'evaluating';

        return NextResponse.json({
            id: submission.id,
            status: submission.status,
            completed: !isEvaluating,
            submission,
        });
    } catch (error: any) {
        console.error('[Submission Poll Error]:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to poll submission status' },
            { status: 500 }
        );
    }
}
