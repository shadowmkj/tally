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
    timestamp: any;
    pinned?: boolean;
    competitionId?: string;
};

export type TestCaseResult = PrismaTestCaseResult;

export type Problem = Omit<PrismaProblem, 'tags' | 'constraints' | 'starterTemplates' | 'competitionId' | 'createdAt' | 'updatedAt' | 'acceptanceRate'> & {
    tags: any;
    constraints: any;
    starterTemplates: any;
    sampleTestCases: SampleTestCase[];
    testCases: TestCase[];
    acceptanceRate?: number | null;
    competitionId?: string;
    createdAt?: Date;
    updatedAt?: Date;
};

export type Participant = Omit<PrismaParticipant, 'solvedProblems' | 'competitionId' | 'createdAt' | 'updatedAt'> & {
    solvedProblems: any;
    competitionId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
};

export type Submission = Omit<PrismaSubmission, 'timestamp' | 'errorLog' | 'participantId' | 'createdAt'> & {
    timestamp: any;
    errorLog?: string | null;
    participantId?: string | null;
    createdAt?: Date;
    results?: any;
};

export type Competition = Omit<PrismaCompetition, 'startTime' | 'createdAt' | 'updatedAt'> & {
    startTime: any;
    announcements: Announcement[];
    problems: Problem[];
    createdAt?: Date;
    updatedAt?: Date;
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
    broadcastAnnouncement: (compAccessCode: string, title: string, text: string) => void;
}

const CompetitionContext = createContext<CompetitionContextType | undefined>(undefined);

function formatCompetition(comp: any): Competition {
    return {
        ...comp,
        startTime: typeof comp.startTime === 'string' ? comp.startTime : new Date(comp.startTime || Date.now()).toISOString(),
        announcements: (comp.announcements || []).map((ann: any): Announcement => ({
            ...ann,
            timestamp: typeof ann.timestamp === 'string' ? ann.timestamp : new Date(ann.timestamp || Date.now()).toISOString(),
        })),
        problems: (comp.problems || []).map((prob: any): Problem => {
            let tags = prob.tags;
            let constraints = prob.constraints;
            let starterTemplates = prob.starterTemplates;

            if (typeof tags === 'string') {
                try { tags = JSON.parse(tags); } catch (e) { tags = []; }
            }
            if (typeof constraints === 'string') {
                try { constraints = JSON.parse(constraints); } catch (e) { constraints = []; }
            }
            if (typeof starterTemplates === 'string') {
                try { starterTemplates = JSON.parse(starterTemplates); } catch (e) { starterTemplates = {}; }
            }

            return {
                ...prob,
                tags: Array.isArray(tags) ? tags : [],
                constraints: Array.isArray(constraints) ? constraints : [],
                starterTemplates: starterTemplates && typeof starterTemplates === 'object' ? starterTemplates : {},
                sampleTestCases: prob.sampleTestCases || [],
                testCases: prob.testCases || [],
            };
        }),
    };
}

function formatParticipant(part: any): Participant {
    let solvedProblems = part.solvedProblems;
    if (typeof solvedProblems === 'string') {
        try { solvedProblems = JSON.parse(solvedProblems); } catch (e) { solvedProblems = {}; }
    }
    return {
        ...part,
        solvedProblems: solvedProblems && typeof solvedProblems === 'object' ? solvedProblems : {},
        lastActive: typeof part.lastActive === 'string' ? part.lastActive : new Date(part.lastActive || Date.now()).toISOString(),
    };
}

function formatSubmission(sub: any): Submission {
    return {
        ...sub,
        timestamp: typeof sub.timestamp === 'string' ? sub.timestamp : new Date(sub.timestamp || Date.now()).toISOString(),
        participantId: sub.participantId || '',
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
} as any;

export const CompetitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    const [session, setSession] = useState<UserSession | null>(() => {
        if (typeof window === 'undefined') {
            return {
                accessCode: 'WEC2026',
                participantId: 'part-1',
                name: 'Adithyan Nair',
                collegeId: 'KNR22CS014',
                enteredAt: new Date().toISOString(),
            };
        }
        const saved = localStorage.getItem('wecode_session');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* fallback */ }
        }
        return {
            accessCode: 'WEC2026',
            participantId: 'part-1',
            name: 'Adithyan Nair',
            collegeId: 'KNR22CS014',
            enteredAt: new Date().toISOString(),
        };
    });

    const [showCodeGate, setShowCodeGate] = useState<boolean>(false);
    const [showAnnouncements, setShowAnnouncements] = useState<boolean>(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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

    const activeCompetition = competitions.find(
        c => c.accessCode.toUpperCase() === (session?.accessCode || 'WEC2026').toUpperCase()
    ) || competitions[0] || EMPTY_COMPETITION;

    const verifySession = (newSession: UserSession) => {
        setSession(newSession);
        setShowCodeGate(false);

        const existing = participants.find(p => p.collegeId === newSession.collegeId);
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
                competitionId: activeCompetition?.id || null,
            } as any;
            setParticipants(prev => [...prev, participantToSync]);
        } else {
            participantToSync = {
                ...existing,
                accessCode: newSession.accessCode,
                lastActive: new Date().toISOString(),
            } as any;
            setParticipants(prev => prev.map(p => p.collegeId === newSession.collegeId ? participantToSync : p));
        }

        // Persist participant to Prisma database
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

        const existingPart = participants.find(p => p.collegeId === session.collegeId || p.id === session.participantId);
        let updatedParticipant: Participant | null = null;

        if (existingPart) {
            const problem = (activeCompetition?.problems || []).find((prob: any) => prob.id === newSub.problemId);
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
            } as any;

            setParticipants(prev => prev.map(p => p.id === existingPart.id || p.collegeId === existingPart.collegeId ? updatedParticipant! : p));
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

    const addCompetition = (newComp: Competition) => {
        setCompetitions(prev => [newComp, ...prev]);

        fetch('/api/competitions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ competition: newComp }),
        }).catch(err => console.error('Failed to add competition to Prisma DB:', err));
    };

    const updateCompetition = (updatedComp: Competition) => {
        setCompetitions(prev => prev.map(c => c.accessCode === updatedComp.accessCode ? updatedComp : c));

        fetch('/api/competitions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ competition: updatedComp }),
        }).catch(err => console.error('Failed to update competition in Prisma DB:', err));
    };

    const broadcastAnnouncement = (compAccessCode: string, title: string, text: string) => {
        const newAnn: Announcement = {
            id: `ann-${Date.now()}`,
            title,
            text,
            timestamp: new Date().toISOString(),
            pinned: true,
            competitionId: activeCompetition?.id || '',
        } as any;

        setCompetitions(prev => prev.map(c => {
            if (c.accessCode === compAccessCode) {
                return {
                    ...c,
                    announcements: [newAnn, ...((c as any).announcements || [])],
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
