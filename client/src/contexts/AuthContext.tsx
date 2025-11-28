import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase as supabaseClient } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  username?: string;
  phone?: string;
  role?: string;
  balance?: string | number;
  isVerified?: boolean;
  isActive?: boolean;
  profession?: string;
  accountId?: string;
  accountNumber?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  fetchUserData: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = supabaseClient;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check current session
    const checkSession = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && sessionData?.session?.user) {
          setUser(sessionData.session.user);
          await fetchUserData(sessionData.session.user);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      try {
        if (session?.user) {
          setUser(session.user);
          await fetchUserData(session.user);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const fetchUserData = useCallback(async (authUser: User) => {
    try {
      if (!authUser?.id) return;

      const response = await fetch(`/api/users/supabase/${authUser.id}`);
      if (response.ok) {
        const profile = await response.json();
        setUserProfile({
          id: authUser.id,
          email: authUser.email,
          fullName: profile?.fullName || authUser.user_metadata?.full_name,
          username: profile?.username,
          phone: profile?.phone,
          role: profile?.role,
          balance: profile?.balance,
          isVerified: profile?.isVerified,
          isActive: profile?.isActive,
          profession: profile?.profession,
          accountId: profile?.accountId,
          accountNumber: profile?.accountNumber,
        });
      } else {
        setUserProfile({
          id: authUser.id,
          email: authUser.email,
          fullName: authUser.user_metadata?.full_name,
        });
      }
    } catch (error) {
      console.error('Fetch user data error:', error);
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);
      console.log('🔐 Starting login for:', email);

      // Use backend login endpoint (bypasses Supabase auth)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Login failed:', errorData.error);
        setLoading(false);
        return { error: errorData.error || 'Login failed' };
      }

      const loginData = await response.json();
      console.log('✅ Login successful! User:', loginData.user.email);

      // Create minimal user object
      const mockUser = {
        id: String(loginData.user.id),
        email: loginData.user.email,
        app_metadata: { role: loginData.user.role || 'customer' },
        user_metadata: {
          full_name: `${loginData.user.firstName} ${loginData.user.lastName}`
        },
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as any;

      setUser(mockUser);
      
      // Set user profile directly from login response - no need to fetch again
      setUserProfile({
        id: String(loginData.user.id),
        email: loginData.user.email,
        fullName: `${loginData.user.firstName} ${loginData.user.lastName}`,
        role: loginData.user.role || 'customer',
        balance: '0'
      });
      
      setLoading(false);
      return {};

    } catch (error) {
      setLoading(false);
      console.error('❌ Login error:', error);
      return { error: 'Network error - please try again' };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any): Promise<{ error?: string }> => {
    try {
      if (!supabase) {
        return { error: 'Authentication service unavailable' };
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Signup failed' };
    }
  };

  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
        setUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, signUp, signOut, fetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
