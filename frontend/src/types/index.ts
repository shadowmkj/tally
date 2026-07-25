export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Language = 'python' | 'cpp' | 'java' | 'c' | 'javascript';

export type SubmissionStatus = 
  | 'Accepted' 
  | 'Wrong Answer' 
  | 'Time Limit Exceeded' 
  | 'Runtime Error' 
  | 'Compilation Error' 
  | 'Evaluating';

export interface SampleTestCase {
  id: string;
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  id: string;
  input: string;
  output: string;
  hidden?: boolean;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  tags: string[];
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  sampleTestCases: SampleTestCase[];
  testCases: TestCase[];
  starterTemplates: Record<Language, string>;
  acceptanceRate?: number;
}

export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  executionTimeMs: number;
  memoryUsedMb: number;
  error?: string;
}

export interface Submission {
  id: string;
  competitionId: string;
  problemId: string;
  problemTitle: string;
  participantId: string;
  participantName: string;
  collegeId: string;
  language: Language;
  code: string;
  status: SubmissionStatus;
  testCasesPassed: number;
  totalTestCases: number;
  runtimeMs: number;
  runtimePercentile: number;
  memoryMb: number;
  memoryPercentile: number;
  timestamp: string;
  errorLog?: string;
  results?: TestCaseResult[];
}

export interface SolvedProblemStatus {
  status: 'AC' | 'WA' | 'NONE';
  attempts: number;
  solvedTimeMinutes?: number;
  scoreGained?: number;
}

export interface Participant {
  id: string;
  name: string;
  collegeId: string;
  accessCode: string;
  totalScore: number;
  totalPenaltyTimeMinutes: number;
  solvedProblems: Record<string, SolvedProblemStatus>;
  lastActive: string;
}

export interface Announcement {
  id: string;
  title: string;
  text: string;
  timestamp: string;
  pinned?: boolean;
}

export interface Competition {
  id: string;
  accessCode: string; // 6-digit alphanumeric e.g. WEC2026
  title: string;
  subtitle: string;
  description: string;
  startTime: string; // ISO string
  durationMinutes: number;
  isLive: boolean;
  isLeaderboardFrozen: boolean;
  problems: Problem[];
  announcements: Announcement[];
}

export interface UserSession {
  accessCode: string;
  participantId: string;
  name: string;
  collegeId: string;
  enteredAt: string;
}
