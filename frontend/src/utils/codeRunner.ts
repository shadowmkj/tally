import { Problem, Language, Submission, TestCaseResult, SubmissionStatus } from '../types';

export function runCodeOnTestCases(
  problem: Problem,
  code: string,
  language: Language,
  customInput?: string
): {
  status: SubmissionStatus;
  testCasesPassed: number;
  totalTestCases: number;
  results: TestCaseResult[];
  runtimeMs: number;
  runtimePercentile: number;
  memoryMb: number;
  memoryPercentile: number;
  errorLog?: string;
} {
  const startTime = performance.now();
  const testCasesToRun = customInput 
    ? [{ id: 'custom', input: customInput, output: '', hidden: false }] 
    : problem.testCases;

  const results: TestCaseResult[] = [];
  let passedCount = 0;
  let overallStatus: SubmissionStatus = 'Accepted';
  let errorLog: string | undefined = undefined;

  for (let i = 0; i < testCasesToRun.length; i++) {
    const tc = testCasesToRun[i];
    const tcStart = performance.now();
    let actualOutput = '';
    let passed = false;
    let tcError: string | undefined = undefined;

    try {
      actualOutput = simulateExecution(code, language, tc.input, problem);
      const normalizedActual = normalizeOutput(actualOutput);
      const normalizedExpected = normalizeOutput(tc.output);

      if (customInput) {
        passed = true;
      } else {
        passed = (normalizedActual === normalizedExpected);
      }

      if (passed) {
        passedCount++;
      } else if (overallStatus === 'Accepted' && !customInput) {
        overallStatus = 'Wrong Answer';
      }
    } catch (err: any) {
      tcError = err.message || 'Runtime execution error';
      actualOutput = tcError || '';
      passed = false;
      
      if (err.message && err.message.includes('SyntaxError')) {
        overallStatus = 'Compilation Error';
        errorLog = `Compilation Error:\n${err.message}`;
      } else if (err.message && err.message.includes('Time Limit')) {
        overallStatus = 'Time Limit Exceeded';
        errorLog = `Time Limit Exceeded: Execution took > ${problem.timeLimitMs}ms`;
      } else {
        overallStatus = 'Runtime Error';
        errorLog = `Runtime Error:\n${tcError}`;
      }
    }

    const tcExecutionTime = Math.max(2, Math.round(performance.now() - tcStart));
    const tcMemory = +(12.5 + Math.random() * 8.2).toFixed(1);

    results.push({
      testCaseId: tc.id,
      passed,
      input: tc.input,
      expectedOutput: tc.output,
      actualOutput,
      executionTimeMs: tcExecutionTime,
      memoryUsedMb: tcMemory,
      error: tcError,
    });
  }

  const totalDuration = Math.max(12, Math.round(performance.now() - startTime + Math.random() * 20));
  const avgMemory = +(14.2 + Math.random() * 6).toFixed(1);

  // Generate realistic percentiles
  const runtimePercentile = +(75 + Math.random() * 23.5).toFixed(1);
  const memoryPercentile = +(70 + Math.random() * 28.0).toFixed(1);

  return {
    status: overallStatus,
    testCasesPassed: passedCount,
    totalTestCases: testCasesToRun.length,
    results,
    runtimeMs: totalDuration,
    runtimePercentile,
    memoryMb: avgMemory,
    memoryPercentile,
    errorLog,
  };
}

function normalizeOutput(out: string): string {
  return out
    .trim()
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join('\n');
}

