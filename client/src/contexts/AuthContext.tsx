import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
  user: UserProfile | null;
  userProfile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  loading: boolean;
  fetchUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // console.log('🔐 Auth Configuration: supabase (Environment: production)');

  const fetchUserData = async (supabaseEmail?: string) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (supabaseEmail) {
        headers['X-Supabase-Email'] = supabaseEmail;
      }

      const response = await fetch(`/api/user?t=${Date.now()}`, {
        credentials: 'include',
        headers,
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const userData = await response.json();
      // console.log('🔄 FRESH API Response - User data:', userData);
      // console.log('🔄 Forcing userProfile state update with:', userData);
      
      // Force immediate update for admin changes - always sync profile data
      setUserProfile(userData);
      // console.log('✅ UserProfile state updated - Admin changes synced');
    } catch (error) {
      // Silent user data fetching
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Silent auth error handling
        return { error: authError.message };
      }

      if (authData.user) {
        setUser({
          id: authData.user.id,
          email: authData.user.email || '',
        });
        
        // Special handling for your Liu Wei account
        if (authData.user.email === 'bankmanagerworld5@gmail.com') {
          await fetchUserData(authData.user.email);
        } else {
          // Create new banking account for other Supabase users
          await createNewSupabaseAccount(authData.user);
        }
        
        return {};
      }
      
      return { error: 'Login failed' };
    } catch (error) {
      // Silent login error handling
      return { error: 'Login failed' };
    }
  };

  const createNewSupabaseAccount = async (supabaseUser: any) => {
    try {
      const response = await fetch('/api/users/create-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          supabaseUserId: supabaseUser.id,
          email: supabaseUser.email,
          fullName: supabaseUser.user_metadata?.full_name || 'Banking Customer'
        })
      });

      if (response.ok) {
        const newUserData = await response.json();
        setUserProfile(newUserData);
      }
    } catch (error) {
      // console.error('Failed to create new banking account:', error);
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      });

      if (authError) {
        // Silent registration error handling
        return { error: authError.message };
      }

      if (authData.user) {
        return { error: undefined };
      }

      return { error: 'Registration failed' };
    } catch (error) {
      // Silent registration error handling
      return { error: 'Registration failed' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      // Silent sign out error handling
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          });
          
          if (session.user.email === 'bankmanagerworld5@gmail.com') {
            await fetchUserData(session.user.email);
          }
        }
      } catch (error) {
        // console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          });
          
          if (session.user.email === 'bankmanagerworld5@gmail.com') {
            await fetchUserData(session.user.email);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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
        fetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}