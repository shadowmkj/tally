'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
    Competition as PrismaCompetition,
    Participant as PrismaParticipant,
    Submission as PrismaSubmission,
    Announcement as PrismaAnnouncement,
    Problem as PrismaProblem,
    SampleTestCase as PrismaSampleTestCase,
    TestCase as PrismaTestCase,
    TestCaseResult as PrismaTestCaseResult,
} from '@/app/generated/prisma/client';

export type SampleTestCase = Omit<PrismaSampleTestCase, 'explanation' | 'problemId'> & {
    explanation?: string | null;
    problemId?: string;
};

export type TestCase = Omit<PrismaTestCase, 'problemId' | 'hidden'> & {
    problemId?: string;
    hidden?: boolean;
};

export type Announcement = Omit<PrismaAnnouncement, 'timestamp' | 'pinned' | 'competitionId'> & {
    timestamp: Date | string;
    pinned?: boolean;
    competitionId?: string;
};

export type TestCaseResult = PrismaTestCaseResult;

export type StarterTemplates = Record<string, string>;

export type Problem = Omit<
    PrismaProblem,
    'tags' | 'constraints' | 'starterTemplates' | 'competitionId' | 'createdAt' | 'updatedAt' | 'acceptanceRate'
> & {
    tags: string[];
    constraints: string[];
    starterTemplates: StarterTemplates;
    sampleTestCases: SampleTestCase[];
    testCases: TestCase[];
    acceptanceRate?: number | null;
    competitionId?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};

export type Participant = Omit<
    PrismaParticipant,
    'solvedProblems' | 'competitionId' | 'lastActive' | 'createdAt' | 'updatedAt'
> & {
    solvedProblems: Record<string, SolvedProblemStatus>;
    competitionId?: string | null;
    lastActive?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};

export type Submission = Omit<
    PrismaSubmission,
    'timestamp' | 'errorLog' | 'participantId' | 'createdAt' | 'language' | 'status'
> & {
    timestamp: Date | string;
    language: Language;
    status: SubmissionStatus;
    errorLog?: string | null;
    participantId?: string | null;
    createdAt?: Date | string;
    results?: TestCaseResult[];
};

export type Competition = Omit<PrismaCompetition, 'startTime' | 'createdAt' | 'updatedAt'> & {
    startTime: Date | string;
    announcements: Announcement[];
    problems: Problem[];
    createdAt?: Date | string;
    updatedAt?: Date | string;
};

export type RawProblem = Omit<PrismaProblem, 'tags' | 'constraints' | 'starterTemplates'> & {
    tags?: string | string[];
    constraints?: string | string[];
    starterTemplates?: string | StarterTemplates;
    sampleTestCases?: SampleTestCase[];
    testCases?: TestCase[];
};

export type RawAnnouncement = Omit<PrismaAnnouncement, 'timestamp'> & {
    timestamp?: Date | string;
};

export type RawCompetition = Omit<PrismaCompetition, 'startTime' | 'createdAt' | 'updatedAt'> & {
    startTime?: Date | string;
    announcements?: RawAnnouncement[];
    problems?: RawProblem[];
    createdAt?: Date | string;
    updatedAt?: Date | string;
};

export type RawParticipant = Omit<PrismaParticipant, 'solvedProblems' | 'lastActive'> & {
    solvedProblems?: string | Record<string, SolvedProblemStatus>;
    lastActive?: Date | string;
};

export type RawSubmission = Omit<PrismaSubmission, 'timestamp' | 'language' | 'status'> & {
    timestamp?: Date | string;
    language?: string | Language;
    status?: string | SubmissionStatus;
    results?: TestCaseResult[];
};

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Language = 'python' | 'cpp' | 'java' | 'c' | 'javascript';
export type SubmissionStatus =
    | 'Accepted'
    | 'Wrong Answer'
    | 'Time Limit Exceeded'
    | 'Runtime Error'
    | 'Compilation Error'
    | 'Evaluating';

export interface UserSession {
    accessCode: string;
    participantId: string;
    name: string;
    collegeId: string;
    enteredAt: string;
}

export interface SolvedProblemStatus {
    status: 'AC' | 'WA' | 'NONE';
    attempts: number;
    solvedTimeMinutes?: number;
    scoreGained?: number;
}

