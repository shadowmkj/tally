'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Search, 
  Download, 
  Radio, 
  ShieldAlert, 
  Minus,
  Flame,
  ShieldCheck
} from 'lucide-react';
import type { Competition, Participant } from '@/context/CompetitionContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface LeaderboardProps {
  competition: Competition;
  participants: Participant[];
  onOpenCodeGate?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  competition,
  participants,
  onOpenCodeGate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString());
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const competitionParticipants = participants.filter((p) => {
    const pAccess = (p.accessCode || '').toUpperCase();
    const cAccess = (competition.accessCode || '').toUpperCase();
    const pCompId = p.competitionId;
    const cCompId = competition.id;
    return pAccess === cAccess || (Boolean(cCompId) && pCompId === cCompId);
  });

  const sortedParticipants = [...competitionParticipants].sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return a.totalPenaltyTimeMinutes - b.totalPenaltyTimeMinutes;
  });

  const filteredParticipants = sortedParticipants.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.collegeId.toLowerCase().includes(q);
  });

  const handleExportCSV = () => {
    const headers = ['Rank', 'Participant Name', 'College Register ID', 'Total Score', 'Penalty Minutes'];
    competition.problems.forEach(p => headers.push(p.title));

    const rows = sortedParticipants.map((p, rankIdx) => {
      const row = [
        rankIdx + 1,
        `"${p.name}"`,
        `"${p.collegeId}"`,
        p.totalScore,
        p.totalPenaltyTimeMinutes
      ];
      competition.problems.forEach(prob => {
        const status = p.solvedProblems[prob.id];
        if (status?.status === 'AC') {
          row.push(`AC (+${status.attempts}) in ${status.solvedTimeMinutes || 0}m`);
        } else if (status?.status === 'WA') {
          row.push(`WA (-${status.attempts})`);
        } else {
          row.push('-');
        }
      });
      return row.join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${competition.accessCode}_Leaderboard.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 animate-fadeIn overflow-x-hidden">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary-400 stroke-[2.5]" />
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
              Real-Time Competition Leaderboard
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            {competition.title} ({competition.accessCode}) • Real-time score & penalty rankings
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>{autoRefresh ? 'Live Sync ON' : 'Paused'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-primary-400" />
            <span>Export CSV</span>
          </button>

        </div>
      </div>

      {/* Freeze Warning Notice */}
      {competition.isLeaderboardFrozen && (
        <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-300 text-xs font-mono flex items-center gap-3 animate-pulse">
          <ShieldAlert className="w-5 h-5 text-primary-400 shrink-0" />
          <div>
            <strong>Leaderboard Frozen:</strong> Standings have been frozen for the final phase of the competition. Official final results will be revealed during the closing ceremony!
          </div>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search participant name or register ID..."
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <span>Participants: <strong className="text-primary-400">{sortedParticipants.length}</strong></span>
          <span>•</span>
          <span>Last Sync: <strong className="text-zinc-200">{lastUpdated}</strong></span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-full">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                <th className="py-3.5 px-4 min-w-[180px]">Participant</th>
                <th className="py-3.5 px-4 w-24 text-center">Score</th>
                <th className="py-3.5 px-4 w-24 text-center">Penalty</th>

                {competition.problems.map((p, idx) => (
                  <th key={p.id} className="py-3.5 px-3 text-center min-w-[90px]">
                    <div className="font-bold text-primary-300">P{idx + 1}</div>
                    <div className="text-[9px] text-zinc-500 truncate max-w-[80px] mx-auto font-sans font-normal">
                      {p.points}pts
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/80 text-xs font-medium">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={5 + competition.problems.length} className="py-12 text-center text-zinc-500">
                    No participants found matching "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((part, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;

                  return (
                    <tr
                      key={part.id}
                      className={`hover:bg-zinc-800/40 transition-colors ${
                        rank === 1 ? 'bg-primary-500/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4 text-center font-mono font-bold">
                        {rank === 1 ? (
                          <div className="w-7 h-7 rounded-lg bg-primary-500 text-zinc-950 flex items-center justify-center font-extrabold shadow-md mx-auto">
                            1
                          </div>
                        ) : rank === 2 ? (
                          <div className="w-7 h-7 rounded-lg bg-zinc-300 text-zinc-950 flex items-center justify-center font-extrabold shadow-md mx-auto">
                            2
                          </div>
                        ) : rank === 3 ? (
                          <div className="w-7 h-7 rounded-lg bg-primary-700 text-zinc-100 flex items-center justify-center font-extrabold shadow-md mx-auto">
                            3
                          </div>
                        ) : (
                          <span className="text-zinc-400">#{rank}</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                          <span>{part.name}</span>
                          {isTop3 && <Flame className="w-3.5 h-3.5 text-primary-400" />}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          {part.collegeId}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-extrabold text-sm text-primary-300">
                        {part.totalScore}
                      </td>

                      <td className="py-4 px-4 text-center font-mono text-zinc-400 text-xs">
                        {part.totalPenaltyTimeMinutes}m
                      </td>

                      {competition.problems.map((prob) => {
                        const statusObj = part.solvedProblems[prob.id];
                        const isAC = statusObj?.status === 'AC';
                        const isWA = statusObj?.status === 'WA';

                        return (
                          <td key={prob.id} className="py-3 px-2 text-center">
                            {isAC ? (
                              <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold">
                                <div>+{statusObj.attempts}</div>
                                <div className="text-[9px] text-emerald-300/80 font-normal">
                                  {statusObj.solvedTimeMinutes || 0}m
                                </div>
                              </div>
                            ) : isWA ? (
                              <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono text-[11px] font-bold">
                                <div>-{statusObj.attempts}</div>
                              </div>
                            ) : (
                              <div className="p-1.5 text-zinc-600">
                                <Minus className="w-3.5 h-3.5 mx-auto opacity-40" />
                              </div>
                            )}
                          </td>
                        );
                      })}
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
