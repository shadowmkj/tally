import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Cpu, 
  Copy, 
  Check, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  Code2, 
  FileText, 
  History, 
  HelpCircle,
  Lightbulb,
  ArrowLeft,
  Flame,
  Award
} from 'lucide-react';
import { Problem, Language, Submission, SubmissionStatus, TestCaseResult, UserSession } from '../types';
import { runCodeOnTestCases } from '../utils/codeRunner';

interface ProblemWorkspaceProps {
  problem: Problem;
  session: UserSession | null;
  onBackToList: () => void;
  onSubmitFinished: (sub: Submission) => void;
  previousSubmissions: Submission[];
}

export const ProblemWorkspace: React.FC<ProblemWorkspaceProps> = ({
  problem,
  session,
  onBackToList,
  onSubmitFinished,
  previousSubmissions,
}) => {
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState<string>(problem.starterTemplates[language] || '');
  const [leftTab, setLeftTab] = useState<'description' | 'submissions' | 'hints'>('description');
  const [bottomDrawerOpen, setBottomDrawerOpen] = useState<boolean>(true);
  const [bottomTab, setBottomTab] = useState<'testcase' | 'result'>('testcase');
  
  const [customInput, setCustomInput] = useState<string>(problem.sampleTestCases[0]?.input || '');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [latestResult, setLatestResult] = useState<{
    status: SubmissionStatus;
    testCasesPassed: number;
    totalTestCases: number;
    results: TestCaseResult[];
    runtimeMs: number;
    runtimePercentile: number;
    memoryMb: number;
    memoryPercentile: number;
    errorLog?: string;
    isSubmitMode?: boolean;
  } | null>(null);

  // Update starter code when language changes
  useEffect(() => {
    setCode(problem.starterTemplates[language] || '');
  }, [language, problem]);

  // Handle Copying Sample Case
  const handleCopySample = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Run Code against Sample Cases / Custom Input
  const handleRunCode = () => {
    setIsRunning(true);
    setBottomDrawerOpen(true);
    setBottomTab('result');

    setTimeout(() => {
      const result = runCodeOnTestCases(problem, code, language, customInput);
      setLatestResult({
        ...result,
        isSubmitMode: false,
      });
      setIsRunning(false);
    }, 600);
  };

  // Submit Code against All Hidden Judge Test Cases
  const handleSubmitCode = () => {
    setIsSubmitting(true);
    setBottomDrawerOpen(true);
    setBottomTab('result');

    setTimeout(() => {
      const result = runCodeOnTestCases(problem, code, language);
      setLatestResult({
        ...result,
        isSubmitMode: true,
      });
      setIsSubmitting(false);

      // Trigger Confetti if Accepted!
      if (result.status === 'Accepted') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      // Record Submission
      const newSubmission: Submission = {
        id: `sub-${Date.now()}`,
        competitionId: 'wecode-annual-2026',
        problemId: problem.id,
        problemTitle: problem.title,
        participantId: session?.participantId || 'part-guest',
        participantName: session?.name || 'Guest Participant',
        collegeId: session?.collegeId || 'KNR22CS000',
        language,
        code,
        status: result.status,
        testCasesPassed: result.testCasesPassed,
        totalTestCases: result.totalTestCases,
        runtimeMs: result.runtimeMs,
        runtimePercentile: result.runtimePercentile,
        memoryMb: result.memoryMb,
        memoryPercentile: result.memoryPercentile,
        timestamp: new Date().toISOString(),
        errorLog: result.errorLog,
        results: result.results,
      };

      onSubmitFinished(newSubmission);
    }, 1200);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      
      {/* Workspace Sub-Header */}
      <div className="h-11 bg-zinc-900 border-b border-zinc-800 px-2 sm:px-4 flex items-center justify-between gap-2 shrink-0 overflow-x-hidden max-w-full">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            onClick={onBackToList}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-100 px-2 sm:px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Problem List</span>
            <span className="sm:hidden">List</span>
          </button>
          <div className="h-4 w-px bg-zinc-800 shrink-0"></div>
          <span className="text-xs font-bold text-zinc-200 truncate max-w-[100px] xs:max-w-[140px] sm:max-w-xs">
            {problem.title}
          </span>
          <span
            className={`hidden xs:inline-block px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
              problem.difficulty === 'Easy'
                ? 'bg-emerald-500/10 text-emerald-400'
                : problem.difficulty === 'Medium'
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {problem.difficulty}
          </span>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="hidden sm:inline">{isRunning ? 'Running...' : 'Run Code'}</span>
            <span className="sm:hidden">{isRunning ? '...' : 'Run'}</span>
          </button>

          <button
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
            className="px-3 sm:px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? '...' : 'Submit'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT PANE: Problem Statement & Details */}
        <div className="w-full md:w-1/2 flex flex-col border-r border-zinc-800 bg-zinc-900/60 overflow-hidden">
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900 px-3 border-b border-zinc-800 text-xs font-medium shrink-0 overflow-x-auto">
            <button
              onClick={() => setLeftTab('description')}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
                leftTab === 'description'
                  ? 'border-amber-400 text-amber-400 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Description</span>
            </button>

            <button
              onClick={() => setLeftTab('submissions')}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
                leftTab === 'submissions'
                  ? 'border-amber-400 text-amber-400 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Submissions ({previousSubmissions.length})</span>
            </button>

            <button
              onClick={() => setLeftTab('hints')}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
                leftTab === 'hints'
                  ? 'border-amber-400 text-amber-400 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Hints</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm text-zinc-300">
            
            {leftTab === 'description' && (
              <div className="space-y-6">
                
                {/* Header info */}
                <div>
                  <h1 className="text-xl font-bold text-zinc-100">{problem.title}</h1>
                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mt-2">
                    <span>Points: <strong className="text-amber-400">+{problem.points}</strong></span>
                    <span>•</span>
                    <span>Time Limit: {problem.timeLimitMs}ms</span>
                    <span>•</span>
                    <span>Memory: {problem.memoryLimitMb}MB</span>
                  </div>
                </div>

                {/* Description Text */}
                <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line text-zinc-300">
                  {problem.description}
                </div>

                {/* Input / Output Specs */}
                <div className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
                  <div>
                    <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">Input Format</h3>
                    <p className="text-xs text-zinc-300 font-mono whitespace-pre-line">{problem.inputFormat}</p>
                  </div>
                  <div className="pt-2 border-t border-zinc-800/80">
                    <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">Output Format</h3>
                    <p className="text-xs text-zinc-300 font-mono whitespace-pre-line">{problem.outputFormat}</p>
                  </div>
                </div>

                {/* Sample Test Cases */}
                <div className="space-y-4">
                  <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                    Sample Test Cases
                  </h3>

                  {problem.sampleTestCases.map((stc, idx) => (
                    <div key={stc.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden text-xs">
                      <div className="bg-zinc-900/80 px-3 py-1.5 border-b border-zinc-800 font-mono font-bold text-zinc-400 flex items-center justify-between">
                        <span>Example {idx + 1}</span>
                        <button
                          onClick={() => handleCopySample(stc.input, idx)}
                          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-amber-300 transition-colors"
                        >
                          {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedIndex === idx ? 'Copied' : 'Copy Input'}</span>
                        </button>
                      </div>

                      <div className="p-3 space-y-2 font-mono">
                        <div>
                          <span className="text-zinc-500 text-[10px] block mb-0.5">Input:</span>
                          <pre className="bg-zinc-900 p-2 rounded text-zinc-200 overflow-x-auto">{stc.input}</pre>
                        </div>
                        <div>
                          <span className="text-zinc-500 text-[10px] block mb-0.5">Output:</span>
                          <pre className="bg-zinc-900 p-2 rounded text-emerald-300 overflow-x-auto">{stc.output}</pre>
                        </div>
                        {stc.explanation && (
                          <div className="text-[11px] text-zinc-400 font-sans italic pt-1">
                            Explanation: {stc.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                <div className="space-y-2 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800">
                  <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">Constraints</h3>
                  <ul className="list-disc list-inside text-xs font-mono text-zinc-400 space-y-1">
                    {problem.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

              </div>
            )}

            {leftTab === 'submissions' && (
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  Your Past Submissions
                </h3>

                {previousSubmissions.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs">
                    No submissions for this problem yet. Write code and click Submit!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {previousSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold ${
                                sub.status === 'Accepted'
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {sub.status}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                              {sub.language}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-1">
                            {new Date(sub.timestamp).toLocaleTimeString()} • {sub.testCasesPassed}/{sub.totalTestCases} Testcases
                          </div>
                        </div>

                        <div className="text-right font-mono text-xs">
                          <div className="text-zinc-300">{sub.runtimeMs} ms</div>
                          <div className="text-[10px] text-zinc-500">{sub.memoryMb} MB</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {leftTab === 'hints' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>Algorithmic Hint</span>
                  </div>
                  <p>
                    Check time complexity requirements. For N = 10^5, aim for O(N) or O(N log N) algorithms. Avoid O(N^2) nested loops to prevent Time Limit Exceeded (TLE).
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT PANE: Code Editor & Execution Drawer */}
        <div className="w-full md:w-1/2 flex flex-col bg-zinc-950 overflow-hidden">
          
          {/* Editor Header Bar */}
          <div className="h-10 bg-zinc-900 border-b border-zinc-800 px-3 flex items-center justify-between gap-2 shrink-0 text-xs">
            
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-[11px]">Lang:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="python">Python 3</option>
                <option value="cpp">C++ 20</option>
                <option value="java">Java 17</option>
                <option value="c">C (GCC)</option>
                <option value="javascript">JavaScript (Node.js)</option>
              </select>
            </div>

            {/* Reset Template */}
            <button
              onClick={() => setCode(problem.starterTemplates[language] || '')}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors flex items-center gap-1"
              title="Reset code to starter boilerplate"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[11px]">Reset</span>
            </button>
          </div>

          {/* Monaco Code Editor Container */}
          <div className="flex-1 relative overflow-hidden bg-[#1e1e1e]">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language === 'python' ? 'python' : language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                lineNumbersMinChars: 3,
              }}
            />
          </div>

          {/* Bottom Execution Console Drawer */}
          <div className={`border-t border-zinc-800 bg-zinc-900/95 flex flex-col transition-all duration-300 ${
            bottomDrawerOpen ? 'h-64' : 'h-9'
          }`}>
            
            {/* Drawer Header Toggle */}
            <div className="h-9 px-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setBottomTab('testcase');
                    setBottomDrawerOpen(true);
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                    bottomTab === 'testcase' && bottomDrawerOpen
                      ? 'bg-zinc-800 text-amber-300'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Custom Testcase
                </button>

                <button
                  onClick={() => {
                    setBottomTab('result');
                    setBottomDrawerOpen(true);
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors ${
                    bottomTab === 'result' && bottomDrawerOpen
                      ? 'bg-zinc-800 text-amber-300'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Test Result</span>
                  {latestResult && (
                    <span className={`w-2 h-2 rounded-full ${
                      latestResult.status === 'Accepted' ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}></span>
                  )}
                </button>
              </div>

              <button
                onClick={() => setBottomDrawerOpen(!bottomDrawerOpen)}
                className="p-1 text-zinc-400 hover:text-zinc-100 rounded"
              >
                {bottomDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {/* Drawer Body */}
            {bottomDrawerOpen && (
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-zinc-300">
                
                {/* TESTCASE TAB */}
                {bottomTab === 'testcase' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Input parameters:</span>
                      <span className="text-[10px]">Standard stdin format</span>
                    </div>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      rows={5}
                      className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {/* TEST RESULT TAB */}
                {bottomTab === 'result' && (
                  <div>
                    {!latestResult && !isRunning && !isSubmitting && (
                      <div className="py-8 text-center text-zinc-500 text-xs">
                        Click "Run Code" or "Submit" to see execution results.
                      </div>
                    )}

                    {(isRunning || isSubmitting) && (
                      <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-400">
                        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-mono">
                          {isSubmitting ? 'Evaluating hidden test cases...' : 'Compiling & running code...'}
                        </span>
                      </div>
                    )}

                    {latestResult && !isRunning && !isSubmitting && (
                      <div className="space-y-4">
                        
                        {/* LeetCode Result Outcome Header */}
                        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                          <div>
                            <div className="flex items-center gap-2">
                              {latestResult.status === 'Accepted' ? (
                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                              ) : (
                                <XCircle className="w-6 h-6 text-rose-400" />
                              )}
                              <span
                                className={`text-lg font-extrabold ${
                                  latestResult.status === 'Accepted'
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {latestResult.status}
                              </span>
                            </div>

                            <div className="text-xs text-zinc-400 mt-1">
                              Passed {latestResult.testCasesPassed} / {latestResult.totalTestCases} Test cases
                            </div>
                          </div>

                          {/* Runtime & Memory Stats */}
                          <div className="flex items-center gap-4 text-xs font-mono">
                            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                              <div className="text-zinc-400 text-[10px]">Runtime</div>
                              <div className="font-bold text-amber-300">{latestResult.runtimeMs} ms</div>
                              <div className="text-[10px] text-emerald-400">Beats {latestResult.runtimePercentile}%</div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                              <div className="text-zinc-400 text-[10px]">Memory</div>
                              <div className="font-bold text-amber-300">{latestResult.memoryMb} MB</div>
                              <div className="text-[10px] text-emerald-400">Beats {latestResult.memoryPercentile}%</div>
                            </div>
                          </div>
                        </div>

                        {/* Error Log or Test Case Details */}
                        {latestResult.errorLog ? (
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono whitespace-pre-wrap">
                            {latestResult.errorLog}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {latestResult.results.map((r, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-zinc-300">Testcase {i + 1}</span>
                                  <span className={r.passed ? 'text-emerald-400' : 'text-rose-400'}>
                                    {r.passed ? 'PASSED' : 'FAILED'}
                                  </span>
                                </div>
                                {!r.passed && (
                                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                                    <div>
                                      <span className="text-zinc-500">Expected:</span>
                                      <div className="bg-zinc-900 p-1.5 rounded text-emerald-300">{r.expectedOutput}</div>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500">Actual:</span>
                                      <div className="bg-zinc-900 p-1.5 rounded text-rose-300">{r.actualOutput}</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