interface CompetitionContextType {
    competitions: Competition[];
    session: UserSession | null;
    activeCompetition: Competition;
    participants: Participant[];
    submissions: Submission[];
    showCodeGate: boolean;
    setShowCodeGate: (show: boolean) => void;
    showAnnouncements: boolean;
    setShowAnnouncements: (show: boolean) => void;
    theme: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;
    verifySession: (session: UserSession) => void;
    logoutSession: () => void;
    addSubmission: (submission: Submission) => void;
    addCompetition: (competition: Competition) => void;
    updateCompetition: (competition: Competition) => void;
    deleteCompetition: (accessCode: string) => void;
    switchCompetition: (accessCode: string) => void;
    addProblem: (competitionId: string, problem: Problem) => Promise<void>;
    updateProblem: (problem: Problem) => Promise<void>;
    deleteProblem: (problemId: string) => Promise<void>;
    broadcastAnnouncement: (compAccessCode: string, title: string, text: string) => void;
}

const CompetitionContext = createContext<CompetitionContextType | undefined>(undefined);

function formatCompetition(comp: RawCompetition): Competition {
    return {
        ...comp,
        id: comp.id,
        accessCode: comp.accessCode,
        title: comp.title,
        subtitle: comp.subtitle || '',
        description: comp.description || '',
        durationMinutes: comp.durationMinutes,
        isLive: comp.isLive,
        isLeaderboardFrozen: comp.isLeaderboardFrozen,
        startTime: typeof comp.startTime === 'string' ? comp.startTime : new Date(comp.startTime || Date.now()).toISOString(),
        announcements: (comp.announcements || []).map((ann: RawAnnouncement): Announcement => ({
            ...ann,
            id: ann.id,
            title: ann.title,
            text: ann.text,
            pinned: Boolean(ann.pinned),
            competitionId: ann.competitionId || '',
            timestamp: typeof ann.timestamp === 'string' ? ann.timestamp : new Date(ann.timestamp || Date.now()).toISOString(),
        })),
        problems: (comp.problems || []).map((prob: RawProblem): Problem => {
            let tags: string[] = [];
            let constraints: string[] = [];
            let starterTemplates: StarterTemplates = {};

            if (typeof prob.tags === 'string') {
                try { tags = JSON.parse(prob.tags); } catch (e) { tags = []; }
            } else if (Array.isArray(prob.tags)) {
                tags = prob.tags;
            }

            if (typeof prob.constraints === 'string') {
                try { constraints = JSON.parse(prob.constraints); } catch (e) { constraints = []; }
            } else if (Array.isArray(prob.constraints)) {
                constraints = prob.constraints;
            }

            if (typeof prob.starterTemplates === 'string') {
                try { starterTemplates = JSON.parse(prob.starterTemplates); } catch (e) { starterTemplates = {}; }
            } else if (prob.starterTemplates && typeof prob.starterTemplates === 'object') {
                starterTemplates = prob.starterTemplates as StarterTemplates;
            }

            return {
                ...prob,
                id: prob.id,
                title: prob.title,
                slug: prob.slug,
                difficulty: prob.difficulty,
                points: prob.points,
                timeLimitMs: prob.timeLimitMs,
                memoryLimitMb: prob.memoryLimitMb,
                description: prob.description,
                inputFormat: prob.inputFormat,
                outputFormat: prob.outputFormat,
                competitionId: prob.competitionId,
                tags,
                constraints,
                starterTemplates,
                sampleTestCases: prob.sampleTestCases || [],
                testCases: prob.testCases || [],
            };
        }),
    };
}

function formatParticipant(part: RawParticipant): Participant {
    let solvedProblems: Record<string, SolvedProblemStatus> = {};
    if (typeof part.solvedProblems === 'string') {
        try { solvedProblems = JSON.parse(part.solvedProblems); } catch (e) { solvedProblems = {}; }
    } else if (part.solvedProblems && typeof part.solvedProblems === 'object') {
        solvedProblems = part.solvedProblems;
    }
    return {
        ...part,
        id: part.id,
        name: part.name,
        collegeId: part.collegeId,
        accessCode: part.accessCode,
        totalScore: part.totalScore,
        totalPenaltyTimeMinutes: part.totalPenaltyTimeMinutes,
        solvedProblems,
        lastActive: typeof part.lastActive === 'string' ? part.lastActive : new Date(part.lastActive || Date.now()).toISOString(),
    };
}

