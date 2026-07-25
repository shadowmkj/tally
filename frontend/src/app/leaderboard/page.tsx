'use client';

import { useCompetition } from '@/context/CompetitionContext';
import { Leaderboard } from '@/components/Leaderboard';

export default function LeaderboardPage() {
  const { activeCompetition, participants, setShowCodeGate } = useCompetition();

  return (
    <Leaderboard
      competition={activeCompetition}
      participants={participants}
      onOpenCodeGate={() => setShowCodeGate(true)}
    />
  );
}
