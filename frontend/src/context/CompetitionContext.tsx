'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Competition, 
  Problem, 
  Participant, 
  Submission, 
  UserSession, 
  SolvedProblemStatus 
} from '@/types';
import { 
  INITIAL_COMPETITIONS, 
  INITIAL_PARTICIPANTS, 
  INITIAL_SUBMISSIONS 
} from '@/data/initialCompetitions';

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

export const CompetitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [competitions, setCompetitions] = useState<Competition[]>(() => {
    if (typeof window === 'undefined') return INITIAL_COMPETITIONS;
    const saved = localStorage.getItem('wecode_competitions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_COMPETITIONS;
  });

  const [session, setSession] = useState<UserSession | null>(() => {
    if (typeof window === 'undefined') {
      return {
        accessCode: 'WEC2026',
        participantId: 'part-1',
        name: 'Adithyan Nair',
        collegeId: 'KNR22CS014',
        enteredAt: new Date().toISOString()
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
      enteredAt: new Date().toISOString()
    };
  });

  const [participants, setParticipants] = useState<Participant[]>(() => {
    if (typeof window === 'undefined') return INITIAL_PARTICIPANTS;
    const saved = localStorage.getItem('wecode_participants');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_PARTICIPANTS;
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    if (typeof window === 'undefined') return INITIAL_SUBMISSIONS;
    const saved = localStorage.getItem('wecode_submissions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_SUBMISSIONS;
  });

  const [showCodeGate, setShowCodeGate] = useState<boolean>(false);
  const [showAnnouncements, setShowAnnouncements] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Sync state to localStorage on changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wecode_competitions', JSON.stringify(competitions));
    }
  }, [competitions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (session) {
        localStorage.setItem('wecode_session', JSON.stringify(session));
      } else {
        localStorage.removeItem('wecode_session');
      }
    }
  }, [session]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wecode_participants', JSON.stringify(participants));
    }
  }, [participants]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wecode_submissions', JSON.stringify(submissions));
    }
  }, [submissions]);

  const activeCompetition = competitions.find(
    c => c.accessCode.toUpperCase() === (session?.accessCode || 'WEC2026').toUpperCase()
  ) || competitions[0];

  const verifySession = (newSession: UserSession) => {
    setSession(newSession);
    setShowCodeGate(false);

    const existing = participants.find(p => p.collegeId === newSession.collegeId);
    if (!existing) {
      const newParticipant: Participant = {
        id: newSession.participantId,
        name: newSession.name,
        collegeId: newSession.collegeId,
        accessCode: newSession.accessCode,
        totalScore: 0,
        totalPenaltyTimeMinutes: 0,
        solvedProblems: {},
        lastActive: new Date().toISOString()
      };
      setParticipants(prev => [...prev, newParticipant]);
    }
  };

  const logoutSession = () => {
    setSession(null);
    setShowCodeGate(true);
  };

  const addSubmission = (newSub: Submission) => {
    setSubmissions(prev => [newSub, ...prev]);

    if (!session) return;

    setParticipants(prev => prev.map(p => {
      if (p.collegeId !== session.collegeId && p.id !== session.participantId) {
        return p;
      }

      const problem = activeCompetition.problems.find(prob => prob.id === newSub.problemId);
      if (!problem) return p;

      const currentStatus: SolvedProblemStatus = p.solvedProblems[newSub.problemId] || {
        status: 'NONE',
        attempts: 0,
      };

      const startMs = new Date(activeCompetition.startTime).getTime();
      const nowMs = Date.now();
      const elapsedMins = Math.max(1, Math.round((nowMs - startMs) / (1000 * 60)));

      let updatedStatus: SolvedProblemStatus = { ...currentStatus };
      let newTotalScore = p.totalScore;
      let newPenalty = p.totalPenaltyTimeMinutes;

      if (newSub.status === 'Accepted') {
        if (currentStatus.status !== 'AC') {
          const attemptsBeforeAC = currentStatus.attempts + 1;
          const scoreForProb = problem.points;
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

      return {
        ...p,
        totalScore: newTotalScore,
        totalPenaltyTimeMinutes: newPenalty,
        solvedProblems: {
          ...p.solvedProblems,
          [newSub.problemId]: updatedStatus,
        },
        lastActive: new Date().toISOString(),
      };
    }));
  };

  const addCompetition = (newComp: Competition) => {
    setCompetitions(prev => [newComp, ...prev]);
  };

  const updateCompetition = (updatedComp: Competition) => {
    setCompetitions(prev => prev.map(c => c.accessCode === updatedComp.accessCode ? updatedComp : c));
  };

  const broadcastAnnouncement = (compAccessCode: string, title: string, text: string) => {
    setCompetitions(prev => prev.map(c => {
      if (c.accessCode === compAccessCode) {
        return {
          ...c,
          announcements: [
            {
              id: `ann-${Date.now()}`,
              title,
              text,
              timestamp: new Date().toISOString(),
              pinned: true,
            },
            ...c.announcements,
          ]
        };
      }
      return c;
    }));
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
