'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    Copy,
    Search,
    Code2,
    FileCode,
    Clock,
    HardDrive,
    Check,
    AlertCircle,
    X,
    Layers
} from 'lucide-react';
import { useCompetition } from '@/context/CompetitionContext';
import type { Problem, Difficulty } from '@/context/CompetitionContext';
import { useSelectedCompetition } from '@/hooks/useSelectedCompetition';
import { authClient } from '@/lib/auth-client';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { ModalPortal } from '@/components/ModalPortal';
import { Input } from '@/components/ui/input';

export function AdminProblemsManager() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { competitions, addProblem, deleteProblem } = useCompetition();
    const { data: session, isPending: sessionPending } = authClient.useSession();
    const [selectedCompCode, setSelectedCompCode] = useSelectedCompetition(searchParams);

    const activeComp = useMemo(() => {
        const targetCode = selectedCompCode || searchParams.get('comp') || '';
        if (targetCode) {
            const found = competitions.find(
                c => c.accessCode.toUpperCase() === targetCode.toUpperCase() || c.id === targetCode
            );
            if (found) return found;
        }
        return competitions[0];
    }, [competitions, selectedCompCode, searchParams]);

    const handleSelectCompChange = (newCode: string) => {
        setSelectedCompCode(newCode);
        router.replace(`/admin/problems?comp=${encodeURIComponent(newCode)}`);
    };

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
    const [sortBy, setSortBy] = useState<'title' | 'points' | 'difficulty'>('points');

    // Toast notification state
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Delete Modal state
    const [deletingProblem, setDeletingProblem] = useState<Problem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleOpenAddPage = () => {
        router.push(`/admin/problems/create?comp=${encodeURIComponent(selectedCompCode)}`);
    };

    const handleOpenEditPage = (p: Problem) => {
        router.push(`/admin/problems/create?comp=${encodeURIComponent(selectedCompCode)}&edit=${encodeURIComponent(p.id)}`);
    };

    const handleDuplicateProblem = async (p: Problem) => {
        if (!activeComp) return;
        const now = Date.now();
        const rand = Math.random().toString(36).substring(2, 7);
        const dupProblem: Problem = {
            ...p,
            id: `p-${now}-${rand}`,
            title: `${p.title} (Copy)`,
            slug: `${p.slug || 'problem'}-copy-${rand}`,
            sampleTestCases: (p.sampleTestCases || []).map((st, i) => ({ ...st, id: `st-${now}-${i}` })),
            testCases: (p.testCases || []).map((tc, i) => ({ ...tc, id: `tc-${now}-${i}` })),
        };
        try {
            await addProblem(activeComp.id, dupProblem);
            showToast(`Problem "${dupProblem.title}" duplicated successfully!`);
        } catch (err: any) {
            showToast(err?.message || 'Failed to duplicate problem', 'error');
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingProblem) return;
        setIsDeleting(true);
        try {
            await deleteProblem(deletingProblem.id);
            showToast(`Problem "${deletingProblem.title}" deleted.`);
            setDeletingProblem(null);
        } catch (err: any) {
            showToast(err?.message || 'Failed to delete problem', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter problems
    const filteredProblems = useMemo(() => {
        if (!activeComp || !activeComp.problems) return [];

        return activeComp.problems
            .filter(p => {
                const matchesSearch =
                    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.slug && p.slug.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (p.methodName && p.methodName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

                const matchesDiff =
                    selectedDifficulty === 'All' ||
                    p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

                return matchesSearch && matchesDiff;
            })
            .sort((a, b) => {
                if (sortBy === 'points') return b.points - a.points;
                if (sortBy === 'title') return a.title.localeCompare(b.title);
                if (sortBy === 'difficulty') {
                    const diffOrder = { Easy: 1, Medium: 2, Hard: 3 };
                    return (diffOrder[a.difficulty as Difficulty] || 0) - (diffOrder[b.difficulty as Difficulty] || 0);
                }
                return 0;
            });
    }, [activeComp, searchQuery, selectedDifficulty, sortBy]);

    if (sessionPending) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-mono text-zinc-400">Verifying Admin Session...</p>
                </div>
            </div>
        );
    }

    if (!session?.user) {
        return <AdminLoginForm />;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20 selection:bg-primary-500/30">
            {/* Ambient Background Glow */}
            <div className="fixed top-0 left-1/4 w-[600px] h-[300px] bg-primary-600/10 blur-[140px] pointer-events-none rounded-full" />
            <div className="fixed top-1/3 right-10 w-[500px] h-[300px] bg-amber-500/5 blur-[150px] pointer-events-none rounded-full" />

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-6 right-6 z-50 animate-fadeIn">
                    <div className={`px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 text-sm font-medium ${
                        toastMessage.type === 'success'
                            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-950/90 border-rose-500/30 text-rose-300'
                    }`}>
                        {toastMessage.type === 'success' ? <Check className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
                        <span>{toastMessage.text}</span>
                    </div>
                </div>
            )}

            {/* Header Navigation */}
            <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-800/80 px-4 sm:px-8 py-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/admin')}
                            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-all cursor-pointer group"
                            title="Back to Admin Dashboard"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-mono font-bold uppercase tracking-wider">
                                    Problem Studio
                                </span>
                                <span className="text-xs font-mono text-zinc-500">|</span>
                                <span className="text-xs font-mono text-zinc-400">CRUD Management</span>
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-zinc-100 mt-0.5 flex items-center gap-2">
                                Contest Problems Manager
                            </h1>
                        </div>
                    </div>

                    {/* Competition Selector & Add Action */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                value={selectedCompCode}
                                onChange={e => handleSelectCompChange(e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-sm font-semibold rounded-xl px-4 py-2.5 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer shadow-inner"
                            >
                                {competitions.map(c => (
                                    <option key={c.accessCode} value={c.accessCode} className="bg-zinc-900 text-zinc-100">
                                        🏆 {c.title} ({c.accessCode})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                ▼
                            </div>
                        </div>

                        <button
                            onClick={handleOpenAddPage}
                            disabled={!activeComp}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-zinc-950 font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>Add Problem</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
                {/* Active Contest Banner / Summary Stats */}
                {activeComp ? (
                    <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">Selected Contest</span>
                                <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-xs font-mono text-primary-400 font-bold">
                                    {activeComp.accessCode}
                                </span>
                            </div>
                            <h2 className="text-xl font-black text-zinc-100">{activeComp.title}</h2>
                            <p className="text-xs text-zinc-400">{activeComp.subtitle || 'Wecode Contest Problem Suite'}</p>
                        </div>

                        {/* Stat Pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="px-4 py-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 flex flex-col justify-center">
                                <span className="text-xs font-mono text-zinc-500 uppercase font-bold">Total Problems</span>
                                <span className="text-xl font-black text-zinc-100">{activeComp.problems?.length || 0}</span>
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 flex flex-col justify-center">
                                <span className="text-xs font-mono text-emerald-400 uppercase font-bold">Easy / Med / Hard</span>
                                <span className="text-sm font-bold text-zinc-200">
                                    {activeComp.problems?.filter(p => p.difficulty === 'Easy').length || 0} /{' '}
                                    {activeComp.problems?.filter(p => p.difficulty === 'Medium').length || 0} /{' '}
                                    {activeComp.problems?.filter(p => p.difficulty === 'Hard').length || 0}
                                </span>
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 flex flex-col justify-center">
                                <span className="text-xs font-mono text-amber-400 uppercase font-bold">Total Points</span>
                                <span className="text-xl font-black text-zinc-100">
                                    {activeComp.problems?.reduce((sum, p) => sum + (p.points || 0), 0) || 0} pts
                                </span>
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 flex flex-col justify-center">
                                <span className="text-xs font-mono text-primary-400 uppercase font-bold">Duration</span>
                                <span className="text-sm font-bold text-zinc-200">{activeComp.durationMinutes} mins</span>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-md">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <Input
                            type="text"
                            placeholder="Search problems by title, tag, or method..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10 pr-8 py-2 text-sm bg-zinc-950/80 border-zinc-800 rounded-xl focus:ring-primary-500/50"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs & Sorting */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800">
                            {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
                                <button
                                    key={diff}
                                    onClick={() => setSelectedDifficulty(diff)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        selectedDifficulty === diff
                                            ? 'bg-zinc-800 text-zinc-100 shadow'
                                            : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                >
                                    {diff}
                                </button>
                            ))}
                        </div>

                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            className="bg-zinc-950 border border-zinc-800 text-xs font-semibold rounded-xl px-3 py-2 text-zinc-300 focus:outline-none cursor-pointer"
                        >
                            <option value="points">Sort by Points</option>
                            <option value="difficulty">Sort by Difficulty</option>
                            <option value="title">Sort by Title</option>
                        </select>
                    </div>
                </div>

                {/* Problems List Grid */}
                {filteredProblems.length === 0 ? (
                    <div className="p-16 text-center rounded-3xl bg-zinc-900/30 border border-zinc-800/50 space-y-4">
                        <div className="inline-flex p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500">
                            <FileCode className="w-8 h-8 stroke-[1.5]" />
                        </div>
                        <h3 className="text-lg font-extrabold text-zinc-300">No Problems Found</h3>
                        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                            {searchQuery || selectedDifficulty !== 'All'
                                ? 'No problems matched your current search or difficulty filter.'
                                : 'There are no problems configured for this contest yet. Click "Add Problem" to create your first problem.'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); setSelectedDifficulty('All'); }}
                                className="text-xs text-primary-400 hover:underline font-semibold"
                            >
                                Clear search filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredProblems.map((p, idx) => (
                            <div
                                key={p.id}
                                className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700/80 transition-all backdrop-blur-xl group hover:shadow-xl hover:shadow-primary-500/5 flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                                <div className="space-y-3 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-mono text-zinc-500 font-bold">#{idx + 1}</span>
                                        <h3 className="text-lg font-black text-zinc-100 group-hover:text-primary-300 transition-colors">
                                            {p.title}
                                        </h3>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                                p.difficulty === 'Easy'
                                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                                    : p.difficulty === 'Medium'
                                                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                                                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                            }`}
                                        >
                                            {p.difficulty}
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-primary-400 font-bold">
                                            {p.points} Points
                                        </span>
                                    </div>

                                    {/* Sub-info metadata */}
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-zinc-400">
                                        <div className="flex items-center gap-1.5">
                                            <Code2 className="w-3.5 h-3.5 text-zinc-500" />
                                            <span>Method: <strong className="text-zinc-200 font-semibold">{p.methodName || 'solve'}</strong></span>
                                        </div>
                                        {p.typeSchema && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-zinc-500">Schema:</span>
                                                <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
                                                    {p.typeSchema}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                            <span>{p.timeLimitMs || 1000}ms</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                                            <span>{p.memoryLimitMb || 256}MB</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Layers className="w-3.5 h-3.5 text-zinc-500" />
                                            <span>{p.sampleTestCases?.length || 0} sample / {p.testCases?.length || 0} test cases</span>
                                        </div>
                                    </div>

                                    {/* Description Snippet */}
                                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                        {p.description}
                                    </p>

                                    {/* Tags */}
                                    {p.tags && p.tags.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                            {p.tags.map((t, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-md bg-zinc-800/60 border border-zinc-700/60 text-[10px] text-zinc-400">
                                                    #{t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                    <button
                                        onClick={() => handleOpenEditPage(p)}
                                        className="px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all hover:text-white cursor-pointer"
                                        title="Edit Problem Details"
                                    >
                                        <Pencil className="w-3.5 h-3.5 text-primary-400" />
                                        <span>Edit</span>
                                    </button>

                                    <button
                                        onClick={() => handleDuplicateProblem(p)}
                                        className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                                        title="Duplicate Problem"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        onClick={() => setDeletingProblem(p)}
                                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                                        title="Delete Problem"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* DELETE PROBLEM CONFIRMATION MODAL */}
            {deletingProblem && (
                <ModalPortal>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fadeIn">
                        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-2xl">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                    <AlertCircle className="w-6 h-6 stroke-[2]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-zinc-100">Delete Problem?</h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">This action cannot be undone.</p>
                                </div>
                            </div>

                            <p className="text-xs text-zinc-300 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                                Are you sure you want to delete <strong className="text-rose-300 font-bold">{deletingProblem.title}</strong> from competition <span className="font-mono text-primary-400">{activeComp?.accessCode}</span>?
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setDeletingProblem(null)}
                                    disabled={isDeleting}
                                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={isDeleting}
                                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20"
                                >
                                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}
