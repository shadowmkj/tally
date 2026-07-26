'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Code2, 
  Trophy, 
  ShieldCheck, 
  KeyRound, 
  Timer, 
  ChevronRight,
  LogOut,
  Bell
} from 'lucide-react';
import { useCompetition } from '@/context/CompetitionContext';
import { authClient } from '@/lib/auth-client';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { data: adminSession } = authClient.useSession();

  const { 
    activeCompetition, 
    session, 
    setShowCodeGate, 
    logoutSession, 
    setShowAnnouncements,
    theme,
    setTheme
  } = useCompetition();

  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  useEffect(() => {
    if (!activeCompetition) return;

    const updateTimer = () => {
      const start = new Date(activeCompetition.startTime).getTime();
      const durationMs = activeCompetition.durationMinutes * 60 * 1000;
      const end = start + durationMs;
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeftStr('Contest Ended');
      } else {
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeftStr(`${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeCompetition]);

  const isProblems = pathname === '/' || pathname.startsWith('/problems');
  const isLeaderboard = pathname.startsWith('/leaderboard');
  const isAdmin = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 bg-zinc-900/95 border-b border-zinc-800 backdrop-blur-md text-zinc-100 w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Branding & Contest Info */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link 
            href="/problems"
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Code2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-zinc-100 via-amber-200 to-amber-400 bg-clip-text text-transparent">
                  WECODE
                </span>
                <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-semibold">
                  GCEK
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 -mt-0.5 tracking-wide hidden sm:block">
                Coding Competition Platform
              </p>
            </div>
          </Link>

          {/* Active Access Code Badge */}
          {activeCompetition && (
            <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-zinc-800">
              <div 
                onClick={() => { if (!isAdmin && !adminSession?.user) setShowCodeGate(true); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-mono cursor-pointer transition-colors group"
                title={adminSession?.user ? "Active Competition Access Code" : "Click to switch or enter new 6-digit access code"}
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-zinc-400">CODE:</span>
                <span className="font-bold text-amber-300 tracking-wider group-hover:text-amber-200">
                  {activeCompetition.accessCode}
                </span>
                {!isAdmin && !adminSession?.user && <ChevronRight className="w-3 h-3 text-zinc-500" />}
              </div>

              {/* Contest Live Timer */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-medium">
                <Timer className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                <span>{timeLeftStr}</span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Main Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-zinc-800/80 shrink-0">
          <Link
            id="nav-problems-btn"
            href="/problems"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isProblems
                ? 'bg-zinc-800 text-amber-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden sm:inline">Problems</span>
          </Link>

          <Link
            id="nav-leaderboard-btn"
            href="/leaderboard"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
              isLeaderboard
                ? 'bg-zinc-800 text-amber-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Leaderboard</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </Link>

          <Link
            id="nav-admin-btn"
            href="/admin"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isAdmin
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Admin Portal</span>
          </Link>
        </nav>

        {/* Right: User Profile & Announcements */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Announcement Bell Button */}
          <button
            onClick={() => setShowAnnouncements(true)}
            className="relative p-2 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
            title="Announcements"
          >
            <Bell className="w-4 h-4" />
            {activeCompetition.announcements.length > 0 && (
              <span className="absolute top-1 right-1 px-1 py-0.2 min-w-[16px] h-4 text-[10px] font-bold text-zinc-950 bg-amber-400 rounded-full flex items-center justify-center animate-bounce">
                {activeCompetition.announcements.length}
              </span>
            )}
          </button>

          {/* Admin Logged-In Badge or Participant Session */}
          {adminSession?.user ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-2.5 py-1 text-xs font-mono text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold hidden lg:inline">{adminSession.user.name || adminSession.user.email}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">Admin Mode</span>
            </div>
          ) : session ? (
            <div className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl px-2 sm:px-2.5 py-1">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                {session.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left pr-1">
                <div className="text-xs font-bold text-zinc-100 truncate max-w-[110px]">
                  {session.name}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {session.collegeId}
                </div>
              </div>
              <button
                onClick={logoutSession}
                className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-700/50 rounded transition-colors"
                title="Exit Participant Session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : isAdmin ? (
            <Link
              href="/admin/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </Link>
          ) : (
            <button
              onClick={() => setShowCodeGate(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enter 6-Digit Code</span>
              <span className="sm:hidden">Code</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
