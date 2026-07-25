'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, Mail, KeyRound, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

function AdminLoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || '/admin';

    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState('Wecode Admin');
    const [email, setEmail] = useState('admin@wecode.gcek.ac.in');
    const [password, setPassword] = useState('Admin@123456');
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
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
                {/* Glow accent */}
                <div className="h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500"></div>

                <div className="p-6 sm:p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1">
                            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
                            Admin Portal Authentication
                        </h1>
                        <p className="text-xs text-zinc-400">
                            Sign in with your Better Auth credentials to access contest controls.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1 uppercase">
                                    Admin Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-mono font-bold text-zinc-400 mb-1 uppercase">
                                Admin Email
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="admin@wecode.gcek.ac.in"
                                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-mono font-bold text-zinc-400 mb-1 uppercase">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••••••"
                                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
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
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                        >
                            <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Admin Account' : 'Sign In as Admin'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="pt-3 border-t border-zinc-800 text-center">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-xs text-zinc-400 hover:text-amber-300 transition-colors"
                        >
                            {isSignUp ? 'Already have an admin account? Sign In' : 'Need to register a new admin account? Sign Up'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div className="py-20 text-center text-xs text-zinc-500">Loading authentication form...</div>}>
            <AdminLoginForm />
        </Suspense>
    );
}
