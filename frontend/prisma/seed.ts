import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/app/generated/prisma/client';
import { auth } from '../src/lib/auth';
const INITIAL_COMPETITIONS: any[] = [
  {
    id: 'wecode-annual-2026',
    accessCode: 'WEC2026',
    title: 'WeCode Annual Championship 2026',
    subtitle: 'Competitive Programming League • Season 4',
    description: 'Welcome to the flagship competitive programming contest!',
    startTime: new Date().toISOString(),
    durationMinutes: 120,
    isLive: true,
    isLeaderboardFrozen: false,
    announcements: [
      {
        id: 'ann-1',
        title: 'Welcome Participants!',
        text: 'The contest has officially started. Good luck!',
        timestamp: new Date().toISOString(),
        pinned: true,
      },
    ],
    problems: [
      {
        id: 'prob-1',
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
        starterTemplates: {
          python: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass',
          cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {0, 1};\n    }\n};',
          java: 'public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{0, 1};\n    }\n}',
          c: '#include <stdlib.h>\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    int* ret = malloc(2 * sizeof(int));\n    ret[0] = 0; ret[1] = 1;\n    *returnSize = 2;\n    return ret;\n}',
          javascript: 'function twoSum(nums, target) {\n    return [0, 1];\n}'
        },
        sampleTestCases: [
          { id: 'st-1', input: '4 9\n2 7 11 15', output: '0 1' }
        ],
        testCases: [
          { id: 't-1', input: '4 9\n2 7 11 15', output: '0 1', hidden: false }
        ]
      },
      {
        id: 'prob-2',
        title: '2. Climbing Stairs',
        slug: 'climbing-stairs',
        methodName: 'climbStairs',
        typeSchema: 'i:i',
        difficulty: 'Easy',
        points: 100,
        timeLimitMs: 1000,
        memoryLimitMb: 256,
        tags: ['Dynamic Programming', 'Math', 'Memoization'],
        description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
        inputFormat: 'A single line containing an integer n.',
        outputFormat: 'Print the number of distinct ways to reach the top.',
        constraints: ['1 <= n <= 45'],
        starterTemplates: {
          python: 'class Solution:\n    def climbStairs(self, n: int) -> int:\n        pass',
          cpp: '#include <iostream>\nusing namespace std;\nclass Solution {\npublic:\n    int climbStairs(int n) {\n        return 0;\n    }\n};',
          java: 'public class Solution {\n    public int climbStairs(int n) {\n        return 0;\n    }\n}',
          c: 'int climbStairs(int n) {\n    return 0;\n}',
          javascript: 'function climbStairs(n) {\n    return 0;\n}'
        },
        sampleTestCases: [
          { id: 'st-2-1', input: '2', output: '2', explanation: '1 step + 1 step, or 2 steps' },
          { id: 'st-2-2', input: '3', output: '3', explanation: '1+1+1, 1+2, or 2+1' }
        ],
        testCases: [
          { id: 't-2-1', input: '2', output: '2', hidden: false },
          { id: 't-2-2', input: '3', output: '3', hidden: false },
          { id: 't-2-3', input: '5', output: '8', hidden: false },
          { id: 't-2-4', input: '10', output: '89', hidden: true }
        ]
      },
      {
        id: 'prob-3',
        title: '3. House Robber',
        slug: 'house-robber',
        methodName: 'rob',
        typeSchema: '[i]:i',
        difficulty: 'Medium',
        points: 200,
        timeLimitMs: 1000,
        memoryLimitMb: 256,
        tags: ['Dynamic Programming', 'Array'],
        description: 'You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night. Given an integer array nums representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.',
        inputFormat: 'Line 1: N (number of houses). Line 2: N space-separated integers representing money in each house.',
        outputFormat: 'Print the maximum amount of money you can rob.',
        constraints: ['1 <= N <= 100', '0 <= nums[i] <= 400'],
        starterTemplates: {
          python: 'class Solution:\n    def rob(self, nums: List[int]) -> int:\n        pass',
          cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int rob(vector<int>& nums) {\n        return 0;\n    }\n};',
          java: 'public class Solution {\n    public int rob(int[] nums) {\n        return 0;\n    }\n}',
          c: 'int rob(int* nums, int numsSize) {\n    return 0;\n}',
          javascript: 'function rob(nums) {\n    return 0;\n}'
        },
        sampleTestCases: [
          { id: 'st-3-1', input: '4\n1 2 3 1', output: '4', explanation: 'Rob house 1 (money = 1) and rob house 3 (money = 3). Total = 1 + 3 = 4.' },
          { id: 'st-3-2', input: '5\n2 7 9 3 1', output: '12', explanation: 'Rob house 1 (money = 2), house 3 (money = 9) and house 5 (money = 1). Total = 2 + 9 + 1 = 12.' }
        ],
        testCases: [
          { id: 't-3-1', input: '4\n1 2 3 1', output: '4', hidden: false },
          { id: 't-3-2', input: '5\n2 7 9 3 1', output: '12', hidden: false },
          { id: 't-3-3', input: '1\n5', output: '5', hidden: false },
          { id: 't-3-4', input: '4\n2 1 1 2', output: '4', hidden: true }
        ]
      },
      {
        id: 'prob-4',
        title: '4. Reverse String',
        slug: 'reverse-string',
        methodName: 'reverseString',
        typeSchema: 's:s',
        difficulty: 'Easy',
        points: 100,
        timeLimitMs: 1000,
        memoryLimitMb: 256,
        tags: ['Two Pointers', 'String'],
        description: 'Given a string s, return the reversed string.',
        inputFormat: 'A single line containing string s.',
        outputFormat: 'Print the reversed string.',
        constraints: ['1 <= s.length <= 10^5'],
        starterTemplates: {
          python: 'class Solution:\n    def reverseString(self, s: str) -> str:\n        pass',
          cpp: '#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    string reverseString(string s) {\n        return "";\n    }\n};',
          java: 'public class Solution {\n    public String reverseString(String s) {\n        return "";\n    }\n}',
          c: '#include <string.h>\nchar* reverseString(char* s) {\n    return s;\n}',
          javascript: 'function reverseString(s) {\n    return "";\n}'
        },
        sampleTestCases: [
          { id: 'st-4-1', input: 'hello', output: 'olleh' },
          { id: 'st-4-2', input: 'Hannah', output: 'hannaH' }
        ],
        testCases: [
          { id: 't-4-1', input: 'hello', output: 'olleh', hidden: false },
          { id: 't-4-2', input: 'Hannah', output: 'hannaH', hidden: false },
          { id: 't-4-3', input: 'wecode', output: 'edocew', hidden: false },
          { id: 't-4-4', input: 'a', output: 'a', hidden: true }
        ]
      }
    ]
  }
];

