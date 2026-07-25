'use client';

import React from 'react';
import { CompetitionProvider, useCompetition } from '@/context/CompetitionContext';
import { Header } from '@/components/Header';
import { AccessCodeGate } from '@/components/AccessCodeGate';
import { AnnouncementsModal } from '@/components/AnnouncementsModal';

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { 
    competitions, 
    session, 
    activeCompetition, 
    showCodeGate, 
    setShowCodeGate, 
    showAnnouncements, 
    setShowAnnouncements, 
    verifySession 
  } = useCompetition();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-zinc-950 flex flex-col w-full max-w-full overflow-x-hidden">
      <Header />

      <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
        {children}
      </main>

      {(showCodeGate || !session) && (
        <AccessCodeGate
          competitions={competitions}
          onVerifySession={verifySession}
          onCloseModal={() => setShowCodeGate(false)}
          initialCode={session?.accessCode || 'WEC2026'}
        />
      )}

      {showAnnouncements && (
        <AnnouncementsModal
          announcements={activeCompetition.announcements}
          onClose={() => setShowAnnouncements(false)}
        />
      )}
    </div>
  );
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <CompetitionProvider>
      <InnerLayout>{children}</InnerLayout>
    </CompetitionProvider>
  );
}