function formatSubmission(sub: RawSubmission): Submission {
    return {
        ...sub,
        id: sub.id,
        competitionId: sub.competitionId,
        problemId: sub.problemId,
        problemTitle: sub.problemTitle,
        participantId: sub.participantId || '',
        participantName: sub.participantName,
        collegeId: sub.collegeId,
        language: (sub.language || 'python') as Language,
        code: sub.code,
        status: (sub.status || 'Evaluating') as SubmissionStatus,
        testCasesPassed: sub.testCasesPassed,
        totalTestCases: sub.totalTestCases,
        runtimeMs: sub.runtimeMs,
        runtimePercentile: sub.runtimePercentile,
        memoryMb: sub.memoryMb,
        memoryPercentile: sub.memoryPercentile,
        timestamp: typeof sub.timestamp === 'string' ? sub.timestamp : new Date(sub.timestamp || Date.now()).toISOString(),
    };
}

const EMPTY_COMPETITION: Competition = {
    id: '',
    accessCode: 'WEC2026',
    title: 'Loading Contest...',
    subtitle: '',
    description: '',
    startTime: new Date().toISOString(),
    durationMinutes: 120,
    isLive: true,
    isLeaderboardFrozen: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    announcements: [],
    problems: [],
};

export const CompetitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    const [session, setSession] = useState<UserSession | null>(() => {
        if (typeof window === 'undefined') {
            return null;
        }
        const saved = localStorage.getItem('wecode_session');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* fallback */ }
        }
        return null;
    });

    const [showCodeGate, setShowCodeGate] = useState<boolean>(false);
    const [showAnnouncements, setShowAnnouncements] = useState<boolean>(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [adminCompCode, setAdminCompCode] = useState<string | null>(null);

    // Fetch data exclusively from Database via Prisma API endpoint on mount
    useEffect(() => {
        let isMounted = true;
        async function loadFromPrismaDb() {
            try {
                const res = await fetch('/api/competitions');
                if (!res.ok) return;
                const data = await res.json();
                if (!isMounted) return;

                if (data.competitions && data.competitions.length > 0) {
                    setCompetitions(data.competitions.map(formatCompetition));
                }
                if (data.participants && data.participants.length > 0) {
                    setParticipants(data.participants.map(formatParticipant));
                }
                if (data.submissions && data.submissions.length > 0) {
                    setSubmissions(data.submissions.map(formatSubmission));
                }
            } catch (err) {
                console.error('Failed to load competition data from Prisma DB:', err);
            }
        }
        loadFromPrismaDb();
        return () => { isMounted = false; };
    }, []);

    // Sync session state to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (session) {
                localStorage.setItem('wecode_session', JSON.stringify(session));
            } else {
                localStorage.removeItem('wecode_session');
            }
        }
    }, [session]);

    const activeCompetition = (adminCompCode ? competitions.find(c => c.accessCode.toUpperCase() === adminCompCode.toUpperCase()) : null)
        || competitions.find(c => c.accessCode.toUpperCase() === (session?.accessCode || 'WEC2026').toUpperCase())
        || competitions[0]
        || EMPTY_COMPETITION;

    const switchCompetition = (accessCode: string) => {
        setAdminCompCode(accessCode);
    };

    const verifySession = (newSession: UserSession) => {
        setSession(newSession);
        setShowCodeGate(false);

        const targetComp = competitions.find(
            c => c.accessCode.toUpperCase() === newSession.accessCode.toUpperCase()
        );
        const compId = targetComp?.id || null;

        const existing = participants.find(
            p => (p.collegeId === newSession.collegeId || p.id === newSession.participantId) &&
                (p.accessCode.toUpperCase() === newSession.accessCode.toUpperCase() || (compId !== null && p.competitionId === compId))
        );
        let participantToSync: Participant;

        if (!existing) {
            participantToSync = {
                id: newSession.participantId,
                name: newSession.name,
                collegeId: newSession.collegeId,
                accessCode: newSession.accessCode,
                totalScore: 0,
                totalPenaltyTimeMinutes: 0,
                solvedProblems: {},
                lastActive: new Date().toISOString(),
                competitionId: compId,
            };
            setParticipants(prev => [...prev, participantToSync]);
        } else {
            participantToSync = {
                ...existing,
                name: newSession.name,
                accessCode: newSession.accessCode,
                competitionId: compId || existing.competitionId,
                lastActive: new Date().toISOString(),
            };
            setParticipants(prev => prev.map(p => p.id === existing.id ? participantToSync : p));
        }

        fetch('/api/participants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participant: participantToSync }),
        }).catch(err => console.error('Failed to sync participant to Prisma DB:', err));
    };

    const logoutSession = () => {
        setSession(null);
        setShowCodeGate(true);
    };

    const addSubmission = (newSub: Submission) => {
        setSubmissions(prev => [newSub, ...prev]);

        if (!session) {
            fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submission: newSub }),
            }).catch(err => console.error('Failed to save submission to Prisma DB:', err));
            return;
        }

        const existingPart = participants.find(
            p => (p.collegeId === session.collegeId || p.id === session.participantId) &&
                (p.accessCode.toUpperCase() === activeCompetition.accessCode.toUpperCase() || (activeCompetition.id !== '' && p.competitionId === activeCompetition.id))
        );
        let updatedParticipant: Participant | null = null;

        if (existingPart) {
            const problem = (activeCompetition?.problems || []).find((prob: Problem) => prob.id === newSub.problemId);
            const solvedDict = typeof existingPart.solvedProblems === 'object' && existingPart.solvedProblems ? existingPart.solvedProblems : {};
            const currentStatus: SolvedProblemStatus = solvedDict[newSub.problemId] || {
                status: 'NONE',
                attempts: 0,
            };

            const startMs = new Date(activeCompetition.startTime || Date.now()).getTime();
            const nowMs = Date.now();
            const elapsedMins = Math.max(1, Math.round((nowMs - startMs) / (1000 * 60)));

            let updatedStatus: SolvedProblemStatus = { ...currentStatus };
            let newTotalScore = existingPart.totalScore || 0;
            let newPenalty = existingPart.totalPenaltyTimeMinutes || 0;

            if (problem) {
                if (newSub.status === 'Accepted') {
                    if (currentStatus.status !== 'AC') {
                        const attemptsBeforeAC = currentStatus.attempts + 1;
                        const scoreForProb = problem.points || 100;
                        const penaltyForProb = elapsedMins + (attemptsBeforeAC - 1) * 10;

                        updatedStatus = {
                            status: 'AC',
                            attempts: attemptsBeforeAC,
                            solvedTimeMinutes: elapsedMins,
                            scoreGained: scoreForProb,
                        };

                        newTotalScore += scoreForProb;
                        newPenalty += penaltyForProb;
                    }
                } else {
                    if (currentStatus.status !== 'AC') {
                        updatedStatus = {
                            status: 'WA',
                            attempts: currentStatus.attempts + 1,
                        };
                    }
                }
            }

            updatedParticipant = {
                ...existingPart,
                totalScore: newTotalScore,
                totalPenaltyTimeMinutes: newPenalty,
                solvedProblems: {
                    ...solvedDict,
                    [newSub.problemId]: updatedStatus,
                },
                lastActive: new Date().toISOString(),
            };

            setParticipants(prev => prev.map(p => p.id === existingPart.id ? updatedParticipant! : p));
        }

        // Persist submission and participant state to Prisma database
        fetch('/api/submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                submission: newSub,
                participant: updatedParticipant,
            }),
        }).catch(err => console.error('Failed to save submission to Prisma DB:', err));
    };

    const addCompetition = async (newComp: Competition) => {
        setCompetitions(prev => [newComp, ...prev]);

        try {
            const res = await fetch('/api/competitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ competition: newComp }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.competition) {
                    const formatted = formatCompetition(data.competition);
                    setCompetitions(prev => [
                        formatted,
                        ...prev.filter(c => c.id !== newComp.id && c.accessCode !== newComp.accessCode)
                    ]);
                }
            } else {
                const errData = await res.json();
                console.error('Failed to add competition to Prisma DB:', errData);
            }
        } catch (err) {
            console.error('Failed to add competition to Prisma DB:', err);
        }
    };

    const updateCompetition = async (updatedComp: Competition) => {
        setCompetitions(prev => prev.map(c => c.accessCode === updatedComp.accessCode || c.id === updatedComp.id ? updatedComp : c));

        try {
            const res = await fetch('/api/competitions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ competition: updatedComp }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.competition) {
                    const formatted = formatCompetition(data.competition);
                    setCompetitions(prev => prev.map(c => c.id === formatted.id || c.accessCode === formatted.accessCode ? formatted : c));
                }
            } else {
                const errData = await res.json();
                console.error('Failed to update competition in Prisma DB:', errData);
            }
        } catch (err) {
            console.error('Failed to update competition in Prisma DB:', err);
        }
    };

    const deleteCompetition = async (accessCodeOrId: string) => {
        setCompetitions(prev => prev.filter(c => c.accessCode !== accessCodeOrId && c.id !== accessCodeOrId));

        try {
            const param = accessCodeOrId.length > 15 && accessCodeOrId.includes('-')
                ? `id=${encodeURIComponent(accessCodeOrId)}`
                : `accessCode=${encodeURIComponent(accessCodeOrId)}`;
            const res = await fetch(`/api/competitions?${param}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const errData = await res.json();
                console.error('Failed to delete competition from Prisma DB:', errData);
            }
        } catch (err) {
            console.error('Failed to delete competition from Prisma DB:', err);
        }
    };

    const addProblem = async (competitionId: string, problem: Problem) => {
        setCompetitions(prev => prev.map(c => {
            if (c.id === competitionId || c.accessCode === competitionId) {
                return { ...c, problems: [...c.problems, problem] };
            }
            return c;
        }));

        try {
            const res = await fetch('/api/problems', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ competitionId, problem }),
            });
            if (!res.ok) {
                const errData = await res.json();
                console.error('Failed to create problem in Prisma DB:', errData);
            }
        } catch (err) {
            console.error('Failed to create problem in Prisma DB:', err);
        }
    };

    const updateProblem = async (problem: Problem) => {
        setCompetitions(prev => prev.map(c => ({
            ...c,
            problems: c.problems.map(p => p.id === problem.id ? problem : p),
        })));

        try {
            const res = await fetch('/api/problems', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ problem }),
            });
            if (!res.ok) {
                const errData = await res.json();
                console.error('Failed to update problem in Prisma DB:', errData);
            }
        } catch (err) {
            console.error('Failed to update problem in Prisma DB:', err);
        }
    };

    const deleteProblem = async (problemId: string) => {
        setCompetitions(prev => prev.map(c => ({
            ...c,
            problems: c.problems.filter(p => p.id !== problemId),
        })));

        try {
            const res = await fetch(`/api/problems?id=${encodeURIComponent(problemId)}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const errData = await res.json();
                console.error('Failed to delete problem from Prisma DB:', errData);
            }
        } catch (err) {
            console.error('Failed to delete problem from Prisma DB:', err);
        }
    };

    const broadcastAnnouncement = (compAccessCode: string, title: string, text: string) => {
        const newAnn: Announcement = {
            id: `ann-${Date.now()}`,
            title,
            text,
            timestamp: new Date().toISOString(),
            pinned: true,
            competitionId: activeCompetition?.id || '',
        };

        setCompetitions(prev => prev.map(c => {
            if (c.accessCode === compAccessCode) {
                return {
                    ...c,
                    announcements: [newAnn, ...(c.announcements || [])],
                };
            }
            return c;
        }));

        fetch('/api/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ compAccessCode, title, text }),
        }).catch(err => console.error('Failed to broadcast announcement to Prisma DB:', err));
    };

    return (
        <CompetitionContext.Provider
            value={{
                competitions,
                session,
                activeCompetition,
                participants,
                submissions,
                showCodeGate,
                setShowCodeGate,
                showAnnouncements,
                setShowAnnouncements,
                theme,
                setTheme,
                verifySession,
                logoutSession,
                addSubmission,
                addCompetition,
                updateCompetition,
                deleteCompetition,
                switchCompetition,
                addProblem,
                updateProblem,
                deleteProblem,
                broadcastAnnouncement,
            }}
        >
            {children}
        </CompetitionContext.Provider>
    );
};

export const useCompetition = () => {
    const context = useContext(CompetitionContext);
    if (!context) {
        throw new Error('useCompetition must be used within a CompetitionProvider');
    }
    return context;
};
