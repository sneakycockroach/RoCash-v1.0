import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.ts';
import { getProfile } from '../api/profile.ts';
import type { Profile, ApiResponse } from '../types.ts';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isOnline: boolean;
  signIn: (email: string, password: string) => Promise<ApiResponse<Session>>;
  signUp: (email: string, password: string) => Promise<ApiResponse<{ user: User | null; session: Session | null }>>;
  signOut: () => Promise<ApiResponse<boolean>>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isOnline: true,
  signIn: async () => ({ data: null, error: 'Auth not initialized' }),
  signUp: async () => ({ data: null, error: 'Auth not initialized' }),
  signOut: async () => ({ data: null, error: 'Auth not initialized' }),
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    const res = await getProfile();
    if (res.data) {
      setProfile(res.data);
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initial session load
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile().finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string): Promise<ApiResponse<Session>> => {
    try {
      if (!email || !password) {
        return { data: null, error: 'Please enter both email and password.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Friendly error for wrong credentials
        if (
          error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('invalid grant') ||
          error.status === 400
        ) {
          return {
            data: null,
            error: "That email or password doesn't look right. Try again.",
          };
        }
        return { data: null, error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        await fetchProfile();
      }

      return { data: data.session, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  };

  const signUp = async (
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: User | null; session: Session | null }>> => {
    try {
      if (!email || !password) {
        return { data: null, error: 'Please provide both email and password.' };
      }

      // Minimum password length 8
      if (password.length < 8) {
        return { data: null, error: 'Password must be at least 8 characters long.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        await fetchProfile();
      }

      return {
        data: { user: data.user, session: data.session },
        error: null,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  };

  const signOut = async (): Promise<ApiResponse<boolean>> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { data: null, error: error.message };
      }
      setSession(null);
      setUser(null);
      setProfile(null);
      return { data: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isOnline,
        signIn,
        signUp,
        signOut,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
