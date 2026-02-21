'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';

interface UserContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    refreshUser: () => Promise<void>;
    signOut: () => Promise<void>;
    isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
    children,
    initialUser = null,
}: {
    children: React.ReactNode;
    initialUser?: User | null;
}) {
    const [user, setUser] = useState<User | null>(initialUser);
    const [loading, setLoading] = useState(!initialUser);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    const fetchUserProfile = useCallback(async (userId: string) => {
        try {
            const { data, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.error('Error fetching user profile:', profileError);
                return null;
            }

            return data as User;
        } catch (err) {
            console.error('Error in fetchUserProfile:', err);
            return null;
        }
    }, [supabase]);

    const initializeUser = useCallback(async () => {
        try {
            if (!initialUser) setLoading(true);
            setError(null);

            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

            if (authError || !authUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            const profile = await fetchUserProfile(authUser.id);

            if (profile) {
                setUser(profile);
            } else {
                setUser({
                    id: authUser.id,
                    email: authUser.email || '',
                    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
                    role: 'member',
                    is_active: true,
                    daily_target: 10,
                    created_at: authUser.created_at,
                    updated_at: authUser.updated_at || authUser.created_at,
                });
            }
        } catch (err) {
            console.error('Error initializing user:', err);
            setError('Failed to initialize user');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [supabase, fetchUserProfile, initialUser]);

    const refreshUser = useCallback(async () => {
        await initializeUser();
    }, [initializeUser]);

    const signOut = useCallback(async () => {
        try {
            setLoading(true);
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) throw signOutError;
            setUser(null);
            window.location.href = '/login';
        } catch (err) {
            console.error('Error signing out:', err);
            setError('Failed to sign out');
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        // If we have an initial user, we don't need to fetch immediately
        if (!initialUser) {
            initializeUser();
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setLoading(false);
                } else if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
                    const profile = await fetchUserProfile(session.user.id);
                    if (profile) {
                        setUser(profile);
                    }
                    setLoading(false);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, initializeUser, fetchUserProfile, initialUser]);

    const value = {
        user,
        loading,
        error,
        refreshUser,
        signOut,
        isAdmin: user?.role === 'admin',
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
}
