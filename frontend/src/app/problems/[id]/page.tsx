'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCompetition } from '@/context/CompetitionContext';

// Dynamically import ProblemWorkspace with ssr: false for Monaco Editor safety
const ProblemWorkspace = dynamic(
  () => import('@/components/ProblemWorkspace').then(mod => mod.ProblemWorkspace),
  { ssr: false }
);

interface ProblemPageProps {
  params: Promise<{ id: string }>;
}

export default function ProblemDetailPage({ params }: ProblemPageProps) {
  const { id } = React.use(params);
  const { activeCompetition, session, addSubmission, submissions } = useCompetition();

  const problem = activeCompetition.problems.find(p => p.id === id || p.slug === id) || activeCompetition.problems[0];

  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <h1 className="text-2xl font-bold text-zinc-200">Problem Not Found</h1>
        <p className="text-sm text-zinc-400">The problem you are looking for does not exist in this contest.</p>
        <Link href="/problems" className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl">
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
