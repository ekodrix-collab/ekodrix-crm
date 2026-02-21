'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, CheckCircle2, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function SetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 2500);
        } catch (err: any) {
            console.error('Error setting password:', err);
            setError(err.message || 'Failed to set password');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl"></div>

                <Card className="w-full max-w-md text-center shadow-2xl border-none rounded-3xl overflow-hidden relative z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                    <CardHeader className="pt-12">
                        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <CardTitle className="text-3xl font-extrabold tracking-tight">Security Updated!</CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400 text-lg mt-2">
                            Your password has been set successfully. We're getting your workspace ready...
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-12 pt-6 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0F172A] p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mt-40 -mr-40 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 -mb-40 -ml-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

            <Card className="w-full max-w-md shadow-2xl border-white/5 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden relative z-10">
                <CardHeader className="space-y-4 pt-10 px-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-2">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold text-white tracking-tight">
                            Secure Your Account
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-base mt-2">
                            Welcome! Please set a strong password to complete your account setup.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-10">
                    <form onSubmit={handleSetPassword} className="space-y-6 mt-4">
                        {error && (
                            <Alert className="bg-red-500/10 border-red-500/50 text-red-200 rounded-2xl">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password" title="password" className="text-slate-300 font-semibold ml-1">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white h-14 rounded-2xl px-6 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" title="confirmPassword" className="text-slate-300 font-semibold ml-1">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="bg-white/5 border-white/10 text-white h-14 rounded-2xl px-6 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        Complete Setup
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                )}
                            </Button>
                        </div>

                        <p className="text-center text-slate-500 text-xs mt-6 leading-relaxed">
                            Password must be at least 8 characters long and include a mix of letters and numbers for maximum security.
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
