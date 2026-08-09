'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    Plus,
    Check,
    AlertCircle,
    X,
    Code2,
    FileCode,
    Clock,
    HardDrive,
    Sparkles,
    ListOrdered,
    Trash2,
    Save,
    RotateCcw,
    FolderOpen,
    Upload,
    FileCheck,
    FileText
} from 'lucide-react';
import { useCompetition } from '@/context/CompetitionContext';
import type { Problem, Difficulty, SampleTestCase, TestCase } from '@/context/CompetitionContext';
import { useSelectedCompetition } from '@/hooks/useSelectedCompetition';
import { authClient } from '@/lib/auth-client';
import { problemSchema } from '@/lib/validations';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { Input } from '@/components/ui/input';

export function AdminProblemForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const compCodeFromUrl = searchParams.get('comp') || '';
    const editProblemId = searchParams.get('edit') || '';

    const { data: session, isPending: sessionPending } = authClient.useSession();
    const { competitions, addProblem, updateProblem } = useCompetition();

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

    const editingProblem = useMemo(() => {
        if (!editProblemId || !activeComp) return null;
        return activeComp.problems.find(p => p.id === editProblemId) || null;
    }, [activeComp, editProblemId]);

    // Form fields
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [methodName, setMethodName] = useState('solve');
    const [typeSchema, setTypeSchema] = useState('[i],i:i');
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
    const [points, setPoints] = useState(100);
    const [timeLimitMs, setTimeLimitMs] = useState(1000);
    const [memoryLimitMb, setMemoryLimitMb] = useState(256);
    const [description, setDescription] = useState('');
    const [inputFormat, setInputFormat] = useState('');
    const [outputFormat, setOutputFormat] = useState('');
    const [constraintsText, setConstraintsText] = useState('1 <= N <= 10^5');
    const [tagsText, setTagsText] = useState('Array, Algorithms');

    // Test Case Data Source Integration (code_tests folder)
    const [existingTestFiles, setExistingTestFiles] = useState<string[]>([]);
    const [selectedExistingFile, setSelectedExistingFile] = useState<string>('');
    const [manualFileName, setManualFileName] = useState<string>('');
    const [uploadingFile, setUploadingFile] = useState(false);
    const [attachedTestFile, setAttachedTestFile] = useState<string | null>(null);

    // Test cases
    const [sampleTestCases, setSampleTestCases] = useState<Array<{ id: string; input: string; output: string; explanation: string }>>([
        { id: 'st-1', input: '3\n1 2 3', output: '6', explanation: 'Sum of 1+2+3 = 6' }
    ]);
    const [hiddenTestCases, setHiddenTestCases] = useState<Array<{ id: string; input: string; output: string; hidden: boolean }>>([
        { id: 'tc-1', input: '3\n1 2 3', output: '6', hidden: false },
        { id: 'tc-2', input: '5\n10 20 30 40 50', output: '150', hidden: true }
    ]);

    // Starter templates
    const [starterLangTab, setStarterLangTab] = useState<'python' | 'cpp' | 'java' | 'c' | 'javascript'>('python');
    const [starterPython, setStarterPython] = useState('class Solution:\n    def solve(self, nums: List[int], target: int) -> int:\n        # Write your solution here\n        pass');
    const [starterCpp, setStarterCpp] = useState('#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int solve(vector<int>& nums, int target) {\n        // Write your solution here\n        return 0;\n    }\n};');
    const [starterJava, setStarterJava] = useState('import java.util.*;\n\npublic class Solution {\n    public int solve(int[] nums, int target) {\n        // Write your solution here\n        return 0;\n    }\n}');
    const [starterC, setStarterC] = useState('#include <stdio.h>\n#include <stdlib.h>\n\nint solve(int* nums, int numsSize, int target) {\n    // Write your solution here\n    return 0;\n}');
    const [starterJs, setStarterJs] = useState('function solve(nums, target) {\n    // Write your solution here\n    return 0;\n}');

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Fetch existing test files from code_tests folder
    useEffect(() => {
        fetch('/api/test-files')
            .then(res => res.json())
            .then(data => {
                if (data.files && Array.isArray(data.files)) {
                    setExistingTestFiles(data.files);
                }
            })
            .catch(err => console.error('Failed to fetch existing test files:', err));
    }, []);

    // Fill form if editing
    useEffect(() => {
        if (editingProblem) {
            setTitle(editingProblem.title);
            setSlug(editingProblem.slug || '');
            setMethodName(editingProblem.methodName || 'solve');
            setTypeSchema(editingProblem.typeSchema || '');
            setDifficulty((editingProblem.difficulty as Difficulty) || 'Easy');
            setPoints(editingProblem.points || 100);
            setTimeLimitMs(editingProblem.timeLimitMs || 1000);
            setMemoryLimitMb(editingProblem.memoryLimitMb || 256);
            setDescription(editingProblem.description || '');
            setInputFormat(editingProblem.inputFormat || '');
            setOutputFormat(editingProblem.outputFormat || '');
            setConstraintsText(Array.isArray(editingProblem.constraints) ? editingProblem.constraints.join('\n') : '');
            setTagsText(Array.isArray(editingProblem.tags) ? editingProblem.tags.join(', ') : '');

            setSampleTestCases(
                (editingProblem.sampleTestCases || []).length > 0
                    ? editingProblem.sampleTestCases.map((st, i) => ({
                        id: st.id || `st-${i}`,
                        input: st.input || '',
                        output: st.output || '',
                        explanation: st.explanation || ''
                    }))
                    : [{ id: 'st-1', input: '', output: '', explanation: '' }]
            );

            setHiddenTestCases(
                (editingProblem.testCases || []).length > 0
                    ? editingProblem.testCases.map((tc, i) => ({
                        id: tc.id || `tc-${i}`,
                        input: tc.input || '',
                        output: tc.output || '',
                        hidden: tc.hidden ?? true
                    }))
                    : [{ id: 'tc-1', input: '', output: '', hidden: true }]
            );

            setStarterPython(editingProblem.starterTemplates?.python || '');
            setStarterCpp(editingProblem.starterTemplates?.cpp || '');
            setStarterJava(editingProblem.starterTemplates?.java || '');
            setStarterC(editingProblem.starterTemplates?.c || '');
            setStarterJs(editingProblem.starterTemplates?.javascript || '');
        }
    }, [editingProblem]);

    // Auto-generate slug from title
    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        if (!editingProblem) {
            const autoSlug = newTitle
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            setSlug(autoSlug);
        }
    };

    // Load existing test file from code_tests directory
    const handleLoadExistingFile = async (fileNameToLoad: string) => {
        if (!fileNameToLoad) return;
        try {
            const res = await fetch(`/api/test-files?file=${encodeURIComponent(fileNameToLoad)}`);
            if (!res.ok) {
                const err = await res.json();
                setToastMessage({ text: err.error || 'Failed to load file', type: 'error' });
                return;
            }
            const data = await res.json();
            if (data.sampleTestCases && data.sampleTestCases.length > 0) {
                setSampleTestCases(data.sampleTestCases);
            }
            if (data.hiddenTestCases && data.hiddenTestCases.length > 0) {
                setHiddenTestCases(data.hiddenTestCases);
            }
            setAttachedTestFile(`code_tests/${data.filename} (${data.count} test cases loaded)`);
            setToastMessage({ text: `Loaded code_tests/${data.filename} with ${data.count} test cases!`, type: 'success' });
            setTimeout(() => setToastMessage(null), 3500);
        } catch (e: any) {
            setToastMessage({ text: e?.message || 'Error loading test file', type: 'error' });
        }
    };

    // Upload local file to code_tests directory
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/test-files', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                setToastMessage({ text: err.error || 'Upload failed', type: 'error' });
                return;
            }

            const data = await res.json();
            if (data.sampleTestCases && data.sampleTestCases.length > 0) {
                setSampleTestCases(data.sampleTestCases);
            }
            if (data.hiddenTestCases && data.hiddenTestCases.length > 0) {
                setHiddenTestCases(data.hiddenTestCases);
            }

            setAttachedTestFile(`code_tests/${data.filename} (${data.count} test cases uploaded & loaded)`);
            setExistingTestFiles(prev => prev.includes(data.filename) ? prev : [...prev, data.filename]);
            setSelectedExistingFile(data.filename);

            setToastMessage({ text: `File saved to code_tests/${data.filename}! Loaded ${data.count} test cases.`, type: 'success' });
            setTimeout(() => setToastMessage(null), 3500);
        } catch (e: any) {
            setToastMessage({ text: e?.message || 'Error uploading file', type: 'error' });
        } finally {
            setUploadingFile(false);
        }
    };

    const generateBoilerplate = () => {
        const m = methodName.trim() || 'solve';
        setStarterPython(`class Solution:\n    def ${m}(self, *args):\n        # Write your code here\n        pass`);
        setStarterCpp(`#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    int ${m}() {\n        // Write your code here\n        return 0;\n    }\n};`);
        setStarterJava(`import java.util.*;\n\npublic class Solution {\n    public int ${m}() {\n        // Write your code here\n        return 0;\n    }\n}`);
        setStarterC(`#include <stdio.h>\n#include <stdlib.h>\n\nint ${m}() {\n    // Write your code here\n    return 0;\n}`);
        setStarterJs(`function ${m}() {\n    // Write your code here\n    return 0;\n}`);
        setToastMessage({ text: 'Generated standard boilerplate for all languages!', type: 'success' });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleSaveProblem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeComp) return;
        setFormErrors({});

        const trimmedTitle = title.trim();
        const trimmedSlug = slug.trim() || trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const trimmedMethod = methodName.trim() || 'solve';
        const sampleIn = sampleTestCases[0]?.input.trim() || '';
        const sampleOut = sampleTestCases[0]?.output.trim() || '';

        const payload = {
            title: trimmedTitle,
            methodName: trimmedMethod,
            typeSchema: typeSchema.trim() || null,
            difficulty,
            points: Number(points),
            timeLimitMs: Number(timeLimitMs),
            memoryLimitMb: Number(memoryLimitMb),
            description: description.trim(),
            sampleInput: sampleIn,
            sampleOutput: sampleOut,
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
            setFormErrors(fieldErrors);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsSaving(true);
        const now = Date.now();
        const rand = Math.random().toString(36).substring(2, 7);

        const constraintsList = constraintsText
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean);

        const tagsList = tagsText
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        const finalSampleTCs: SampleTestCase[] = sampleTestCases
            .filter(st => st.input.trim() || st.output.trim())
            .map((st, i) => ({
                id: st.id && st.id.length > 5 ? st.id : `st-${now}-${i}`,
                input: st.input.trim(),
                output: st.output.trim(),
                explanation: st.explanation.trim() || null,
            }));

        const finalHiddenTCs: TestCase[] = hiddenTestCases
            .filter(tc => tc.input.trim() || tc.output.trim())
            .map((tc, i) => ({
                id: tc.id && tc.id.length > 5 ? tc.id : `tc-${now}-${i}`,
                input: tc.input.trim(),
                output: tc.output.trim(),
                hidden: tc.hidden ?? true,
            }));

        const problemData: Problem = {
            id: editingProblem ? editingProblem.id : `p-${now}-${rand}`,
            title: trimmedTitle,
            slug: trimmedSlug,
            methodName: trimmedMethod,
            typeSchema: typeSchema.trim() || null,
            difficulty,
            points: Number(points),
            timeLimitMs: Number(timeLimitMs),
            memoryLimitMb: Number(memoryLimitMb),
            description: description.trim(),
            inputFormat: inputFormat.trim(),
            outputFormat: outputFormat.trim(),
            constraints: constraintsList,
            tags: tagsList,
            sampleTestCases: finalSampleTCs,
            testCases: finalHiddenTCs,
            starterTemplates: {
                python: starterPython,
                cpp: starterCpp,
                java: starterJava,
                c: starterC,
                javascript: starterJs,
            },
            competitionId: activeComp.id,
        };

        try {
            if (editingProblem) {
                await updateProblem(problemData);
            } else {
                await addProblem(activeComp.id, problemData);
            }
            router.push(`/admin/problems?comp=${activeComp.accessCode}`);
        } catch (err: any) {
            setToastMessage({ text: err?.message || 'Failed to save problem', type: 'error' });
            setTimeout(() => setToastMessage(null), 3500);
        } finally {
            setIsSaving(false);
        }
    };

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
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-24 selection:bg-primary-500/30">
            {/* Ambient Background Glow */}
            <div className="fixed top-0 left-1/3 w-[700px] h-[350px] bg-primary-600/10 blur-[150px] pointer-events-none rounded-full" />

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

            {/* Top Navigation Header */}
            <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-800/80 px-4 sm:px-8 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => router.push(`/admin/problems?comp=${selectedCompCode}`)}
                            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-all cursor-pointer group"
                            title="Back to Problems Manager"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-mono font-bold uppercase tracking-wider">
                                    {editingProblem ? 'Problem Editor' : 'Problem Creator'}
                                </span>
                                <span className="text-xs font-mono text-zinc-500">|</span>
                                <span className="text-xs font-mono text-zinc-400">
                                    Contest: <strong className="text-primary-300">{activeComp?.title || selectedCompCode}</strong>
                                </span>
                            </div>
                            <h1 className="text-xl font-black tracking-tight text-zinc-100 mt-0.5">
                                {editingProblem ? `Editing: ${editingProblem.title}` : 'Create New Contest Problem'}
                            </h1>
                        </div>
                    </div>

                    {/* Top Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.push(`/admin/problems?comp=${selectedCompCode}`)}
                            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSaveProblem}
                            disabled={isSaving}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-zinc-950 font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSaving ? 'Publishing...' : editingProblem ? 'Save Changes' : 'Create Problem'}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Form Container */}
            <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8">
                <form onSubmit={handleSaveProblem} className="space-y-8">
                    {/* SECTION 1: CONTEST & CORE METADATA */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl space-y-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-400">
                                    <Code2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-zinc-100">1. Core Specification & Parameters</h2>
                                    <p className="text-xs text-zinc-400">Set title, target method name, type schema, and score constraints.</p>
                                </div>
                            </div>

                            {/* Contest Selection */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-zinc-400">Contest:</span>
                                <select
                                    value={selectedCompCode}
                                    onChange={e => setSelectedCompCode(e.target.value)}
                                    className="bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-primary-300 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                                >
                                    {competitions.map(c => (
                                        <option key={c.accessCode} value={c.accessCode}>
                                            {c.title} ({c.accessCode})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Title & Slug */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1.5 uppercase">
                                    Problem Title *
                                </label>
                                <Input
                                    type="text"
                                    value={title}
                                    onChange={e => handleTitleChange(e.target.value)}
                                    placeholder="e.g. 1. Two Sum Target"
                                    className="py-3"
                                    required
                                />
                                {formErrors.title && <p className="text-xs text-rose-400 mt-1">{formErrors.title}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1.5 uppercase">
                                    URL Slug
                                </label>
                                <Input
                                    type="text"
                                    value={slug}
                                    onChange={e => setSlug(e.target.value)}
                                    placeholder="two-sum-target"
                                    className="font-mono text-xs py-3"
                                />
                            </div>
                        </div>

                        {/* Method Name & Type Schema & Difficulty */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1.5 uppercase">
                                    Method Name *
                                </label>
                                <Input
                                    type="text"
                                    value={methodName}
                                    onChange={e => setMethodName(e.target.value)}
                                    placeholder="solve or twoSum"
                                    className="font-mono text-xs py-3"
                                    required
                                />
                                {formErrors.methodName && <p className="text-xs text-rose-400 mt-1">{formErrors.methodName}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1.5 uppercase">
                                    Type Schema (C Driver protocol)
                                </label>
                                <Input
                                    type="text"
                                    value={typeSchema}
                                    onChange={e => setTypeSchema(e.target.value)}
                                    placeholder="[i],i:[i]"
                                    className="font-mono text-xs py-3"
                                />
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    <span className="text-[10px] text-zinc-500 font-mono">Presets:</span>
                                    {['[i],i:[i]', '[i]:i', 's:s', '[s]:[s]'].map(preset => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setTypeSchema(preset)}
                                            className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-primary-300 transition-colors"
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1.5 uppercase">
                                    Difficulty *
                                </label>
                                <select
                                    value={difficulty}
                                    onChange={e => setDifficulty(e.target.value as Difficulty)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                >
                                    <option value="Easy">Easy (Green)</option>
                                    <option value="Medium">Medium (Amber)</option>
                                    <option value="Hard">Hard (Rose)</option>
                                </select>
                            </div>
                        </div>

                        {/* Points, Time & Memory Limits */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1.5 uppercase">
                                    Points Awarded *
                                </label>
                                <Input
                                    type="number"
                                    value={points}
                                    onChange={e => setPoints(Number(e.target.value))}
                                    min={1}
                                    max={2000}
                                    className="py-3"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1.5 uppercase">
                                    Time Limit (ms)
                                </label>
                                <Input
                                    type="number"
                                    value={timeLimitMs}
                                    onChange={e => setTimeLimitMs(Number(e.target.value))}
                                    min={100}
                                    max={10000}
                                    className="py-3"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1.5 uppercase">
                                    Memory Limit (MB)
                                </label>
                                <Input
                                    type="number"
                                    value={memoryLimitMb}
                                    onChange={e => setMemoryLimitMb(Number(e.target.value))}
                                    min={16}
                                    max={2048}
                                    className="py-3"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: PROBLEM STATEMENT & FORMATTING */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl space-y-6 shadow-xl">
                        <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
                            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                <FileCode className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-zinc-100">2. Statement & Format Instructions</h2>
                                <p className="text-xs text-zinc-400">Provide description, input/output guidelines, constraints, and tags.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-mono font-bold text-zinc-400 mb-1.5 uppercase">
                                Detailed Problem Description *
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={6}
                                placeholder="Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 leading-relaxed font-sans"
                                required
                            />
                            {formErrors.description && <p className="text-xs text-rose-400 mt-1">{formErrors.description}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1.5 uppercase">
                                    Input Format Description
                                </label>
                                <textarea
                                    value={inputFormat}
                                    onChange={e => setInputFormat(e.target.value)}
                                    rows={3}
                                    placeholder="Line 1: N and Target. Line 2: N space-separated integers."
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1.5 uppercase">
                                    Output Format Description
                                </label>
                                <textarea
                                    value={outputFormat}
                                    onChange={e => setOutputFormat(e.target.value)}
                                    rows={3}
                                    placeholder="Print the 0-indexed indices of the two numbers."
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1.5 uppercase">
                                    Constraints (One per line)
                                </label>
                                <textarea
                                    value={constraintsText}
                                    onChange={e => setConstraintsText(e.target.value)}
                                    rows={3}
                                    placeholder="2 <= N <= 10^4&#10;-10^9 <= nums[i] <= 10^9"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1.5 uppercase">
                                    Category Tags (Comma separated)
                                </label>
                                <Input
                                    type="text"
                                    value={tagsText}
                                    onChange={e => setTagsText(e.target.value)}
                                    placeholder="Array, Hash Table, Two Pointers"
                                    className="py-3"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: TEST CASES & CODE_TESTS INTEGRATION */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl space-y-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                    <ListOrdered className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-zinc-100">3. Test Cases & code_tests Directory Integration</h2>
                                    <p className="text-xs text-zinc-400">Manage sample and hidden test cases, or attach/upload files directly to server <code className="text-cyan-400">code_tests/</code> directory.</p>
                                </div>
                            </div>
                        </div>

                        {/* 2 WAYS OF ADDING TEST CASES (code_tests Folder Integration) */}
                        <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                                <div>
                                    <h3 className="text-sm font-black text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                                        <FolderOpen className="w-4 h-4 text-primary-400" />
                                        <span>Test Case File Data Source</span>
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                        Attach an existing test file stored in <code className="text-primary-300 font-mono">code_tests/</code> or upload a local file to be saved directly in <code className="text-primary-300 font-mono">code_tests/</code>.
                                    </p>
                                </div>

                                {attachedTestFile && (
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5 self-start sm:self-center">
                                        <FileCheck className="w-4 h-4" />
                                        <span>{attachedTestFile}</span>
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* METHOD 1: SELECT OR ENTER EXISTING FILE IN code_tests/ */}
                                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-400 font-mono text-xs font-bold flex items-center justify-center">1</span>
                                        <h4 className="text-xs font-extrabold text-zinc-200 uppercase font-mono">
                                            Method 1: Select File from <code className="text-primary-400">code_tests/</code>
                                        </h4>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-mono text-zinc-400">
                                            Select Existing Test File in Server Repo:
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={selectedExistingFile}
                                                onChange={e => setSelectedExistingFile(e.target.value)}
                                                className="flex-1 bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer"
                                            >
                                                <option value="">-- Choose file in code_tests/ --</option>
                                                {existingTestFiles.map(f => (
                                                    <option key={f} value={f}>{f}</option>
                                                ))}
                                            </select>

                                            <button
                                                type="button"
                                                onClick={() => selectedExistingFile && handleLoadExistingFile(selectedExistingFile)}
                                                disabled={!selectedExistingFile}
                                                className="px-4 py-2.5 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 border border-primary-500/30 text-xs font-bold font-mono transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                Attach & Load
                                            </button>
                                        </div>

                                        <div className="pt-2 border-t border-zinc-800/60">
                                            <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                                                Or Enter Filename Manually:
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="text"
                                                    placeholder="e.g. two-sum.jsonl"
                                                    value={manualFileName}
                                                    onChange={e => setManualFileName(e.target.value)}
                                                    className="font-mono text-xs py-2"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => manualFileName.trim() && handleLoadExistingFile(manualFileName.trim())}
                                                    disabled={!manualFileName.trim()}
                                                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold font-mono transition-all disabled:opacity-50 cursor-pointer"
                                                >
                                                    Load
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* METHOD 2: UPLOAD FILE TO code_tests/ */}
                                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center">2</span>
                                        <h4 className="text-xs font-extrabold text-zinc-200 uppercase font-mono">
                                            Method 2: Upload File to <code className="text-cyan-400">code_tests/</code>
                                        </h4>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-mono text-zinc-400">
                                            Select .jsonl, .json, or .txt file from your computer:
                                        </label>

                                        <div className="relative border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 rounded-2xl p-5 text-center transition-all bg-zinc-950/60 cursor-pointer group">
                                            <input
                                                type="file"
                                                accept=".jsonl,.json,.txt"
                                                onChange={handleFileUpload}
                                                disabled={uploadingFile}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="flex flex-col items-center gap-2 pointer-events-none">
                                                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                                                    <Upload className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-bold text-zinc-200">
                                                    {uploadingFile ? 'Saving to code_tests/...' : 'Click or Drag File to Upload to code_tests/'}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 font-mono">
                                                    Will be saved directly into server code_tests/ folder & parsed automatically
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sample Test Cases */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-mono font-bold uppercase text-zinc-300">
                                    Sample Test Cases (Visible on Problem Workspace)
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setSampleTestCases(prev => [...prev, { id: `st-${Date.now()}-${prev.length}`, input: '', output: '', explanation: '' }])}
                                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-primary-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-zinc-700/60"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Sample Case</span>
                                </button>
                            </div>

                            {sampleTestCases.map((stc, idx) => (
                                <div key={stc.id} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 relative">
                                    <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                                        <span className="font-bold text-zinc-300">Sample Case #{idx + 1}</span>
                                        {sampleTestCases.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setSampleTestCases(prev => prev.filter(item => item.id !== stc.id))}
                                                className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                                            >
                                                Remove Case
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Input Data</span>
                                            <textarea
                                                value={stc.input}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setSampleTestCases(prev => prev.map(item => item.id === stc.id ? { ...item, input: val } : item));
                                                }}
                                                rows={3}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none"
                                                placeholder="4 9&#10;2 7 11 15"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Expected Output</span>
                                            <textarea
                                                value={stc.output}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setSampleTestCases(prev => prev.map(item => item.id === stc.id ? { ...item, output: val } : item));
                                                }}
                                                rows={3}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none"
                                                placeholder="0 1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Hidden Test Cases */}
                        <div className="space-y-4 pt-6 border-t border-zinc-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-mono font-bold uppercase text-zinc-300">
                                    Full Evaluation Test Cases (Passed to Docker Driver stdin)
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setHiddenTestCases(prev => [...prev, { id: `tc-${Date.now()}-${prev.length}`, input: '', output: '', hidden: true }])}
                                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-primary-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-zinc-700/60"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Evaluation Case</span>
                                </button>
                            </div>

                            {hiddenTestCases.map((htc, idx) => (
                                <div key={htc.id} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 relative">
                                    <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-zinc-300">Evaluation Case #{idx + 1}</span>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={htc.hidden}
                                                    onChange={e => {
                                                        const isChecked = e.target.checked;
                                                        setHiddenTestCases(prev => prev.map(item => item.id === htc.id ? { ...item, hidden: isChecked } : item));
                                                    }}
                                                    className="rounded bg-zinc-900 border-zinc-700 text-primary-500"
                                                />
                                                <span className="text-[10px] text-zinc-400">Keep Hidden</span>
                                            </label>
                                        </div>

                                        {hiddenTestCases.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setHiddenTestCases(prev => prev.filter(item => item.id !== htc.id))}
                                                className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                                            >
                                                Remove Case
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Input Data</span>
                                            <textarea
                                                value={htc.input}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setHiddenTestCases(prev => prev.map(item => item.id === htc.id ? { ...item, input: val } : item));
                                                }}
                                                rows={3}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Expected Output</span>
                                            <textarea
                                                value={htc.output}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setHiddenTestCases(prev => prev.map(item => item.id === htc.id ? { ...item, output: val } : item));
                                                }}
                                                rows={3}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 4: STARTER CODE TEMPLATES */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl space-y-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-zinc-100">4. Starter Code Templates</h2>
                                    <p className="text-xs text-zinc-400">Provide default code structure loaded in the Monaco editor for each language.</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={generateBoilerplate}
                                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-zinc-700/60"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Generate Boilerplates</span>
                            </button>
                        </div>

                        {/* Language Selection Bar */}
                        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
                            {['python', 'cpp', 'java', 'c', 'javascript'].map(lang => (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => setStarterLangTab(lang as any)}
                                    className={`px-4 py-2 rounded-xl text-xs font-mono uppercase font-bold cursor-pointer transition-all ${
                                        starterLangTab === lang
                                            ? 'bg-primary-500/10 border border-primary-500/30 text-primary-400 shadow'
                                            : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>

                        {/* Language Code Textarea */}
                        <div>
                            <label className="block text-xs font-mono text-zinc-400 mb-2">
                                Template Code for <strong className="text-primary-400 uppercase">{starterLangTab}</strong>
                            </label>

                            {starterLangTab === 'python' && (
                                <textarea
                                    value={starterPython}
                                    onChange={e => setStarterPython(e.target.value)}
                                    rows={10}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-emerald-300 focus:outline-none leading-relaxed"
                                    placeholder="class Solution:\n    def solve(self)..."
                                />
                            )}
                            {starterLangTab === 'cpp' && (
                                <textarea
                                    value={starterCpp}
                                    onChange={e => setStarterCpp(e.target.value)}
                                    rows={10}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-cyan-300 focus:outline-none leading-relaxed"
                                    placeholder="#include <iostream>..."
                                />
                            )}
                            {starterLangTab === 'java' && (
                                <textarea
                                    value={starterJava}
                                    onChange={e => setStarterJava(e.target.value)}
                                    rows={10}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-amber-300 focus:outline-none leading-relaxed"
                                    placeholder="public class Solution..."
                                />
                            )}
                            {starterLangTab === 'c' && (
                                <textarea
                                    value={starterC}
                                    onChange={e => setStarterC(e.target.value)}
                                    rows={10}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-blue-300 focus:outline-none leading-relaxed"
                                    placeholder="#include <stdio.h>..."
                                />
                            )}
                            {starterLangTab === 'javascript' && (
                                <textarea
                                    value={starterJs}
                                    onChange={e => setStarterJs(e.target.value)}
                                    rows={10}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-yellow-300 focus:outline-none leading-relaxed"
                                    placeholder="function solve()..."
                                />
                            )}
                        </div>
                    </div>

                    {/* Bottom Save Controls Bar */}
                    <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-between shadow-2xl">
                        <div className="text-xs text-zinc-400">
                            Problem will be added to contest <strong className="text-primary-300 font-mono">{activeComp?.title} ({activeComp?.accessCode})</strong>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => router.push(`/admin/problems?comp=${selectedCompCode}`)}
                                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-zinc-950 font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isSaving ? 'Saving Problem...' : editingProblem ? 'Update Problem' : 'Publish Problem'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
