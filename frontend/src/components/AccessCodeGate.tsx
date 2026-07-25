'use client';

import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { Competition, UserSession } from '@/types';

interface AccessCodeGateProps {
  competitions: Competition[];
  onVerifySession: (session: UserSession) => void;
  onCloseModal?: () => void;
  initialCode?: string;
}

export const AccessCodeGate: React.FC<AccessCodeGateProps> = ({
  competitions,
  onVerifySession,
  onCloseModal,
  initialCode = '',
}) => {
  const [accessCode, setAccessCode] = useState<string>(initialCode || 'WEC2026');
  const [name, setName] = useState<string>('Rishal P - CS 2026');
  const [collegeId, setCollegeId] = useState<string>('KNR22CS078');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleCharInput = (val: string) => {
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setAccessCode(cleaned);
    setErrorMessage('');
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (accessCode.length < 6) {
      setErrorMessage('Access code must be exactly 6 alphanumeric characters.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please enter your Name / Handle.');
      return;
    }

    if (!collegeId.trim()) {
      setErrorMessage('Please enter your College Register Number / ID.');
      return;
    }

    const targetComp = competitions.find(c => c.accessCode.toUpperCase() === accessCode.toUpperCase());

    if (!targetComp) {
      setErrorMessage(`No competition found matching code "${accessCode}". Please check with Wecode Admins or select an available contest below.`);
      return;
    }

    const session: UserSession = {
      accessCode: targetComp.accessCode,
      participantId: `part-${Date.now()}`,
      name: name.trim(),
      collegeId: collegeId.trim().toUpperCase(),
      enteredAt: new Date().toISOString(),
    };

    onVerifySession(session);
    if (onCloseModal) onCloseModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-w-[calc(100vw-1.5rem)] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Top Glow Bar */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500"></div>

        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1">
              <KeyRound className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-black text-zinc-100 tracking-tight">
              Wecode Competition Access
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Enter the <span className="text-amber-400 font-semibold font-mono">6-digit access code</span> created by organizers to join your competition.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleJoin} className="space-y-4">
            
            {/* 6-Digit Code Input */}
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-300 mb-2 uppercase tracking-wider text-center">
                6-Digit Access Code
              </label>
              
              <div className="flex justify-center gap-1.5 sm:gap-2">
                {Array.from({ length: 6 }).map((_, i) => {
                  const char = accessCode[i] || '';
                  return (
                    <div
                      key={i}
                      className={`w-9 h-11 xs:w-10 xs:h-12 sm:w-12 sm:h-14 rounded-xl border flex items-center justify-center text-lg sm:text-xl font-mono font-black transition-all ${
                        char
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/10'
                          : 'bg-zinc-950/80 border-zinc-800 text-zinc-600'
                      }`}
                    >
                      {char || '•'}
                    </div>
                  );
                })}
              </div>

              <input
                id="access-code-input"
                type="text"
                value={accessCode}
                onChange={(e) => handleCharInput(e.target.value)}
                maxLength={6}
                placeholder="Type 6-digit code e.g. WEC2026"
                className="w-full mt-2 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-center font-mono font-bold text-amber-300 text-sm tracking-widest uppercase focus:outline-none focus:border-amber-500/80 transition-colors"
                autoFocus
              />
            </div>

            {/* Participant Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Participant Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rishal P"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  College Register No. / ID
                </label>
                <input
                  type="text"
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  placeholder="e.g. KNR22CS078"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center animate-shake">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              id="join-contest-btn"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Verify & Join Competition</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Active Contests Presets */}
          <div className="pt-3 border-t border-zinc-800/80">
            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Available Active Contests:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {competitions.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => {
                    setAccessCode(comp.accessCode);
                    setErrorMessage('');
                  }}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    accessCode === comp.accessCode
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-amber-400">
                      {comp.accessCode}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      Live
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-zinc-200 truncate mt-1">
                    {comp.title}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    {comp.problems.length} Problems • {comp.durationMinutes} mins
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seamless Notice Footer */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>No passwords required. Participant verification by Access Code.</span>
          </div>

        </div>
      </div>
    </div>
  );
};
