import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

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

interface User {
  id: string;
  email: string;
  role?: string;
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

async function loadProfileFromSupabase(userId: string): Promise<UserProfile | null> {
  try {
    const [wbUser, wbProfile, wbAccount] = await Promise.all([
      supabase.from('wb_users').select('*').eq('id', userId).maybeSingle(),
      supabase.from('wb_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('wb_accounts').select('account_number, balance, account_type, id')
        .eq('user_id', userId).eq('status', 'active').limit(1).maybeSingle(),
    ]);

    const u = wbUser.data;
    const p = wbProfile.data;
    const a = wbAccount.data;

    if (!u && !p) return null;

    return {
      id: userId,
      email: u?.email || '',
      fullName: p?.full_name || `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || u?.email?.split('@')[0] || '',
      username: u?.email?.split('@')[0] || '',
      phone: p?.phone_number || '',
      role: u?.role || 'customer',
      balance: a?.balance ?? '0',
      isVerified: u?.kyc_status === 'approved',
      isActive: u?.account_status === 'active',
      profession: p?.occupation || '',
      accountId: a?.id || '',
      accountNumber: a?.account_number || '****1234',
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from Supabase (handles token refresh automatically)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u: User = {
          id: session.user.id,
          email: session.user.email || '',
          role: session.user.app_metadata?.role || 'customer',
        };
        setUser(u);

        // Load cached profile immediately while fetching fresh
        const cached = localStorage.getItem('userProfile');
        if (cached) {
          try { setUserProfile(JSON.parse(cached)); } catch {}
        }

        // Store token for authenticatedFetch usage elsewhere in the app
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('user', JSON.stringify(u));

        const profile = await loadProfileFromSupabase(session.user.id);
        if (profile) {
          setUserProfile(profile);
          localStorage.setItem('userProfile', JSON.stringify(profile));
        }
      }
      setLoading(false);
    });

    // Keep session in sync across tabs / token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const u: User = {
          id: session.user.id,
          email: session.user.email || '',
          role: session.user.app_metadata?.role || 'customer',
        };
        setUser(u);
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('user', JSON.stringify(u));
      } else if (event === 'TOKEN_REFRESHED' && session) {
        localStorage.setItem('token', session.access_token);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        localStorage.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = useCallback(async (authUser: User) => {
    if (!authUser?.id) return;
    const profile = await loadProfileFromSupabase(authUser.id);
    if (profile) {
      setUserProfile(profile);
      localStorage.setItem('userProfile', JSON.stringify(profile));
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setLoading(false);
        return { error: error.message || 'Invalid email or password' };
      }

      if (!data.session || !data.user) {
        setLoading(false);
        return { error: 'Login failed — no session returned' };
      }

      const u: User = {
        id: data.user.id,
        email: data.user.email || email,
        role: data.user.app_metadata?.role || 'customer',
      };
      setUser(u);
      localStorage.setItem('token', data.session.access_token);
      localStorage.setItem('refresh_token', data.session.refresh_token || '');
      localStorage.setItem('user', JSON.stringify(u));

      // Load profile from Supabase tables
      const profile = await loadProfileFromSupabase(data.user.id);
      if (profile) {
        setUserProfile(profile);
        localStorage.setItem('userProfile', JSON.stringify(profile));
      } else {
        // Fallback from Supabase auth metadata if wb_profiles not populated yet
        const fallback: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: data.user.user_metadata?.full_name || email.split('@')[0],
          phone: data.user.user_metadata?.phone || '',
          role: data.user.app_metadata?.role || 'customer',
          balance: '0',
          isVerified: false,
          isActive: true,
          accountNumber: '****1234',
        };
        setUserProfile(fallback);
        localStorage.setItem('userProfile', JSON.stringify(fallback));
      }

      setLoading(false);
      return {};
    } catch (error: any) {
      setLoading(false);
      return { error: error?.message || 'Network error during login' };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${metadata?.firstName || ''} ${metadata?.lastName || ''}`.trim() || email.split('@')[0],
            first_name: metadata?.firstName || '',
            last_name: metadata?.lastName || '',
            phone: metadata?.phone || '',
          },
        },
      });

      if (error) return { error: error.message };
      if (!data.user) return { error: 'Registration failed' };

      // Insert profile row in wb_profiles
      if (metadata?.firstName || metadata?.lastName) {
        await supabase.from('wb_profiles').upsert({
          user_id: data.user.id,
          full_name: `${metadata.firstName || ''} ${metadata.lastName || ''}`.trim(),
          first_name: metadata.firstName || '',
          last_name: metadata.lastName || '',
          phone_number: metadata.phone || '',
          occupation: metadata.profession || '',
          city: metadata.city || '',
          state: metadata.state || '',
          country: metadata.country || '',
          postal_code: metadata.postalCode || '',
        });
      }

      return {};
    } catch (error: any) {
      return { error: error?.message || 'Signup failed' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setUserProfile(null);
      try {
        const { queryClient } = await import('@/lib/queryClient');
        queryClient.clear();
      } catch {}
      window.location.replace('/login');
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