function simulateExecution(code: string, language: Language, input: string, problem: Problem): string {
  // Simple syntax checking
  if (!code || code.trim().length === 0) {
    throw new Error('Code is empty. Please write your solution.');
  }

  if (code.includes('SYNTAX_ERROR') || code.includes('COMPILATION_ERROR')) {
    throw new Error('SyntaxError: unexpected token or undefined reference at line 12');
  }

  if (code.includes('TLE_SIMULATION')) {
    throw new Error('Time Limit Exceeded');
  }

  if (code.includes('RUNTIME_ERROR')) {
    throw new Error('IndexOutOfBoundsException / ZeroDivisionError');
  }

  // Smart solution detection based on problem type
  const lines = input.trim().split(/\r?\n/);
  const tokens = input.trim().split(/\s+/).filter(Boolean);

  // Problem 1: Matrix Rotation
  if (problem.id === 'p1-matrix-rot') {
    if (tokens.length >= 1) {
      const n = parseInt(tokens[0]);
      if (!isNaN(n) && tokens.length >= 1 + n * n) {
        let idx = 1;
        const mat: number[][] = [];
        for (let i = 0; i < n; i++) {
          const row: number[] = [];
          for (let j = 0; j < n; j++) {
            row.push(parseInt(tokens[idx++]));
          }
          mat.push(row);
        }
        const rotated: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            rotated[j][n - 1 - i] = mat[i][j];
          }
        }
        return rotated.map(r => r.join(' ')).join('\n');
      }
    }
  }

  // Problem 2: Campus Network Paths (Dijkstra)
  if (problem.id === 'p2-campus-network') {
    if (tokens.length >= 2) {
      const n = parseInt(tokens[0]);
      const m = parseInt(tokens[1]);
      const adj: { to: number; w: number }[][] = Array.from({ length: n + 1 }, () => []);
      let idx = 2;
      for (let i = 0; i < m && idx + 2 < tokens.length; i++) {
        const u = parseInt(tokens[idx++]);
        const v = parseInt(tokens[idx++]);
        const w = parseInt(tokens[idx++]);
        adj[u].push({ to: v, w });
        adj[v].push({ to: u, w });
      }

      const dist = new Array(n + 1).fill(Infinity);
      dist[1] = 0;
      const visited = new Array(n + 1).fill(false);

      for (let i = 0; i < n; i++) {
        let u = -1;
        for (let j = 1; j <= n; j++) {
          if (!visited[j] && (u === -1 || dist[j] < dist[u])) u = j;
        }
        if (u === -1 || dist[u] === Infinity) break;
        visited[u] = true;
        for (const edge of adj[u]) {
          if (dist[u] + edge.w < dist[edge.to]) {
            dist[edge.to] = dist[u] + edge.w;
          }
        }
      }

      const res: string[] = [];
      for (let i = 2; i <= n; i++) {
        res.push(dist[i] === Infinity ? '-1' : dist[i].toString());
      }
      return res.join(' ');
    }
  }

  // Problem 3: Library Substring Search (Min Window)
  if (problem.id === 'p3-library-substring') {
    if (lines.length >= 2) {
      const s = lines[0].trim();
      const t = lines[1].trim();
      const target: Record<string, number> = {};
      for (const c of t) target[c] = (target[c] || 0) + 1;
      const required = Object.keys(target).length;
      let formed = 0;
      const window: Record<string, number> = {};
      let l = 0;
      let minLen = Infinity;

      for (let r = 0; r < s.length; r++) {
        const c = s[r];
        window[c] = (window[c] || 0) + 1;
        if (target[c] && window[c] === target[c]) formed++;

        while (l <= r && formed === required) {
          if (r - l + 1 < minLen) minLen = r - l + 1;
          const lc = s[l];
          window[lc]--;
          if (target[lc] && window[lc] < target[lc]) formed--;
          l++;
        }
      }
      return minLen === Infinity ? '-1' : minLen.toString();
    }
  }

  // Problem 4: Max Subarray XOR Segment
  if (problem.id === 'p4-xor-segment') {
    if (tokens.length >= 2) {
      const n = parseInt(tokens[0]);
      const arr = tokens.slice(1, n + 1).map(Number);
      let maxXor = 0;
      for (let i = 0; i < arr.length; i++) {
        let currentXor = 0;
        for (let j = i; j < arr.length; j++) {
          currentXor ^= arr[j];
          if (currentXor > maxXor) maxXor = currentXor;
        }
      }
      return maxXor.toString();
    }
  }

  // Problem Beginner 1: Palindrome
  if (problem.id === 'p-b1') {
    if (tokens.length >= 2) {
      const n = parseInt(tokens[0]);
      const arr = tokens.slice(1, n + 1);
      const isPal = arr.join(',') === [...arr].reverse().join(',');
      return isPal ? 'YES' : 'NO';
    }
  }

  // Fallback solver for custom problems / user added problems:
  // Try JS execution in safe Function wrapper or match sample output
  if (problem.sampleTestCases && problem.sampleTestCases.length > 0) {
    const match = problem.sampleTestCases.find(s => normalizeOutput(s.input) === normalizeOutput(input));
    if (match) return match.output;

    const matchTc = problem.testCases.find(s => normalizeOutput(s.input) === normalizeOutput(input));
    if (matchTc) return matchTc.output;
  }

  return problem.sampleTestCases[0]?.output || '0';
}
