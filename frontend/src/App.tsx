import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AccessCodeGate } from './components/AccessCodeGate';
import { ProblemList } from './components/ProblemList';
import { ProblemWorkspace } from './components/ProblemWorkspace';
import { Leaderboard } from './components/Leaderboard';
import { AdminPortal } from './components/AdminPortal';
import { AnnouncementsModal } from './components/AnnouncementsModal';
import { 
  Competition, 
  Problem, 
  Participant, 
  Submission, 
  UserSession, 
  SolvedProblemStatus 
} from './types';
import { 
  INITIAL_COMPETITIONS, 
  INITIAL_PARTICIPANTS, 
  INITIAL_SUBMISSIONS 
} from './data/initialCompetitions';

export default function App() {
  // State 1: Competitions list
  const [competitions, setCompetitions] = useState<Competition[]>(() => {
    const saved = localStorage.getItem('wecode_competitions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_COMPETITIONS;
  });

  // State 2: Session info
  const [session, setSession] = useState<UserSession | null>(() => {
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

  // Active competition based on session access code
  const activeCompetition = competitions.find(
    c => c.accessCode.toUpperCase() === (session?.accessCode || 'WEC2026').toUpperCase()
  ) || competitions[0];

  // State 3: View management
  const [currentView, setCurrentView] = useState<'problems' | 'ide' | 'leaderboard' | 'admin'>('problems');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(
    activeCompetition.problems[0] || null
  );

  // State 4: Participants & Submissions
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem('wecode_participants');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_PARTICIPANTS;
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('wecode_submissions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_SUBMISSIONS;
  });

  // State 5: Modals
  const [showCodeGate, setShowCodeGate] = useState<boolean>(false);
  const [showAnnouncements, setShowAnnouncements] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('wecode_competitions', JSON.stringify(competitions));
  }, [competitions]);

  useEffect(() => {
    if (session) {
      localStorage.setItem('wecode_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('wecode_session');
    }
  }, [session]);

  useEffect(() => {
    localStorage.setItem('wecode_participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('wecode_submissions', JSON.stringify(submissions));
  }, [submissions]);

  // Handle Session Login / Access Code Verification
  const handleVerifySession = (newSession: UserSession) => {
    setSession(newSession);
    setShowCodeGate(false);

    // Register participant into active list if not already present
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

    // Default to problem list view
    setCurrentView('problems');
  };

  // Handle Submissions
  const handleNewSubmission = (newSub: Submission) => {
    setSubmissions(prev => [newSub, ...prev]);

    // Update Participant Score & Solved Matrix
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

      // Calculate time offset in minutes since competition start
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

  // Admin Handlers
  const handleAddCompetition = (newComp: Competition) => {
    setCompetitions(prev => [newComp, ...prev]);
  };

  const handleUpdateCompetition = (updatedComp: Competition) => {
    setCompetitions(prev => prev.map(c => c.accessCode === updatedComp.accessCode ? updatedComp : c));
  };

  const handleBroadcastAnnouncement = (compAccessCode: string, title: string, text: string) => {
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

  // Get current participant status map
  const currentParticipant = participants.find(p => p.collegeId === session?.collegeId);
  const solvedStatus = currentParticipant?.solvedProblems || {};

  // Filter submissions for current problem
  const problemSubmissions = submissions.filter(
    s => s.problemId === selectedProblem?.id && s.collegeId === session?.collegeId
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-zinc-950 flex flex-col w-full max-w-full overflow-x-hidden">
      
      {/* Navigation Header */}
      <Header
        activeCompetition={activeCompetition}
        session={session}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenCodeGate={() => setShowCodeGate(true)}
        onLogoutSession={() => {
          setSession(null);
          setShowCodeGate(true);
        }}
        theme={theme}
        setTheme={setTheme}
        unreadAnnouncementsCount={activeCompetition.announcements.length}
        onOpenAnnouncements={() => setShowAnnouncements(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
        {currentView === 'problems' && (
          <ProblemList
            competition={activeCompetition}
            solvedStatus={solvedStatus}
            onSelectProblem={(p) => {
              setSelectedProblem(p);
              setCurrentView('ide');
            }}
            onOpenLeaderboard={() => setCurrentView('leaderboard')}
          />
        )}

        {currentView === 'ide' && selectedProblem && (
          <ProblemWorkspace
            problem={selectedProblem}
            session={session}
            onBackToList={() => setCurrentView('problems')}
            onSubmitFinished={handleNewSubmission}
            previousSubmissions={problemSubmissions}
          />
        )}

        {currentView === 'leaderboard' && (
          <Leaderboard
            competition={activeCompetition}
            participants={participants}
            onOpenCodeGate={() => setShowCodeGate(true)}
          />
        )}

        {currentView === 'admin' && (
          <AdminPortal
            competitions={competitions}
            onAddCompetition={handleAddCompetition}
            onUpdateCompetition={handleUpdateCompetition}
            onBroadcastAnnouncement={handleBroadcastAnnouncement}
          />
        )}
      </main>

      {/* Access Code Verification Modal Gate */}
      {(showCodeGate || !session) && (
        <AccessCodeGate
          competitions={competitions}
          onVerifySession={handleVerifySession}
          onCloseModal={() => setShowCodeGate(false)}
          initialCode={session?.accessCode || 'WEC2026'}
        />
      )}

      {/* Live Broadcast Announcements Modal */}
      {showAnnouncements && (
        <AnnouncementsModal
          announcements={activeCompetition.announcements}
          onClose={() => setShowAnnouncements(false)}
        />
      )}

    </div>
  );
}
