import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/app/generated/prisma/client';
// @ts-ignore
import { INITIAL_COMPETITIONS, INITIAL_PARTICIPANTS, INITIAL_SUBMISSIONS } from '../src/data/initialCompetitions';

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
        },
        create: {
          id: prob.id,
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
