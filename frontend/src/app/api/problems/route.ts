import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { problemSchema } from '@/lib/validations';
import type { SampleTestCase, TestCase } from '@/context/CompetitionContext';

async function checkAdminAuth() {
    try {
        const reqHeaders = await headers();
        const session = await auth.api.getSession({ headers: reqHeaders });
        if (!session || !session.user) {
            return false;
        }
        return true;
    } catch (err) {
        console.error('Error verifying admin session:', err);
        return false;
    }
}

export async function POST(req: Request) {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { competitionId, problem } = body;

        if (!competitionId || !problem || !problem.title) {
            return NextResponse.json({ error: 'Missing competitionId or problem data' }, { status: 400 });
        }

        const methodNameResult = problemSchema.shape.methodName.safeParse(problem?.methodName);
        if (!methodNameResult.success) {
            return NextResponse.json({ error: methodNameResult.error.issues[0]?.message || 'Method name is required' }, { status: 400 });
        }

        const createdProblem = await prisma.problem.create({
            data: {
                id: problem.id || undefined,
                title: problem.title,
                slug: problem.slug || problem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                methodName: methodNameResult.data,
                difficulty: problem.difficulty || 'Easy',
                points: Number(problem.points || 100),
                timeLimitMs: Number(problem.timeLimitMs || 1000),
                memoryLimitMb: Number(problem.memoryLimitMb || 256),
                tags: typeof problem.tags === 'string' ? problem.tags : JSON.stringify(problem.tags || []),
                description: problem.description || '',
                inputFormat: problem.inputFormat || '',
                outputFormat: problem.outputFormat || '',
                constraints: typeof problem.constraints === 'string' ? problem.constraints : JSON.stringify(problem.constraints || []),
                starterTemplates: typeof problem.starterTemplates === 'string' ? problem.starterTemplates : JSON.stringify(problem.starterTemplates || {}),
                competitionId,
                sampleTestCases: {
                    create: (problem.sampleTestCases || []).map((stc: SampleTestCase) => ({
                        id: stc.id || undefined,
                        input: stc.input,
                        output: stc.output,
                        explanation: stc.explanation || null,
                    })),
                },
                testCases: {
                    create: (problem.testCases || []).map((tc: TestCase) => ({
                        id: tc.id || undefined,
                        input: tc.input,
                        output: tc.output,
                        hidden: Boolean(tc.hidden),
                    })),
                },
            },
            include: {
                sampleTestCases: true,
                testCases: true,
            },
        });

        return NextResponse.json({ problem: createdProblem });
    } catch (error: any) {
        console.error('Failed to create problem:', error);
        return NextResponse.json({ error: error?.message || 'Failed to create problem' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { problem } = body;

        if (!problem || !problem.id) {
            return NextResponse.json({ error: 'Missing problem id' }, { status: 400 });
        }

        const methodNameResult = problemSchema.shape.methodName.safeParse(problem?.methodName);
        if (!methodNameResult.success) {
            return NextResponse.json({ error: methodNameResult.error.issues[0]?.message || 'Method name is required' }, { status: 400 });
        }

        // Cleanly recreate sample test cases and test cases
        await prisma.sampleTestCase.deleteMany({ where: { problemId: problem.id } });
        await prisma.testCase.deleteMany({ where: { problemId: problem.id } });

        const updatedProblem = await prisma.problem.update({
            where: { id: problem.id },
            data: {
                title: problem.title,
                slug: problem.slug || problem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                methodName: methodNameResult.data,
                difficulty: problem.difficulty,
                points: Number(problem.points || 100),
                timeLimitMs: Number(problem.timeLimitMs || 1000),
                memoryLimitMb: Number(problem.memoryLimitMb || 256),
                tags: typeof problem.tags === 'string' ? problem.tags : JSON.stringify(problem.tags || []),
                description: problem.description || '',
                inputFormat: problem.inputFormat || '',
                outputFormat: problem.outputFormat || '',
                constraints: typeof problem.constraints === 'string' ? problem.constraints : JSON.stringify(problem.constraints || []),
                starterTemplates: typeof problem.starterTemplates === 'string' ? problem.starterTemplates : JSON.stringify(problem.starterTemplates || {}),
                sampleTestCases: {
                    create: (problem.sampleTestCases || []).map((stc: SampleTestCase) => ({
                        id: stc.id || undefined,
                        input: stc.input,
                        output: stc.output,
                        explanation: stc.explanation || null,
                    })),
                },
                testCases: {
                    create: (problem.testCases || []).map((tc: TestCase) => ({
                        id: tc.id || undefined,
                        input: tc.input,
                        output: tc.output,
                        hidden: Boolean(tc.hidden),
                    })),
                },
            },
            include: {
                sampleTestCases: true,
                testCases: true,
            },
        });

        return NextResponse.json({ problem: updatedProblem });
    } catch (error: any) {
        console.error('Failed to update problem:', error);
        return NextResponse.json({ error: error?.message || 'Failed to update problem' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing problem id query parameter' }, { status: 400 });
        }

        await prisma.problem.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: 'Problem deleted successfully' });
    } catch (error: any) {
        console.error('Failed to delete problem:', error);
        return NextResponse.json({ error: error?.message || 'Failed to delete problem' }, { status: 500 });
    }
}
