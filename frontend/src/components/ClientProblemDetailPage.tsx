'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCompetition } from '@/context/CompetitionContext';

const ProblemWorkspace = dynamic(
  () => import('@/components/ProblemWorkspace').then(mod => mod.ProblemWorkspace),
  { ssr: false }
);

export function ClientProblemDetailPage({ problemId }: { problemId: string }) {
  const { activeCompetition, session, addSubmission, submissions } = useCompetition();

  const problem = activeCompetition.problems.find(p => p.id === problemId || p.slug === problemId) || activeCompetition.problems[0];

  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <h1 className="text-2xl font-bold text-zinc-200">Problem Not Found</h1>
        <p className="text-sm text-zinc-400">The problem you are looking for does not exist in this contest.</p>
        <Link href="/problems" className="px-4 py-2 bg-primary-500 text-zinc-950 font-bold text-xs rounded-xl">
          Back to Problems List
        </Link>
      </div>
    );
  }

  const problemSubmissions = submissions.filter(
    s => s.problemId === problem.id && s.collegeId === session?.collegeId
  );

  return (
    <ProblemWorkspace
      problem={problem}
      session={session}
      onSubmitFinished={addSubmission}
      previousSubmissions={problemSubmissions}
    />
  );
}
