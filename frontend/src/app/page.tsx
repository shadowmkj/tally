'use client';

import { useCompetition } from '@/context/CompetitionContext';
import { ProblemList } from '@/components/ProblemList';

export default function HomePage() {
    const { activeCompetition, participants, session } = useCompetition();

    const currentParticipant = participants.find(p => p.collegeId === session?.collegeId);
    const solvedStatus = currentParticipant?.solvedProblems || {};

    return (
        <ProblemList
            competition={activeCompetition}
            solvedStatus={solvedStatus}
        />
    );
}
