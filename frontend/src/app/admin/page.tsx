'use client';

import { useCompetition } from '@/context/CompetitionContext';
import { AdminPortal } from '@/components/AdminPortal';

export default function AdminPage() {
    const {
        competitions,
        addCompetition,
        updateCompetition,
        broadcastAnnouncement
    } = useCompetition();

    return (
        <AdminPortal
            competitions={competitions}
            onAddCompetition={addCompetition}
            onUpdateCompetition={updateCompetition}
            onBroadcastAnnouncement={broadcastAnnouncement}
        />
    );
}
