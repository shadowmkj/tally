'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  KeyRound, 
  Plus, 
  Radio, 
  Megaphone, 
  Lock, 
  Unlock, 
  FileCode, 
  Pause, 
  Check, 
  PlusCircle,
  LogOut
} from 'lucide-react';
import { Competition, Problem, Difficulty } from '@/types';
import { authClient } from '@/lib/auth-client';

interface AdminPortalProps {
  competitions: Competition[];
  onAddCompetition: (comp: Competition) => void;
  onUpdateCompetition: (comp: Competition) => void;
  onBroadcastAnnouncement: (compAccessCode: string, title: string, text: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  competitions,
  onAddCompetition,
  onUpdateCompetition,
  onBroadcastAnnouncement,
}) => {
  const [selectedCompCode, setSelectedCompCode] = useState<string>(competitions[0]?.accessCode || '');
  const activeComp = competitions.find(c => c.accessCode === selectedCompCode) || competitions[0];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('Wecode Weekly CodeRush #4');
  const [newSubtitle, setNewSubtitle] = useState('Wecode Club - GCE Kannur');
  const [newCode, setNewCode] = useState('');
  const [newDuration, setNewDuration] = useState(90);

  const [annTitle, setAnnTitle] = useState('');
  const [annText, setAnnText] = useState('');
  const [annSuccess, setAnnSuccess] = useState(false);

  const [showAddProblemModal, setShowAddProblemModal] = useState(false);
  const [probTitle, setProbTitle] = useState('5. Subarray Sum Equals K');
  const [probDiff, setProbDiff] = useState<Difficulty>('Medium');
  const [probPoints, setProbPoints] = useState(200);
  const [probDesc, setProbDesc] = useState('Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k.');
  const [probSampleIn, setProbSampleIn] = useState('3\n1 1 1\n2');
  const [probSampleOut, setProbSampleOut] = useState('2');

  const generateRandom6Char = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(res);
  };

  const handleCreateCompetition = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = (newCode || 'WEC999').toUpperCase().slice(0, 6);

    const newComp: Competition = {
      id: `comp-${Date.now()}`,
      accessCode: finalCode,
      title: newTitle,
      subtitle: newSubtitle,
      description: 'Custom competition created via Wecode Admin Portal.',
      startTime: new Date().toISOString(),
      durationMinutes: newDuration,
      isLive: true,
      isLeaderboardFrozen: false,
      problems: [
        {
          id: `p-${Date.now()}-1`,
          title: '1. Two Sum Target',
          slug: 'two-sum-target',
          difficulty: 'Easy',
          points: 100,
          timeLimitMs: 1000,
          memoryLimitMb: 256,
          tags: ['Array', 'Hash Table'],
          description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
          inputFormat: 'Line 1: N and Target. Line 2: N space-separated integers.',
          outputFormat: 'Print 0-indexed indices of the two numbers.',
          constraints: ['2 <= N <= 10^4'],
          sampleTestCases: [
            { id: 'st1', input: '4 9\n2 7 11 15', output: '0 1' }
          ],
          testCases: [
            { id: 't1', input: '4 9\n2 7 11 15', output: '0 1' }
          ],
          starterTemplates: {
            python: `def solve():\n    print("0 1")\nif __name__ == "__main__":\n    solve()`,
            cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "0 1" << endl;\n    return 0;\n}`,
            java: `public class Solution {\n    public static void main(String[] args) {\n        System.out.println("0 1");\n    }\n}`,
            c: `#include <stdio.h>\nint main() {\n    printf("0 1\\n");\n    return 0;\n}`,
            javascript: `console.log("0 1");`
          }
        }
      ],
      announcements: [
        {
          id: `ann-${Date.now()}`,
          title: 'Contest Initialized',
          text: `Welcome to ${newTitle}! Access Code is ${finalCode}.`,
          timestamp: new Date().toISOString(),
        }
      ]
    };

    onAddCompetition(newComp);
    setSelectedCompCode(finalCode);
    setShowCreateModal(false);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annText.trim() || !activeComp) return;

    onBroadcastAnnouncement(activeComp.accessCode, annTitle.trim(), annText.trim());
    setAnnTitle('');
    setAnnText('');
    setAnnSuccess(true);
    setTimeout(() => setAnnSuccess(false), 2500);
  };

  const handleAddProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComp) return;

    const newProb: Problem = {
      id: `p-${Date.now()}`,
      title: probTitle,
      slug: probTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      difficulty: probDiff,
      points: probPoints,
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      tags: ['Algorithm', 'Data Structure'],
      description: probDesc,
      inputFormat: 'Standard stdin format.',
      outputFormat: 'Standard stdout format.',
      constraints: ['Time Limit: 1.0 second'],
      sampleTestCases: [
        { id: `s-${Date.now()}`, input: probSampleIn, output: probSampleOut }
      ],
      testCases: [
        { id: `t-${Date.now()}`, input: probSampleIn, output: probSampleOut }
      ],
      starterTemplates: {
        python: `import sys\ndef main():\n    print("${probSampleOut.replace(/\n/g, '\\n')}")\nif __name__ == "__main__":\n    main()`,
        cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "${probSampleOut.replace(/\n/g, '\\n')}" << endl;\n    return 0;\n}`,
        java: `public class Solution {\n    public static void main(String[] args) {\n        System.out.println("${probSampleOut.replace(/\n/g, '\\n')}");\n    }\n}`,
        c: `#include <stdio.h>\nint main() {\n    printf("${probSampleOut.replace(/\n/g, '\\n')}\\n");\n    return 0;\n}`,
        javascript: `console.log("${probSampleOut.replace(/\n/g, '\\n')}");`
      }
    };

    const updatedComp: Competition = {
      ...activeComp,
      problems: [...activeComp.problems, newProb]
    };

    onUpdateCompetition(updatedComp);
    setShowAddProblemModal(false);
  };

  const toggleFreeze = () => {
    if (!activeComp) return;
    onUpdateCompetition({
      ...activeComp,
      isLeaderboardFrozen: !activeComp.isLeaderboardFrozen,
    });
  };

  const toggleLiveState = () => {
    if (!activeComp) return;
    onUpdateCompetition({
      ...activeComp,
      isLive: !activeComp.isLive,
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-fadeIn overflow-x-hidden">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400 stroke-[2.5]" />
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
              Wecode Admin Control Center
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Generate 6-digit access codes, configure problems, freeze leaderboards, & broadcast announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              generateRandom6Char();
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Competition (6-Digit Code)</span>
          </button>

          <button
            onClick={async () => {
              await authClient.signOut();
              window.location.href = '/admin/login';
            }}
            className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-zinc-700/60"
            title="Sign Out of Admin Portal"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Select Competition Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Select Contest:</span>
          <select
            value={selectedCompCode}
            onChange={(e) => setSelectedCompCode(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 font-mono font-bold text-amber-300 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {competitions.map((c) => (
              <option key={c.id} value={c.accessCode}>
                [{c.accessCode}] {c.title}
              </option>
            ))}
          </select>
        </div>

        {activeComp && (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLiveState}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                activeComp.isLive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              {activeComp.isLive ? <Radio className="w-3.5 h-3.5 animate-pulse" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{activeComp.isLive ? 'CONTEST LIVE' : 'PAUSED'}</span>
            </button>

            <button
              onClick={toggleFreeze}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                activeComp.isLeaderboardFrozen
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              {activeComp.isLeaderboardFrozen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{activeComp.isLeaderboardFrozen ? 'FROZEN' : 'FREEZE LEADERBOARD'}</span>
            </button>
          </div>
        )}
      </div>

      {activeComp && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-mono text-xs font-bold text-amber-400">
                    CODE: {activeComp.accessCode}
                  </span>
                  <h2 className="text-xl font-bold text-zinc-100 mt-2">{activeComp.title}</h2>
                  <p className="text-xs text-zinc-400">{activeComp.subtitle}</p>
                </div>

                <div className="text-right font-mono text-xs text-zinc-400">
                  <div>Duration: <strong className="text-amber-300">{activeComp.durationMinutes} mins</strong></div>
                  <div>Problems: <strong className="text-amber-300">{activeComp.problems.length}</strong></div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-zinc-100">Contest Problem Set</h3>
                </div>

                <button
                  onClick={() => setShowAddProblemModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-zinc-700/60"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Problem</span>
                </button>
              </div>

              <div className="space-y-3">
                {activeComp.problems.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4 text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-zinc-200 text-sm">
                        {p.title}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {p.points} Points • {p.difficulty} • Time: {p.timeLimitMs}ms
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px]">
                        {p.sampleTestCases.length} Samples
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="space-y-6">
            
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-zinc-100">Broadcast Announcement</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Post live updates, clarifications, or timer alerts to all active participants in contest <strong className="text-amber-400 font-mono">{activeComp.accessCode}</strong>.
              </p>

              <form onSubmit={handleBroadcast} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g. Problem B Constraint Clarification"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Announcement Message
                  </label>
                  <textarea
                    value={annText}
                    onChange={(e) => setAnnText(e.target.value)}
                    rows={3}
                    placeholder="Type broadcast message..."
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {annSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center flex items-center justify-center gap-1.5 font-mono">
                    <Check className="w-4 h-4" />
                    <span>Broadcast Sent Live!</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Send Live Broadcast</span>
                </button>
              </form>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-3">
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Recent Broadcast History
              </h4>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {activeComp.announcements.length === 0 ? (
                  <div className="text-xs text-zinc-500">No broadcasts sent yet.</div>
                ) : (
                  activeComp.announcements.map((a) => (
                    <div key={a.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                      <div className="font-bold text-amber-300">{a.title}</div>
                      <div className="text-zinc-300 text-[11px]">{a.text}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {new Date(a.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* CREATE COMPETITION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md">
          <div className="w-full max-w-md max-w-[calc(100vw-1.5rem)] bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>Create New Competition</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-zinc-100 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCompetition} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  6-Digit Access Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="e.g. WEC2026"
                    required
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 font-mono font-extrabold text-amber-300 text-sm tracking-widest uppercase focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={generateRandom6Char}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-mono transition-colors"
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Competition Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value) || 90)}
                  required
                  min={10}
                  max={600}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md"
                >
                  Generate Contest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PROBLEM MODAL */}
      {showAddProblemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg max-w-[calc(100vw-1.5rem)] bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                <span>Add Problem to [{activeComp.accessCode}]</span>
              </h3>
              <button
                onClick={() => setShowAddProblemModal(false)}
                className="text-zinc-400 hover:text-zinc-100 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProblem} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Problem Title</label>
                <input
                  type="text"
                  value={probTitle}
                  onChange={(e) => setProbTitle(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Difficulty</label>
                  <select
                    value={probDiff}
                    onChange={(e) => setProbDiff(e.target.value as Difficulty)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Points</label>
                  <input
                    type="number"
                    value={probPoints}
                    onChange={(e) => setProbPoints(parseInt(e.target.value) || 100)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Description</label>
                <textarea
                  value={probDesc}
                  onChange={(e) => setProbDesc(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Sample Input</label>
                  <textarea
                    value={probSampleIn}
                    onChange={(e) => setProbSampleIn(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs font-mono text-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Sample Output</label>
                  <textarea
                    value={probSampleOut}
                    onChange={(e) => setProbSampleOut(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs font-mono text-emerald-300"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProblemModal(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md"
                >
                  Save Problem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
