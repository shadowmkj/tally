import { useState, useEffect } from 'react';
import { useCompetition } from '@/context/CompetitionContext';

export function useSelectedCompetition(searchParams: { get: (name: string) => string | null } | null) {
    const { competitions } = useCompetition();
    const compParam = searchParams?.get('comp') || '';
    const [selectedCompCode, setSelectedCompCode] = useState<string>(compParam);

    useEffect(() => {
        const comp = searchParams?.get('comp') || '';
        setSelectedCompCode((prev) => {
            if (comp && competitions.some(c => c.accessCode.toUpperCase() === comp.toUpperCase() || c.id === comp)) {
                const found = competitions.find(c => c.accessCode.toUpperCase() === comp.toUpperCase() || c.id === comp);
                if (found) return found.accessCode;
            }
            if (!prev && competitions.length > 0) {
                return competitions[0].accessCode;
            }
            return prev;
        });
    }, [competitions, searchParams]);

    return [selectedCompCode, setSelectedCompCode] as const;
}
