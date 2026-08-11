'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function AdminLoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || '/admin';
    const { data: session } = authClient.useSession();

    useEffect(() => {
        if (session?.user) {
            router.replace(redirectTo);
        }
    }, [session, redirectTo, router]);

    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState('Wecode Admin');
    const [email, setEmail] = useState('admin@wecode.com');
    const [password, setPassword] = useState('secret1234');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignUp) {
                const { error: signUpErr } = await authClient.signUp.email({
                    email,
                    password,
                    name,
                });

                if (signUpErr) {
                    setError(signUpErr.message || 'Registration failed. Try signing in.');
                    setLoading(false);
                    return;
                }
            }

            const { error: signInErr } = await authClient.signIn.email({
                email,
                password,
            });

            if (signInErr) {
                setError(signInErr.message || 'Invalid email or password credentials.');
                setLoading(false);
                return;
            }

            router.push(redirectTo);
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during authentication.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-4">
            <Card className="w-full max-w-md animate-fadeIn">
                {/* Glow accent */}
                <div className="h-1.5 bg-gradient-to-r from-primary-500 via-primary-400 to-yellow-500" />

                <div className="p-6 sm:p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-400 mb-1">
                            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
                            Admin Portal Authentication
                        </h1>
                        <p className="text-xs text-zinc-400">
                            Sign in with your admin credentials to access contest controls. <span className="text-primary-400 font-medium">No competition access code required.</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1 uppercase">
                                    Admin Name
                                </label>
                                <Input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="py-2.5 h-10"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-mono font-bold text-zinc-400 mb-1 uppercase">
                                Admin Email
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="admin@wecode.gcek.ac.in"
                                    className="pl-9 py-2.5 h-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-mono font-bold text-zinc-400 mb-1 uppercase">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••••••"
                                    className="pl-9 py-2.5 h-10 font-mono"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Admin Account' : 'Sign In as Admin'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="pt-3 border-t border-zinc-800 text-center space-y-2">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-xs text-zinc-400 hover:text-primary-300 transition-colors block w-full cursor-pointer"
                        >
                            {isSignUp ? 'Already have an admin account? Sign In' : 'Need to register a new admin account? Sign Up'}
                        </button>
                        <div className="pt-1 border-t border-zinc-800/60">
                            <Link
                                href="/problems"
                                className="text-xs text-primary-400/90 hover:text-primary-300 font-semibold underline underline-offset-2 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                                Are you a contest participant? Enter Competition Access Code
                            </Link>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
