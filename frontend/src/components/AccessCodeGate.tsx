'use client';

import React, { useState, useRef, useEffect } from 'react';
import { KeyRound, ShieldCheck, ArrowRight } from 'lucide-react';
import type { Competition, UserSession } from '@/context/CompetitionContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface AccessCodeGateProps {
    competitions: Competition[];
    onVerifySession: (session: UserSession) => void;
    onCloseModal?: () => void;
    initialCode?: string;
}

export const AccessCodeGate: React.FC<AccessCodeGateProps> = ({
    competitions,
    onVerifySession,
    onCloseModal,
    initialCode = '',
}) => {
    const [accessCode, setAccessCode] = useState<string>(initialCode || '');
    const [name, setName] = useState<string>('Milan');
    const [collegeId, setCollegeId] = useState<string>('KNR23CS038');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Auto-focus first empty box or box 0 on mount
        const firstEmpty = accessCode.length < 6 ? accessCode.length : 0;
        inputRefs.current[firstEmpty]?.focus();
    }, []);

    const handleBoxChange = (index: number, val: string) => {
        const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
        setErrorMessage('');

        if (cleaned.length > 1) {
            // Handled paste or fast typing
            const codeArr = accessCode.padEnd(6, ' ').split('');
            let nextIndex = index;
            for (let i = 0; i < cleaned.length && index + i < 6; i++) {
                codeArr[index + i] = cleaned[i];
                nextIndex = index + i + 1;
            }
            const newCode = codeArr.join('').trimEnd().slice(0, 6);
            setAccessCode(newCode);
            const focusIdx = Math.min(nextIndex, 5);
            inputRefs.current[focusIdx]?.focus();
            return;
        }

        const char = cleaned.slice(-1);
        const codeArr = accessCode.padEnd(6, ' ').split('');
        codeArr[index] = char || ' ';
        const newCode = codeArr.join('').trimEnd().slice(0, 6);
        setAccessCode(newCode);

        if (char && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            const charAtIndex = accessCode[index];
            if (!charAtIndex || charAtIndex === ' ') {
                if (index > 0) {
                    e.preventDefault();
                    const codeArr = accessCode.padEnd(6, ' ').split('');
                    codeArr[index - 1] = ' ';
                    setAccessCode(codeArr.join('').trimEnd());
                    inputRefs.current[index - 1]?.focus();
                }
            } else {
                e.preventDefault();
                const codeArr = accessCode.padEnd(6, ' ').split('');
                codeArr[index] = ' ';
                setAccessCode(codeArr.join('').trimEnd());
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        if (!pasted) return;
        setAccessCode(pasted);
        setErrorMessage('');
        const focusIdx = Math.min(pasted.length, 5);
        inputRefs.current[focusIdx]?.focus();
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        if (accessCode.length < 6) {
            setErrorMessage('Access code must be exactly 6 alphanumeric characters.');
            return;
        }

        if (!name.trim()) {
            setErrorMessage('Please enter your Name / Handle.');
            return;
        }

        if (!collegeId.trim()) {
            setErrorMessage('Please enter your College Register Number / ID.');
            return;
        }

        const targetComp = competitions.find(c => c.accessCode.toUpperCase() === accessCode.toUpperCase());

        if (!targetComp) {
            setErrorMessage(`No competition found matching code "${accessCode}". Please check with Wecode Admins or select an available contest below.`);
            return;
        }

        const session: UserSession = {
            accessCode: targetComp.accessCode,
            participantId: `part-${Date.now()}`,
            name: name.trim(),
            collegeId: collegeId.trim().toUpperCase(),
            enteredAt: new Date().toISOString(),
        };

        onVerifySession(session);
        if (onCloseModal) onCloseModal();
    };

    return (
        <Dialog open={true} onOpenChange={(open) => { if (!open && onCloseModal) onCloseModal(); }}>
            <DialogContent className="p-0">
                {/* Top Glow Bar */}
                <div className="h-1.5 bg-gradient-to-r from-primary-500 via-primary-400 to-yellow-500" />

                <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-400 mb-1">
                            <KeyRound className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <h2 className="text-2xl font-black text-zinc-100 tracking-tight">
                            Wecode Competition Access
                        </h2>
                        <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                            Enter the <span className="text-primary-400 font-semibold font-mono">6-digit access code</span> created by organizers to join your competition.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleJoin} className="space-y-4">

                        {/* 6-Digit Code Typable Box Inputs */}
                        <div>
                            <label className="block text-xs font-mono font-bold text-zinc-300 mb-3 uppercase tracking-wider text-center">
                                6-Digit Access Code
                            </label>

                            <div className="flex justify-center gap-1.5 sm:gap-2">
                                {Array.from({ length: 6 }).map((_, i) => {
                                    const char = accessCode[i] || '';
                                    const isFilled = Boolean(char && char !== ' ');
                                    return (
                                        <input
                                            key={i}
                                            ref={(el) => { inputRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="text"
                                            maxLength={6}
                                            value={isFilled ? char : ''}
                                            onChange={(e) => handleBoxChange(i, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(i, e)}
                                            onPaste={handlePaste}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="•"
                                            className={`w-9 h-11 xs:w-10 xs:h-12 sm:w-12 sm:h-14 rounded-xl border text-center text-lg sm:text-xl font-mono font-black uppercase transition-all outline-none focus:outline-none ${isFilled
                                                ? 'bg-primary-500/10 border-primary-500 text-primary-300 shadow-sm shadow-primary-500/10 focus:ring-2 focus:ring-primary-500/40'
                                                : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 placeholder:text-zinc-600 focus:border-primary-500/80 focus:ring-2 focus:ring-primary-500/30'
                                                }`}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Participant Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                                    Participant Name
                                </label>
                                <Input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Rishal P"
                                    required
                                    className="font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                                    College Register No. / ID
                                </label>
                                <Input
                                    type="text"
                                    value={collegeId}
                                    onChange={(e) => setCollegeId(e.target.value)}
                                    placeholder="e.g. KNR22CS078"
                                    required
                                    className="font-mono uppercase"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center animate-shake">
                                {errorMessage}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            id="join-contest-btn"
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                        >
                            <span>Verify & Join Competition</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Seamless Notice Footer & Admin Link */}
                    <div className="flex flex-col items-center justify-center gap-1.5 text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
                            <span>Participant login uses 6-Digit Access Code. No passwords needed.</span>
                        </div>
                        <a
                            href="/admin/login"
                            onClick={() => { if (onCloseModal) onCloseModal(); }}
                            className="text-primary-400/90 hover:text-primary-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                        >
                            Are you an Admin? Sign in to Admin Portal (No competition code required)
                        </a>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
};
