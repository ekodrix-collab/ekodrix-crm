'use client';

import { useState } from 'react';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Timer, ShieldAlert, CheckCircle, Mail, LogOut, Loader2 } from 'lucide-react';
import type { User } from '@/types';
import { useUser } from '@/hooks/use-user';

interface PendingApprovalProps {
    user: User;
}

export function PendingApproval({ user }: PendingApprovalProps) {
    const { signOut } = useUser();
    const [signingOut, setSigningOut] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleSignOut = async () => {
        setSigningOut(true);
        await signOut();
        setShowLogoutDialog(false);
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#051110] p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-[600px] w-[600px] rounded-full bg-emerald-600/10 blur-[120px]"></div>

            <Card className="w-full max-w-xl shadow-[0_0_50px_rgba(16,185,129,0.1)] border-white/10 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden relative z-10 p-6 sm:p-12 text-center">
                <div className="mx-auto w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-8 relative">
                    <Timer className="w-12 h-12 text-primary animate-pulse" />
                    <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-2 shadow-lg">
                        <ShieldAlert className="w-5 h-5 text-white" />
                    </div>
                </div>

                <CardTitle className="text-4xl font-extrabold text-white tracking-tight mb-4">
                    Awaiting Approval
                </CardTitle>

                <CardDescription className="text-emerald-100/60 text-lg leading-relaxed mb-10 max-w-md mx-auto">
                    Welcome to the Ekodrix team, <span className="text-emerald-400 font-bold">{user.name}</span>! Your request for access is currently being reviewed by an administrator.
                </CardDescription>

                <div className="grid grid-cols-1 gap-6 mb-12">
                    <div className="flex items-start gap-4 text-left p-4 rounded-3xl bg-white/5 border border-white/5">
                        <div className="mt-1 bg-primary/20 p-2 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Account Created</h4>
                            <p className="text-emerald-100/40 text-xs">Your identity has been verified.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 text-left p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20">
                        <div className="mt-1 bg-primary/20 p-2 rounded-xl">
                            <Timer className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Review in Progress</h4>
                            <p className="text-emerald-100/60 text-xs">An admin will grant you access shortly.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 text-left p-4 rounded-3xl bg-white/5 border border-white/5 opacity-50">
                        <div className="mt-1 bg-emerald-500/10 p-2 rounded-xl">
                            <Mail className="w-5 h-5 text-emerald-500/40" />
                        </div>
                        <div>
                            <h4 className="text-emerald-500/40 font-bold text-sm">Ready to Work</h4>
                            <p className="text-emerald-100/20 text-xs">You'll receive full access once approved.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        variant="outline"
                        className="rounded-2xl h-12 px-8 border-emerald-500/20 text-emerald-100/80 hover:bg-emerald-500/10 hover:text-white"
                        onClick={() => window.location.reload()}
                    >
                        Refresh Status
                    </Button>
                    <Button
                        variant="ghost"
                        className="rounded-2xl h-12 px-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => setShowLogoutDialog(true)}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </Card>

            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will be redirected to the login page and will need to sign in again to access the application.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={signingOut}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleSignOut(); }}
                            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                            disabled={signingOut}
                        >
                            {signingOut ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Logging out...
                                </>
                            ) : 'Log out'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
