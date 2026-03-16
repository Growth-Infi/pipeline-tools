'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';


interface AuthContextType {
    user: User | null,
    loading: boolean,
    signInWithGoogle: () => Promise<void>,
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = (props: { children: React.ReactNode }) => {
    const children = props.children
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then((response) => {
            if (!mounted) return;
            const session = response.data.session;
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const authListener = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            mounted = false;
            authListener.data.subscription.unsubscribe();
        };
    }, []);

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/workspace`
            }
        });
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);