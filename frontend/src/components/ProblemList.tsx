'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  XCircle, 
  Circle, 
  Search, 
  Filter, 
  ArrowRight, 
  Trophy
} from 'lucide-react';
import type { Problem, Competition, SolvedProblemStatus } from '@/context/CompetitionContext';

interface ProblemListProps {
  competition: Competition;
  solvedStatus: Record<string, SolvedProblemStatus>;
  onOpenLeaderboard?: () => void;
}

export const ProblemList: React.FC<ProblemListProps> = ({
  competition,
  solvedStatus,
  onOpenLeaderboard,
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Solved' | 'Unsolved'>('All');

  const solvedCount = (Object.values(solvedStatus) as SolvedProblemStatus[]).filter(s => s.status === 'AC').length;
  const totalCount = competition.problems.length;
  const progressPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  const filteredProblems = competition.problems.filter((p) => {
    const pStatus = solvedStatus[p.id]?.status || 'NONE';
    
    if (difficultyFilter !== 'All' && p.difficulty !== difficultyFilter) return false;

    if (statusFilter === 'Solved' && pStatus !== 'AC') return false;
    if (statusFilter === 'Unsolved' && pStatus === 'AC') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const tagsArr = Array.isArray(p.tags) ? p.tags : [];
      const matchTag = tagsArr.some((t: string) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchTag) return false;
    }

    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-fadeIn overflow-x-hidden">
      
      {/* Contest Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900 border border-zinc-800 p-4 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 font-mono text-xs font-bold text-amber-400">
                ACCESS CODE: {competition.accessCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE CONTEST
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
              {competition.title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              {competition.subtitle} — {competition.description}
            </p>
          </div>

          {/* Progress Card */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 w-full sm:w-auto sm:min-w-[220px] space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Contest Solved Progress</span>
              <span className="font-mono font-bold text-amber-400">
                {solvedCount} / {totalCount} ({progressPercent}%)
              </span>
            </div>

            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <Link
              href="/leaderboard"
              className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 border border-zinc-700/50 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>View Live Leaderboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problem title or tag..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80"
          />
        </div>

        {/* Difficulty Pill Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 shrink-0">
          <span className="text-xs text-zinc-500 font-medium flex items-center gap-1 pr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Difficulty:</span>
          </span>

          {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                difficultyFilter === diff
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

      </div>

      {/* LeetCode Problem Table */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl w-full max-w-full">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-3 sm:px-4 w-10 sm:w-12 text-center">Status</th>
                <th className="py-3.5 px-3 sm:px-4">Problem Title</th>
                <th className="py-3.5 px-3 sm:px-4 w-24 sm:w-28 text-center">Difficulty</th>
                <th className="py-3.5 px-3 sm:px-4 w-20 sm:w-24 text-center">Points</th>
                <th className="py-3.5 px-3 sm:px-4 w-28 sm:w-32 text-center hidden sm:table-cell">Acceptance</th>
                <th className="py-3.5 px-3 sm:px-4 hidden md:table-cell">Tags</th>
                <th className="py-3.5 px-3 sm:px-4 w-24 sm:w-28 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/60 text-xs font-medium">
              {filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No problems match your current filters.
                  </td>
                </tr>
              ) : (
                filteredProblems.map((p) => {
                  const statusInfo = solvedStatus[p.id];
                  const isSolved = statusInfo?.status === 'AC';
                  const isAttempted = statusInfo?.status === 'WA';

                  return (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/problems/${p.id}`)}
                      className="group hover:bg-zinc-800/50 cursor-pointer transition-colors"
                    >
                      {/* Status Icon */}
                      <td className="py-4 px-4 text-center">
                        {isSolved ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : isAttempted ? (
                          <XCircle className="w-5 h-5 text-rose-400 mx-auto" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-600 mx-auto group-hover:text-zinc-400 transition-colors" />
                        )}
                      </td>

                      {/* Title */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-zinc-100 group-hover:text-amber-300 transition-colors text-sm">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          Time: {p.timeLimitMs}ms • Memory: {p.memoryLimitMb}MB
                        </div>
                      </td>

                      {/* Difficulty Badge */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            p.difficulty === 'Easy'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : p.difficulty === 'Medium'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {p.difficulty}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="py-4 px-4 text-center font-mono font-bold text-amber-300">
                        +{p.points} pts
                      </td>

                      {/* Acceptance Rate */}
                      <td className="py-4 px-4 text-center font-mono text-zinc-400 hidden sm:table-cell">
                        {p.acceptanceRate ? `${p.acceptanceRate}%` : '65.0%'}
                      </td>

                      {/* Tags */}
                      <td className="py-4 px-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(p.tags) ? p.tags : []).map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded bg-zinc-950 text-[10px] text-zinc-400 font-mono border border-zinc-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Action CTA */}
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/problems/${p.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 group-hover:bg-amber-500 text-zinc-300 group-hover:text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <span>Solve</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
