'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { CompetitionProvider, useCompetition } from '@/context/CompetitionContext';
import { Header } from '@/components/Header';
import { AccessCodeGate } from '@/components/AccessCodeGate';
import { AnnouncementsModal } from '@/components/AnnouncementsModal';
import { authClient } from '@/lib/auth-client';
import { ReactQueryProvider } from '@/providers/react-query-provider';

function InnerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: adminSession } = authClient.useSession();

    const isAdminRoute = pathname?.startsWith('/admin') ?? false;
    const isAdminLoggedIn = !!adminSession?.user;

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

            {!isAdminRoute && !isAdminLoggedIn && (showCodeGate || !session) && (
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
        <ReactQueryProvider>
            <CompetitionProvider>
                <InnerLayout>{children}</InnerLayout>
            </CompetitionProvider>
        </ReactQueryProvider>
    );
}
