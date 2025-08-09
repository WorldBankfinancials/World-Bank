import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fallbackAuth } from '../lib/auth-fallback';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  accountNumber?: string;
  accountId?: string;
  profession?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  annualIncome?: string;
  idType?: string;
  idNumber?: string;
  transferPin?: string;
  role?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  isActive?: boolean;
  avatarUrl?: string;
  balance?: number;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  loading: boolean;
  fetchUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (supabaseUser?: User) => {
    try {
      if (!supabaseUser) return;
      
      // Try to fetch from API first (hybrid approach)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Supabase-Email': supabaseUser.email || '',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      };
      
      const response = await fetch(`/api/user?t=${Date.now()}`, {
        credentials: 'include',
        headers,
        cache: 'no-cache'
      });

      if (response.ok) {
        const userData = await response.json();
        setUserProfile(userData);
      } else {
        // Fallback to Supabase profile data
        setUserProfile({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          role: 'customer',
          isVerified: supabaseUser.email_confirmed_at ? true : false,
          isActive: true,
          isOnline: true
        });
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // Set minimal profile from Supabase user
      if (supabaseUser) {
        setUserProfile({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          role: 'customer',
          isVerified: true,
          isActive: true,
          isOnline: true
        });
      }
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);
      
      // Try Supabase first
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.log('Supabase auth failed, trying fallback:', error.message);
          throw error;
        }

        if (data.user) {
          setUser(data.user);
          await fetchUserData(data.user);
          return {};
        }
      } catch (supabaseError) {
        console.log('Using fallback authentication due to Supabase connectivity issues');
        
        // Use fallback authentication
        const { data, error } = await fallbackAuth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { error: error.message };
        }

        if (data?.user) {
          setUser(data.user as User);
          await fetchUserData(data.user as User);
          return {};
        }
      }

      return { error: "Authentication failed" };
    } catch (error) {
      console.error("Sign in error:", error);
      return { error: "Network error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: any): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error("Sign up error:", error);
      return { error: "Network error occurred" };
    }
  };

  const signOut = async () => {
    try {
      // Try both Supabase and fallback signout
      await Promise.allSettled([
        supabase.auth.signOut(),
        fallbackAuth.signOut()
      ]);
      
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try Supabase first
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchUserData(session.user);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log('Supabase session check failed, trying fallback');
      }

      // Try fallback session
      try {
        const { data } = await fallbackAuth.getSession();
        if (data.session?.user) {
          setUser(data.session.user as User);
          await fetchUserData(data.session.user as User);
        }
      } catch (error) {
        console.log('No fallback session found');
      }

      setLoading(false);
    };

    initAuth();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Listen for fallback auth changes
    const fallbackSub = fallbackAuth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user as User);
        await fetchUserData(session.user as User);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      fallbackSub.data.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        signIn,
        signUp,
        signOut,
        loading,
        fetchUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};