const INITIAL_PARTICIPANTS: any[] = [];
const INITIAL_SUBMISSIONS: any[] = [];

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding SQLite database with initial competitions data...');

  for (const comp of INITIAL_COMPETITIONS) {
    console.log(`Seeding competition: ${comp.title} (${comp.accessCode})`);
    
    // Upsert Competition
    await prisma.competition.upsert({
      where: { accessCode: comp.accessCode },
      update: {
        title: comp.title,
        subtitle: comp.subtitle,
        description: comp.description,
        startTime: new Date(comp.startTime),
        durationMinutes: comp.durationMinutes,
        isLive: comp.isLive,
        isLeaderboardFrozen: comp.isLeaderboardFrozen,
      },
      create: {
        id: comp.id,
        accessCode: comp.accessCode,
        title: comp.title,
        subtitle: comp.subtitle,
        description: comp.description,
        startTime: new Date(comp.startTime),
        durationMinutes: comp.durationMinutes,
        isLive: comp.isLive,
        isLeaderboardFrozen: comp.isLeaderboardFrozen,
      },
    });

    // Seed Announcements
    for (const ann of comp.announcements) {
      await prisma.announcement.upsert({
        where: { id: ann.id },
        update: {
          title: ann.title,
          text: ann.text,
          pinned: ann.pinned || false,
        },
        create: {
          id: ann.id,
          title: ann.title,
          text: ann.text,
          timestamp: new Date(ann.timestamp),
          pinned: ann.pinned || false,
          competitionId: comp.id,
        },
      });
    }

    // Seed Problems
    for (const prob of comp.problems) {
      await prisma.problem.upsert({
        where: { id: prob.id },
        update: {
          title: prob.title,
          slug: prob.slug,
          difficulty: prob.difficulty,
          points: prob.points,
          timeLimitMs: prob.timeLimitMs,
          memoryLimitMb: prob.memoryLimitMb,
          acceptanceRate: prob.acceptanceRate,
          tags: JSON.stringify(prob.tags),
          description: prob.description,
          inputFormat: prob.inputFormat,
          outputFormat: prob.outputFormat,
          constraints: JSON.stringify(prob.constraints),
          starterTemplates: JSON.stringify(prob.starterTemplates),
          methodName: (prob as any).methodName || 'solve',
          typeSchema: (prob as any).typeSchema || null,
        },
        create: {
          id: prob.id,
          title: prob.title,
          slug: prob.slug,
          methodName: (prob as any).methodName || 'solve',
          typeSchema: (prob as any).typeSchema || null,
          difficulty: prob.difficulty,
          points: prob.points,
          timeLimitMs: prob.timeLimitMs,
          memoryLimitMb: prob.memoryLimitMb,
          acceptanceRate: prob.acceptanceRate,
          tags: JSON.stringify(prob.tags),
          description: prob.description,
          inputFormat: prob.inputFormat,
          outputFormat: prob.outputFormat,
          constraints: JSON.stringify(prob.constraints),
          starterTemplates: JSON.stringify(prob.starterTemplates),
          competitionId: comp.id,
        },
      });

      // Sample Test Cases
      for (const stc of prob.sampleTestCases) {
        await prisma.sampleTestCase.upsert({
          where: { id: stc.id },
          update: {
            input: stc.input,
            output: stc.output,
            explanation: stc.explanation,
          },
          create: {
            id: stc.id,
            input: stc.input,
            output: stc.output,
            explanation: stc.explanation,
            problemId: prob.id,
          },
        });
      }

      // Test Cases
      for (const tc of prob.testCases) {
        await prisma.testCase.upsert({
          where: { id: tc.id },
          update: {
            input: tc.input,
            output: tc.output,
            hidden: tc.hidden || false,
          },
          create: {
            id: tc.id,
            input: tc.input,
            output: tc.output,
            hidden: tc.hidden || false,
            problemId: prob.id,
          },
        });
      }
    }
  }

  // Seed Participants
  for (const part of INITIAL_PARTICIPANTS) {
    await prisma.participant.upsert({
      where: { id: part.id },
      update: {
        name: part.name,
        collegeId: part.collegeId,
        accessCode: part.accessCode,
        totalScore: part.totalScore,
        totalPenaltyTimeMinutes: part.totalPenaltyTimeMinutes,
        solvedProblems: JSON.stringify(part.solvedProblems),
      },
      create: {
        id: part.id,
        name: part.name,
        collegeId: part.collegeId,
        accessCode: part.accessCode,
        totalScore: part.totalScore,
        totalPenaltyTimeMinutes: part.totalPenaltyTimeMinutes,
        solvedProblems: JSON.stringify(part.solvedProblems),
        lastActive: new Date(part.lastActive),
        competitionId: INITIAL_COMPETITIONS[0]?.id,
      },
    });
  }

  // Seed Submissions
  for (const sub of INITIAL_SUBMISSIONS) {
    await prisma.submission.upsert({
      where: { id: sub.id },
      update: {
        status: sub.status,
        code: sub.code,
      },
      create: {
        id: sub.id,
        competitionId: sub.competitionId,
        problemId: sub.problemId,
        problemTitle: sub.problemTitle,
        participantId: sub.participantId,
        participantName: sub.participantName,
        collegeId: sub.collegeId,
        language: sub.language,
        code: sub.code,
        status: sub.status,
        testCasesPassed: sub.testCasesPassed,
        totalTestCases: sub.totalTestCases,
        runtimeMs: sub.runtimeMs,
        runtimePercentile: sub.runtimePercentile,
        memoryMb: sub.memoryMb,
        memoryPercentile: sub.memoryPercentile,
        timestamp: new Date(sub.timestamp),
        errorLog: sub.errorLog,
      },
    });
  }

  // Seed Admin User
  const adminEmail = 'admin@wecode.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    console.log(`Seeding admin user (${adminEmail})...`);
    await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: 'secret1234',
        name: 'Admin',
      },
    });
    console.log('✅ Admin user created.');
  } else {
    console.log(`Admin user (${adminEmail}) already exists.`);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
