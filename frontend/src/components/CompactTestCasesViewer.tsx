'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Eye, FileText, Check, Copy } from 'lucide-react';
import { formatTestCaseValue } from '@/lib/utils';

export interface TestCaseItem {
    id: string;
    input: string;
    output: string;
    hidden?: boolean;
    explanation?: string | null;
}

interface CompactTestCasesViewerProps {
    testCases: TestCaseItem[];
    fileName?: string | null;
    pageSizeDefault?: number;
}

export const CompactTestCasesViewer: React.FC<CompactTestCasesViewerProps> = ({
    testCases = [],
    fileName,
    pageSizeDefault = 50,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(pageSizeDefault);
    const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Filter test cases by search query
    const filteredCases = useMemo(() => {
        if (!searchQuery.trim()) return testCases;
        const q = searchQuery.toLowerCase().trim();
        return testCases.filter((tc, index) => {
            const caseNumStr = `#${index + 1}`;
            return (
                caseNumStr.includes(q) ||
                tc.input.toLowerCase().includes(q) ||
                tc.output.toLowerCase().includes(q) ||
                (tc.explanation && tc.explanation.toLowerCase().includes(q))
            );
        });
    }, [testCases, searchQuery]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const startIndex = (safeCurrentPage - 1) * pageSize;
    const paginatedCases = useMemo(() => {
        return filteredCases.slice(startIndex, startIndex + pageSize);
    }, [filteredCases, startIndex, pageSize]);

    const handleCopy = (text: string, id: string) => {
        if (typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedCaseId(prev => (prev === id ? null : id));
    };

    if (testCases.length === 0) {
        return (
            <div className="p-8 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-center space-y-2">
                <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs font-mono text-zinc-400">No test cases loaded.</p>
                <p className="text-[11px] text-zinc-500 font-mono">
                    Select an existing test file from <code className="text-primary-400 font-mono">code_tests/</code> or upload a file above.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Control Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-400 text-xs font-mono font-bold">
                        {testCases.length} Test Cases Loaded
                    </span>
                    {fileName && (
                        <span className="text-xs font-mono text-zinc-400 truncate max-w-[200px] sm:max-w-[300px]">
                            File: <strong className="text-zinc-200">{fileName}</strong>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Filter by #, input, or output..."
                            value={searchQuery}
                            onChange={e => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-primary-500/50"
                        />
                    </div>

                    {/* Page Size Selector */}
                    <select
                        value={pageSize}
                        onChange={e => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                    >
                        <option value={25}>25 / page</option>
                        <option value={50}>50 / page</option>
                        <option value={100}>100 / page</option>
                    </select>
                </div>
            </div>

            {/* Read-Only Compact Test Case Grid */}
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {paginatedCases.map((item, idx) => {
                    const globalIdx = startIndex + idx + 1;
                    const isExpanded = expandedCaseId === item.id;
                    const isCopied = copiedId === item.id;
                    const formattedInput = formatTestCaseValue(item.input);
                    const formattedOutput = formatTestCaseValue(item.output);

                    return (
                        <div
                            key={item.id}
                            className={`p-3.5 rounded-xl bg-zinc-950/90 border transition-all ${
                                isExpanded ? 'border-primary-500/50 bg-zinc-900/60' : 'border-zinc-800/80 hover:border-zinc-700'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-3 text-xs font-mono">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-bold">
                                        #{globalIdx}
                                    </span>

                                    <span
                                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                                            item.hidden
                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        }`}
                                    >
                                        {item.hidden ? 'Hidden Case' : 'Sample Case'}
                                    </span>


                                    {/* Preview Snippets */}
                                    <div className="hidden md:flex items-center gap-4 text-zinc-400 text-xs truncate flex-1">
                                        <div className="truncate flex-1">
                                            <span className="text-zinc-500 mr-1">In:</span>
                                            <span className="text-zinc-200">{formattedInput.replace(/\n/g, ' ↵ ')}</span>
                                        </div>
                                        <div className="truncate flex-1">
                                            <span className="text-zinc-500 mr-1">Out:</span>
                                            <span className="text-zinc-200">{formattedOutput.replace(/\n/g, ' ↵ ')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(`Input:\n${formattedInput}\n\nOutput:\n${formattedOutput}`, item.id)}
                                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                                        title="Copy Input and Output"
                                    >
                                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => toggleExpand(item.id)}
                                        className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-primary-400 text-[11px] font-bold flex items-center gap-1 transition-colors"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>{isExpanded ? 'Collapse' : 'View'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Snippet Line */}
                            <div className="md:hidden mt-2 pt-2 border-t border-zinc-900 text-[11px] font-mono text-zinc-400 space-y-1">
                                <div className="truncate"><span className="text-zinc-500">In:</span> {formattedInput.replace(/\n/g, ' ↵ ')}</div>
                                <div className="truncate"><span className="text-zinc-500">Out:</span> {formattedOutput.replace(/\n/g, ' ↵ ')}</div>
                            </div>

                            {/* Collapsible Expanded Details */}
                            {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono animate-fadeIn">
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-zinc-500">Input Data</span>
                                        <pre className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-200 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed text-[11px]">
                                            {formattedInput || '(empty)'}
                                        </pre>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-zinc-500">Expected Output</span>
                                        <pre className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-200 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed text-[11px]">
                                            {formattedOutput || '(empty)'}
                                        </pre>
                                    </div>

                                    {item.explanation && (
                                        <div className="md:col-span-2 space-y-1 pt-1">
                                            <span className="text-[10px] uppercase font-bold text-zinc-500">Explanation</span>
                                            <p className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-zinc-300 text-[11px]">
                                                {item.explanation}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
                    <span className="text-zinc-400 text-[11px]">
                        Showing {startIndex + 1}–{Math.min(startIndex + pageSize, filteredCases.length)} of {filteredCases.length} cases
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={safeCurrentPage === 1}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="px-3 py-1 rounded-lg bg-zinc-900 text-primary-400 font-bold text-xs">
                            Page {safeCurrentPage} of {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={safeCurrentPage === totalPages}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
