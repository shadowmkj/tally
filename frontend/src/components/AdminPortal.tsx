'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
    LogOut,
    Trash2,
    AlertTriangle,
    Pencil,
    ExternalLink
} from 'lucide-react';
import type { Competition, Problem, Difficulty } from '@/context/CompetitionContext';
import { authClient } from '@/lib/auth-client';
import { createCompetitionSchema, problemSchema } from '@/lib/validations';
import { SUPPORTED_LANGUAGES, LanguageId } from '@/lib/languages';
import { ModalPortal } from '@/components/ModalPortal';

interface AdminPortalProps {
    competitions: Competition[];
    onAddCompetition: (comp: Competition) => void;
    onUpdateCompetition: (comp: Competition) => void;
    onDeleteCompetition: (accessCode: string) => void;
    onAddProblem?: (competitionId: string, problem: Problem) => Promise<void>;
    onUpdateProblem?: (problem: Problem) => Promise<void>;
    onDeleteProblem?: (problemId: string) => Promise<void>;
    onBroadcastAnnouncement: (compAccessCode: string, title: string, text: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
    competitions,
    onAddCompetition,
    onUpdateCompetition,
    onDeleteCompetition,
    onAddProblem,
    onUpdateProblem,
    onDeleteProblem,
    onBroadcastAnnouncement,
}) => {
    const [selectedCompCode, setSelectedCompCode] = useState<string>(competitions[0]?.accessCode || '');
    const activeComp = competitions.find(c => c.accessCode === selectedCompCode) || competitions[0];

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('Wecode Weekly CodeRush #4');
    const [newSubtitle] = useState('Wecode Club - GCE Kannur');
    const [newCode, setNewCode] = useState('');
    const [newDuration, setNewDuration] = useState(90);

    const [formErrors, setFormErrors] = useState<{
        accessCode?: string;
        title?: string;
        subtitle?: string;
        durationMinutes?: string;
    }>({});

    const [annTitle, setAnnTitle] = useState('');
    const [annText, setAnnText] = useState('');
    const [annSuccess, setAnnSuccess] = useState(false);

    const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
    const [deletingProblem, setDeletingProblem] = useState<Problem | null>(null);

    const [showAddProblemModal, setShowAddProblemModal] = useState(false);
    const [probTitle, setProbTitle] = useState('5. Subarray Sum Equals K');
    const [probMethodName, setProbMethodName] = useState('subarraySum');
    const [probTypeSchema, setProbTypeSchema] = useState('[i],i:i');
    const [probDiff, setProbDiff] = useState<Difficulty>('Medium');
    const [probPoints, setProbPoints] = useState(200);
    const [probTimeLimitMs, setProbTimeLimitMs] = useState(1000);
    const [probMemoryLimitMb, setProbMemoryLimitMb] = useState(256);
    const [probDesc, setProbDesc] = useState('Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k.');
    const [probSampleIn, setProbSampleIn] = useState('3\n1 1 1\n2');
    const [probSampleOut, setProbSampleOut] = useState('2');

    const [starterTab, setStarterTab] = useState<LanguageId>(SUPPORTED_LANGUAGES[0].id);
    const [probStarterPython, setProbStarterPython] = useState<string>('');
    const [probStarterCpp, setProbStarterCpp] = useState<string>('');
    const [probStarterJava, setProbStarterJava] = useState<string>('');
    const [probStarterC, setProbStarterC] = useState<string>('');
    const [probStarterJs, setProbStarterJs] = useState<string>('');

    const [problemFormErrors, setProblemFormErrors] = useState<{
        title?: string;
        methodName?: string;
        typeSchema?: string;
        points?: string;
        timeLimitMs?: string;
        memoryLimitMb?: string;
        description?: string;
        sampleInput?: string;
        sampleOutput?: string;
    }>({});

    const generateRandom6Char = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let res = '';
        for (let i = 0; i < 6; i++) {
            res += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewCode(res);
        setFormErrors(prev => ({ ...prev, accessCode: undefined }));
    };

    const handleOpenAddProblemModal = () => {
        setEditingProblem(null);
        setProbTitle('');
        setProbMethodName('');
        setProbTypeSchema('');
        setProbDiff('Easy');
        setProbPoints(100);
        setProbTimeLimitMs(1000);
        setProbMemoryLimitMb(256);
        setProbDesc('');
        setProbSampleIn('');
        setProbSampleOut('');
        setProbStarterPython('import sys\ndef main():\n    # Write your solution here\n    pass\nif __name__ == "__main__":\n    main()');
        setProbStarterCpp('#include <iostream>\nusing namespace std;\nint main() {\n    // Write your solution here\n    return 0;\n}');
        setProbStarterJava('public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}');
        setProbStarterC('#include <stdio.h>\nint main() {\n    // Write your solution here\n    return 0;\n}');
        setProbStarterJs('function solve() {\n    // Write your solution here\n}');
        setStarterTab('python');
        setProblemFormErrors({});
        setShowAddProblemModal(true);
    };

    const handleOpenEditProblemModal = (p: Problem) => {
        setEditingProblem(p);
        setProbTitle(p.title);
        setProbMethodName(p.methodName || '');
        setProbTypeSchema(p.typeSchema || '');
        setProbDiff(p.difficulty as Difficulty);
        setProbPoints(p.points);
        setProbTimeLimitMs(p.timeLimitMs || 1000);
        setProbMemoryLimitMb(p.memoryLimitMb || 256);
        setProbDesc(p.description);
        setProbSampleIn(p.sampleTestCases[0]?.input || '');
        setProbSampleOut(p.sampleTestCases[0]?.output || '');
        setProbStarterPython(p.starterTemplates?.python || '');
        setProbStarterCpp(p.starterTemplates?.cpp || '');
        setProbStarterJava(p.starterTemplates?.java || '');
        setProbStarterC(p.starterTemplates?.c || '');
        setProbStarterJs(p.starterTemplates?.javascript || '');
        setStarterTab('python');
        setProblemFormErrors({});
        setShowAddProblemModal(true);
    };

    const handleCreateCompetition = (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        const finalCode = newCode.toUpperCase().trim();
        const payload = {
            accessCode: finalCode,
            title: newTitle.trim(),
            subtitle: newSubtitle.trim(),
            durationMinutes: Number(newDuration),
        };

        // 1. Zod Validation
        const validationResult = createCompetitionSchema.safeParse(payload);
        if (!validationResult.success) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of validationResult.error.issues) {
                const fieldName = issue.path[0] as string;
                if (!fieldErrors[fieldName]) {
                    fieldErrors[fieldName] = issue.message;
                }
            }
            setFormErrors(fieldErrors);
            return;
        }

        // 2. Check for already existing access codes
        const codeExists = competitions.some(
            c => c.accessCode.toUpperCase() === finalCode.toUpperCase()
        );
        if (codeExists) {
            setFormErrors(prev => ({
                ...prev,
                accessCode: `Access code '${finalCode}' already exists. Please choose a different code.`,
            }));
            return;
        }

        const now = Date.now();
        const randSuffix = Math.random().toString(36).substring(2, 7);

        const newComp: Competition = {
            id: `comp-${now}-${randSuffix}`,
            accessCode: finalCode,
            title: newTitle.trim(),
            subtitle: newSubtitle.trim(),
            description: 'Custom competition created via Wecode Admin Portal.',
            startTime: new Date().toISOString(),
            durationMinutes: newDuration,
            isLive: true,
            isLeaderboardFrozen: false,
            problems: [
                {
                    id: `p-${now}-${randSuffix}`,
                    title: '1. Two Sum Target',
                    slug: 'two-sum-target',
                    methodName: 'twoSum',
                    typeSchema: '[i],i:[i]',
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
                        { id: `st-${now}-${randSuffix}`, input: '4 9\n2 7 11 15', output: '0 1' }
                    ],
                    testCases: [
                        { id: `t-${now}-${randSuffix}`, input: '4 9\n2 7 11 15', output: '0 1' }
                    ],
                    starterTemplates: {
                        python: `class Solution:\n    def reverseString(self, s: str) -> str:\n        `,
                        cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "0 1" << endl;\n    return 0;\n}`,
                        java: `public class Solution {\n    public static void main(String[] args) {\n        System.out.println("0 1");\n    }\n}`,
                        c: `#include <stdio.h>\nint main() {\n    printf("0 1\\n");\n    return 0;\n}`,
                        javascript: `console.log("0 1");`
                    }
                }
            ],
            announcements: [
                {
                    id: `ann-${now}-${randSuffix}`,
                    title: 'Contest Initialized',
                    text: `Welcome to ${newTitle.trim()}! Access Code is ${finalCode}.`,
                    timestamp: new Date().toISOString(),
                }
            ]
        };

        onAddCompetition(newComp);
        setSelectedCompCode(finalCode);
        setFormErrors({});
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

    const handleSaveProblem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeComp) return;
        setProblemFormErrors({});

        const payload = {
            title: probTitle.trim(),
            methodName: probMethodName.trim(),
            typeSchema: probTypeSchema.trim() || null,
            difficulty: probDiff,
            points: Number(probPoints),
            timeLimitMs: Number(probTimeLimitMs),
            memoryLimitMb: Number(probMemoryLimitMb),
            description: probDesc.trim(),
            sampleInput: probSampleIn.trim(),
            sampleOutput: probSampleOut.trim(),
        };

        const validationResult = problemSchema.safeParse(payload);
        if (!validationResult.success) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of validationResult.error.issues) {
                const fieldName = issue.path[0] as string;
                if (!fieldErrors[fieldName]) {
                    fieldErrors[fieldName] = issue.message;
                }
            }
            setProblemFormErrors(fieldErrors);
            return;
        }

        const now = Date.now();
        const randSuffix = Math.random().toString(36).substring(2, 7);

        if (editingProblem) {
            const updatedProb: Problem = {
                ...editingProblem,
                title: probTitle.trim(),
                slug: probTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                methodName: probMethodName.trim(),
                typeSchema: probTypeSchema.trim() || null,
                difficulty: probDiff,
                points: Number(probPoints),
                timeLimitMs: Number(probTimeLimitMs),
                memoryLimitMb: Number(probMemoryLimitMb),
                description: probDesc.trim(),
                sampleTestCases: [
                    {
                        id: editingProblem.sampleTestCases[0]?.id || `st-${now}-${randSuffix}`,
                        input: probSampleIn,
                        output: probSampleOut,
                    }
                ],
                testCases: [
                    {
                        id: editingProblem.testCases[0]?.id || `t-${now}-${randSuffix}`,
                        input: probSampleIn,
                        output: probSampleOut,
                    }
                ],
                starterTemplates: {
                    python: probStarterPython || `import sys\ndef main():\n    print("${probSampleOut.replace(/\n/g, '\\n')}")\nif __name__ == "__main__":\n    main()`,
                    cpp: probStarterCpp || `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "${probSampleOut.replace(/\n/g, '\\n')}" << endl;\n    return 0;\n}`,
                    java: probStarterJava || `public class Solution {\n    public static void main(String[] args) {\n        System.out.println("${probSampleOut.replace(/\n/g, '\\n')}");\n    }\n}`,
                    c: probStarterC || `#include <stdio.h>\nint main() {\n    printf("${probSampleOut.replace(/\n/g, '\\n')}\\n");\n    return 0;\n}`,
                    javascript: probStarterJs || `console.log("${probSampleOut.replace(/\n/g, '\\n')}");`
                }
            };

            if (onUpdateProblem) {
                await onUpdateProblem(updatedProb);
            } else {
                onUpdateCompetition({
                    ...activeComp,
                    problems: activeComp.problems.map(p => p.id === updatedProb.id ? updatedProb : p)
                });
            }
        } else {
            const newProb: Problem = {
                id: `p-${now}-${randSuffix}`,
                title: probTitle.trim(),
                slug: probTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                methodName: probMethodName.trim(),
                typeSchema: probTypeSchema.trim() || null,
                difficulty: probDiff,
                points: Number(probPoints),
                timeLimitMs: Number(probTimeLimitMs),
                memoryLimitMb: Number(probMemoryLimitMb),
                tags: ['Algorithm', 'Data Structure'],
                description: probDesc.trim(),
                inputFormat: 'Standard stdin format.',
                outputFormat: 'Standard stdout format.',
                constraints: [`Time Limit: ${Number(probTimeLimitMs) / 1000} second`],
                sampleTestCases: [
                    { id: `st-${now}-${randSuffix}`, input: probSampleIn, output: probSampleOut }
                ],
                testCases: [
                    { id: `t-${now}-${randSuffix}`, input: probSampleIn, output: probSampleOut }
                ],
                starterTemplates: {
                    python: probStarterPython || `import sys\ndef main():\n    print("${probSampleOut.replace(/\n/g, '\\n')}")\nif __name__ == "__main__":\n    main()`,
                    cpp: probStarterCpp || `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "${probSampleOut.replace(/\n/g, '\\n')}" << endl;\n    return 0;\n}`,
                    java: probStarterJava || `public class Solution {\n    public static void main(String[] args) {\n        System.out.println("${probSampleOut.replace(/\n/g, '\\n')}");\n    }\n}`,
                    c: probStarterC || `#include <stdio.h>\nint main() {\n    printf("${probSampleOut.replace(/\n/g, '\\n')}\\n");\n    return 0;\n}`,
                    javascript: probStarterJs || `console.log("${probSampleOut.replace(/\n/g, '\\n')}");`
                }
            };

            if (onAddProblem) {
                await onAddProblem(activeComp.id, newProb);
            } else {
                onUpdateCompetition({
                    ...activeComp,
                    problems: [...activeComp.problems, newProb]
                });
            }
        }

        setProblemFormErrors({});
        setShowAddProblemModal(false);
        setEditingProblem(null);
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
                        <ShieldCheck className="w-6 h-6 text-primary-400 stroke-[2.5]" />
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
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-zinc-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all"
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
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 font-mono font-bold text-primary-300 text-xs focus:outline-none focus:border-primary-500 cursor-pointer"
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
                            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${activeComp.isLive
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                }`}
                        >
                            {activeComp.isLive ? <Radio className="w-3.5 h-3.5 animate-pulse" /> : <Pause className="w-3.5 h-3.5" />}
                            <span>{activeComp.isLive ? 'CONTEST LIVE' : 'PAUSED'}</span>
                        </button>

                        <button
                            onClick={toggleFreeze}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${activeComp.isLeaderboardFrozen
                                ? 'bg-primary-500/20 border-primary-500 text-primary-300'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                }`}
                        >
                            {activeComp.isLeaderboardFrozen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            <span>{activeComp.isLeaderboardFrozen ? 'FROZEN' : 'FREEZE LEADERBOARD'}</span>
                        </button>

                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Delete Competition"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>DELETE</span>
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
                                    <span className="px-2.5 py-0.5 rounded bg-primary-500/10 border border-primary-500/20 font-mono text-xs font-bold text-primary-400">
                                        CODE: {activeComp.accessCode}
                                    </span>
                                    <h2 className="text-xl font-bold text-zinc-100 mt-2">{activeComp.title}</h2>
                                    <p className="text-xs text-zinc-400">{activeComp.subtitle}</p>
                                </div>

                                <div className="text-right font-mono text-xs text-zinc-400">
                                    <div>Duration: <strong className="text-primary-300">{activeComp.durationMinutes} mins</strong></div>
                                    <div>Problems: <strong className="text-primary-300">{activeComp.problems.length}</strong></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileCode className="w-5 h-5 text-primary-400" />
                                    <h3 className="text-base font-bold text-zinc-100">Contest Problem Set</h3>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/problems?comp=${encodeURIComponent(activeComp.accessCode)}`}
                                        className="px-3 py-1.5 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 font-bold text-xs flex items-center gap-1.5 transition-colors border border-primary-500/30 cursor-pointer"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        <span>Manage Problems Studio</span>
                                    </Link>
                                    <button
                                        onClick={handleOpenAddProblemModal}
                                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-primary-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-zinc-700/60 cursor-pointer"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        <span>Quick Add</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {activeComp.problems.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-zinc-500 font-mono">
                                        No problems added to this competition yet.
                                    </div>
                                ) : (
                                    activeComp.problems.map((p) => (
                                        <div
                                            key={p.id}
                                            className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4 text-xs font-mono"
                                        >
                                            <div>
                                                <div className="font-bold text-zinc-200 text-sm">
                                                    {p.title}
                                                </div>
                                                <div className="text-[10px] text-zinc-500 mt-0.5">
                                                    {p.points} Points • {p.difficulty} • Time: {p.timeLimitMs}ms{p.methodName ? ` • Method: ${p.methodName}` : ''}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px]">
                                                    {p.sampleTestCases.length} Samples
                                                </span>
                                                <button
                                                    onClick={() => handleOpenEditProblemModal(p)}
                                                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-primary-300 transition-colors border border-zinc-700/60 cursor-pointer"
                                                    title="Edit Problem"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingProblem(p)}
                                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/30 cursor-pointer"
                                                    title="Delete Problem"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>

                    <div className="space-y-6">

                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
                            <div className="flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-primary-400" />
                                <h3 className="text-base font-bold text-zinc-100">Broadcast Announcement</h3>
                            </div>
                            <p className="text-xs text-zinc-400">
                                Post live updates, clarifications, or timer alerts to all active participants in contest <strong className="text-primary-400 font-mono">{activeComp.accessCode}</strong>.
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
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-500"
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
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-500"
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
                                    className="w-full py-2.5 px-4 rounded-xl bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
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
                                            <div className="font-bold text-primary-300">{a.title}</div>
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
                <ModalPortal>
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
                    >
                        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                                    <KeyRound className="w-5 h-5 text-primary-400" />
                                    <span>Create New Competition</span>
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-zinc-400 hover:text-zinc-100 text-sm font-mono cursor-pointer p-1"
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
                                            onChange={(e) => {
                                                setNewCode(e.target.value.toUpperCase().slice(0, 6));
                                                setFormErrors(prev => ({ ...prev, accessCode: undefined }));
                                            }}
                                            placeholder="e.g. WEC2026"
                                            className={`flex-1 bg-zinc-950 border rounded-xl px-3.5 py-2 font-mono font-extrabold text-primary-300 text-sm tracking-widest uppercase focus:outline-none ${formErrors.accessCode
                                                ? 'border-rose-500 focus:border-rose-400'
                                                : 'border-zinc-800 focus:border-primary-500'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={generateRandom6Char}
                                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-mono transition-colors cursor-pointer"
                                        >
                                            Auto
                                        </button>
                                    </div>
                                    {formErrors.accessCode && (
                                        <p className="text-rose-400 text-[11px] font-mono font-medium flex items-center gap-1.5 mt-1.5">
                                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                            <span>{formErrors.accessCode}</span>
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-zinc-400 mb-1">
                                        Competition Title
                                    </label>
                                    <input
                                        type="text"
                                        value={newTitle}
                                        onChange={(e) => {
                                            setNewTitle(e.target.value);
                                            setFormErrors(prev => ({ ...prev, title: undefined }));
                                        }}
                                        className={`w-full bg-zinc-950 border rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none ${formErrors.title
                                            ? 'border-rose-500 focus:border-rose-400'
                                            : 'border-zinc-800 focus:border-primary-500'
                                            }`}
                                    />
                                    {formErrors.title && (
                                        <p className="text-rose-400 text-[11px] font-mono font-medium flex items-center gap-1.5 mt-1.5">
                                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                            <span>{formErrors.title}</span>
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-zinc-400 mb-1">
                                        Duration (Minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={newDuration}
                                        onChange={(e) => {
                                            setNewDuration(parseInt(e.target.value) || 0);
                                            setFormErrors(prev => ({ ...prev, durationMinutes: undefined }));
                                        }}
                                        min={10}
                                        max={600}
                                        className={`w-full bg-zinc-950 border rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none ${formErrors.durationMinutes
                                            ? 'border-rose-500 focus:border-rose-400'
                                            : 'border-zinc-800 focus:border-primary-500'
                                            }`}
                                    />
                                    {formErrors.durationMinutes && (
                                        <p className="text-rose-400 text-[11px] font-mono font-medium flex items-center gap-1.5 mt-1.5">
                                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                            <span>{formErrors.durationMinutes}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="pt-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormErrors({});
                                            setShowCreateModal(false);
                                        }}
                                        className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
                                    >
                                        Generate Contest
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* ADD / EDIT PROBLEM MODAL */}
            {showAddProblemModal && (
                <ModalPortal>
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setShowAddProblemModal(false);
                                setEditingProblem(null);
                                setProblemFormErrors({});
                            }
                        }}
                    >
                        <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                                    <FileCode className="w-5 h-5 text-primary-400" />
                                    <span>{editingProblem ? 'Edit Problem' : `Add Problem to [${activeComp?.accessCode}]`}</span>
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddProblemModal(false);
                                        setEditingProblem(null);
                                        setProblemFormErrors({});
                                    }}
                                    className="text-zinc-400 hover:text-zinc-100 text-sm font-mono cursor-pointer p-1"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSaveProblem} className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 mb-1">Problem Title</label>
                                        <input
                                            type="text"
                                            value={probTitle}
                                            onChange={(e) => {
                                                setProbTitle(e.target.value);
                                                setProblemFormErrors(prev => ({ ...prev, title: undefined }));
                                            }}
                                            placeholder="e.g. 5. Subarray Sum Equals K"
                                            className={`w-full bg-zinc-950 border rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none ${problemFormErrors.title ? 'border-rose-500' : 'border-zinc-800 focus:border-primary-500'
                                                }`}
                                        />
                                        {problemFormErrors.title && (
                                            <p className="text-rose-400 text-[11px] font-mono font-medium flex items-center gap-1 mt-1">
                                                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                                <span>{problemFormErrors.title}</span>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 mb-1">Method Name</label>
                                        <input
                                            type="text"
                                            value={probMethodName}
                                            onChange={(e) => {
                                                setProbMethodName(e.target.value);
                                                setProblemFormErrors(prev => ({ ...prev, methodName: undefined }));
                                            }}
                                            placeholder="e.g. twoSum or solve"
                                            className={`w-full bg-zinc-950 border rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none ${problemFormErrors.methodName ? 'border-rose-500' : 'border-zinc-800 focus:border-primary-500'
                                                }`}
                                        />
                                        {problemFormErrors.methodName && (
                                            <p className="text-rose-400 text-[11px] font-mono font-medium flex items-center gap-1 mt-1">
                                                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                                <span>{problemFormErrors.methodName}</span>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 mb-1">Type Schema (C/C++)</label>
                                        <input
                                            type="text"
                                            value={probTypeSchema}
                                            onChange={(e) => {
                                                setProbTypeSchema(e.target.value);
                                                setProblemFormErrors(prev => ({ ...prev, typeSchema: undefined }));
                                            }}
                                            placeholder="e.g. [i],i:[i] or i:i"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 mb-1">Difficulty</label>
                                        <select
                                            value={probDiff}
                                            onChange={(e) => setProbDiff(e.target.value as Difficulty)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-primary-300 focus:outline-none"
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
                                            onChange={(e) => {
                                                setProbPoints(parseInt(e.target.value) || 0);
                                                setProblemFormErrors(prev => ({ ...prev, points: undefined }));
                                            }}
                                            className={`w-full bg-zinc-950 border rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none ${problemFormErrors.points ? 'border-rose-500' : 'border-zinc-800 focus:border-primary-500'
                                                }`}
                                        />
                                        {problemFormErrors.points && (
                                            <p className="text-rose-400 text-[11px] font-mono font-medium flex items-center gap-1 mt-1">
                                                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                                <span>{problemFormErrors.points}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 mb-1">Time Limit (ms)</label>
                                        <input
                                            type="number"
                                            value={probTimeLimitMs}
                                            onChange={(e) => {
                                                setProbTimeLimitMs(parseInt(e.target.value) || 0);
                                                setProblemFormErrors(prev => ({ ...prev, timeLimitMs: undefined }));
                                            }}
                                            className={`w-full bg-zinc-950 border rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none ${problemFormErrors.timeLimitMs ? 'border-rose-500' : 'border-zinc-800 focus:border-primary-500'
                                                }`}
                                        />
                                        {problemFormErrors.timeLimitMs && (
                                            <p className="text-rose-400 text-[11px] font-mono font-medium flex items-center gap-1 mt-1">
                                                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                                <span>{problemFormErrors.timeLimitMs}</span>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 mb-1">Memory Limit (MB)</label>
                                        <input
                                            type="number"
                                            value={probMemoryLimitMb}
                                            onChange={(e) => {
                                                setProbMemoryLimitMb(parseInt(e.target.value) || 0);
                                                setProblemFormErrors(prev => ({ ...prev, memoryLimitMb: undefined }));
                                            }}
                                            className={`w-full bg-zinc-950 border rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none ${problemFormErrors.memoryLimitMb ? 'border-rose-500' : 'border-zinc-800 focus:border-primary-500'
                                                }`}
                                        />
                                        {problemFormErrors.memoryLimitMb && (
                                            <p className="text-rose-400 text-[11px] font-mono font-medium flex items-center gap-1 mt-1">
                                                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                                <span>{problemFormErrors.memoryLimitMb}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-zinc-400 mb-1">Description</label>
                                    <textarea
                                        value={probDesc}
                                        onChange={(e) => {
                                            setProbDesc(e.target.value);
                                            setProblemFormErrors(prev => ({ ...prev, description: undefined }));
                                        }}
                                        rows={3}
                                        placeholder="Enter problem statement and constraints..."
                                        className={`w-full bg-zinc-950 border rounded-xl p-3 text-xs text-zinc-100 focus:outline-none ${problemFormErrors.description ? 'border-rose-500' : 'border-zinc-800 focus:border-primary-500'
                                            }`}
                                    />
                                    {problemFormErrors.description && (
                                        <p className="text-rose-400 text-[11px] font-mono font-medium flex items-center gap-1 mt-1">
                                            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                            <span>{problemFormErrors.description}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 mb-1">Sample Input</label>
                                        <textarea
                                            value={probSampleIn}
                                            onChange={(e) => {
                                                setProbSampleIn(e.target.value);
                                                setProblemFormErrors(prev => ({ ...prev, sampleInput: undefined }));
                                            }}
                                            rows={2}
                                            className={`w-full bg-zinc-950 border rounded-xl p-2 text-xs font-mono text-primary-300 focus:outline-none ${problemFormErrors.sampleInput ? 'border-rose-500' : 'border-zinc-800'
                                                }`}
                                        />
                                        {problemFormErrors.sampleInput && (
                                            <p className="text-rose-400 text-[11px] font-mono font-medium flex items-center gap-1 mt-1">
                                                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                                <span>{problemFormErrors.sampleInput}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 mb-1">Sample Output</label>
                                        <textarea
                                            value={probSampleOut}
                                            onChange={(e) => {
                                                setProbSampleOut(e.target.value);
                                                setProblemFormErrors(prev => ({ ...prev, sampleOutput: undefined }));
                                            }}
                                            rows={2}
                                            className={`w-full bg-zinc-950 border rounded-xl p-2 text-xs font-mono text-emerald-300 focus:outline-none ${problemFormErrors.sampleOutput ? 'border-rose-500' : 'border-zinc-800'
                                                }`}
                                        />
                                        {problemFormErrors.sampleOutput && (
                                            <p className="text-rose-400 text-[11px] font-mono font-medium flex items-center gap-1 mt-1">
                                                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                                <span>{problemFormErrors.sampleOutput}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Starter Templates Editor */}
                                <div className="space-y-2 pt-1 border-t border-zinc-800/80">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-mono font-semibold text-zinc-300">
                                            Starter Code Templates
                                        </label>
                                        <span className="text-[10px] font-mono text-zinc-500">Provide initial boilerplate for participants</span>
                                    </div>

                                    <div className="flex border-b border-zinc-800 gap-1 overflow-x-auto">
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <button
                                                key={lang.id}
                                                type="button"
                                                onClick={() => setStarterTab(lang.id)}
                                                className={`px-3 py-1.5 text-xs font-mono rounded-t-lg transition-colors cursor-pointer capitalize ${starterTab === lang.id
                                                    ? 'bg-zinc-800 text-primary-400 font-bold border-t-2 border-primary-500'
                                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                                                    }`}
                                            >
                                                {lang.name}
                                            </button>
                                        ))}
                                    </div>

                                    {starterTab === 'python' && (
                                        <textarea
                                            value={probStarterPython}
                                            onChange={(e) => setProbStarterPython(e.target.value)}
                                            rows={5}
                                            placeholder="Python starter template..."
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-primary-500"
                                        />
                                    )}
                                    {starterTab === 'cpp' && (
                                        <textarea
                                            value={probStarterCpp}
                                            onChange={(e) => setProbStarterCpp(e.target.value)}
                                            rows={5}
                                            placeholder="C++ starter template..."
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-primary-500"
                                        />
                                    )}
                                    {starterTab === 'java' && (
                                        <textarea
                                            value={probStarterJava}
                                            onChange={(e) => setProbStarterJava(e.target.value)}
                                            rows={5}
                                            placeholder="Java starter template..."
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-primary-500"
                                        />
                                    )}
                                    {starterTab === 'c' && (
                                        <textarea
                                            value={probStarterC}
                                            onChange={(e) => setProbStarterC(e.target.value)}
                                            rows={5}
                                            placeholder="C starter template..."
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-primary-500"
                                        />
                                    )}
                                    {starterTab === 'javascript' && (
                                        <textarea
                                            value={probStarterJs}
                                            onChange={(e) => setProbStarterJs(e.target.value)}
                                            rows={5}
                                            placeholder="JavaScript starter template..."
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-primary-500"
                                        />
                                    )}
                                </div>

                                <div className="pt-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddProblemModal(false);
                                            setEditingProblem(null);
                                            setProblemFormErrors({});
                                        }}
                                        className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2 rounded-xl bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
                                    >
                                        {editingProblem ? 'Update Problem' : 'Save Problem'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* DELETE COMPETITION MODAL */}
            {showDeleteModal && activeComp && (
                <ModalPortal>
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
                    >
                        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
                            <div className="flex items-center gap-3 text-rose-400 border-b border-zinc-800 pb-3">
                                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                                <h3 className="text-lg font-bold text-zinc-100">Delete Competition</h3>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                                Are you sure you want to permanently delete <strong className="text-primary-300">{activeComp.title}</strong> (Access Code: <span className="font-mono text-primary-400 font-bold">{activeComp.accessCode}</span>)?
                            </p>
                            <p className="text-[11px] text-zinc-500">
                                This action will remove all problems, test cases, announcements, and submissions associated with this competition from the database. This action cannot be undone.
                            </p>
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const codeToDelete = activeComp.accessCode;
                                        const remainingComps = competitions.filter(c => c.accessCode !== codeToDelete);
                                        onDeleteCompetition(codeToDelete);
                                        setSelectedCompCode(remainingComps[0]?.accessCode || '');
                                        setShowDeleteModal(false);
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Confirm Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* DELETE PROBLEM MODAL */}
            {deletingProblem && (
                <ModalPortal>
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
                        onClick={(e) => { if (e.target === e.currentTarget) setDeletingProblem(null); }}
                    >
                        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
                            <div className="flex items-center gap-3 text-rose-400 border-b border-zinc-800 pb-3">
                                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                                <h3 className="text-lg font-bold text-zinc-100">Delete Problem</h3>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                                Are you sure you want to delete problem <strong className="text-primary-300">{deletingProblem.title}</strong>?
                            </p>
                            <p className="text-[11px] text-zinc-500">
                                This action will remove all test cases and submissions associated with this problem. This action cannot be undone.
                            </p>
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDeletingProblem(null)}
                                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const probId = deletingProblem.id;
                                        setDeletingProblem(null);
                                        if (onDeleteProblem) {
                                            await onDeleteProblem(probId);
                                        } else if (activeComp) {
                                            onUpdateCompetition({
                                                ...activeComp,
                                                problems: activeComp.problems.filter(p => p.id !== probId),
                                            });
                                        }
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Confirm Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

        </div>
    );
};
