import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from '../lib/supabase';
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
      const currentUser = supabaseUser || user;
      if (!currentUser) {
        return;
      }

      console.log('🔍 Fetching fresh user data for:', currentUser.email);

      // Wait a moment for trigger to complete if this is a new user
      await new Promise(resolve => setTimeout(resolve, 800));

      const { authenticatedFetch } = await import('@/lib/queryClient');
      
      const createUserProfile = (bankingUser: any): UserProfile => ({
        id: currentUser.id,
        email: currentUser.email || '',
        fullName: bankingUser.fullName,
        phone: bankingUser.phone,
        accountNumber: bankingUser.accountNumber,
        accountId: bankingUser.accountId,
        profession: bankingUser.profession,
        dateOfBirth: bankingUser.dateOfBirth,
        address: bankingUser.address,
        city: bankingUser.city,
        state: bankingUser.state,
        country: bankingUser.country,
        postalCode: bankingUser.postalCode,
        annualIncome: bankingUser.annualIncome,
        idType: bankingUser.idType,
        idNumber: bankingUser.idNumber,
        transferPin: bankingUser.transferPin,
        role: bankingUser.role,
        isVerified: bankingUser.isVerified,
        isOnline: bankingUser.isOnline,
        isActive: bankingUser.isActive,
        avatarUrl: bankingUser.avatarUrl || currentUser.user_metadata?.avatar_url,
        balance: bankingUser.balance
      });

      const response = await authenticatedFetch(`/api/users/supabase/${currentUser.id}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const bankingUser = await response.json();
        console.log('✅ User profile loaded and updated');
        setUserProfile(createUserProfile(bankingUser));
      } else {
        // Retry after another second for new users
        await new Promise(resolve => setTimeout(resolve, 1500));

        const retryResponse = await authenticatedFetch(`/api/users/supabase/${currentUser.id}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (retryResponse.ok) {
          const bankingUser = await retryResponse.json();
          console.log('✅ User profile loaded and updated');
          setUserProfile(createUserProfile(bankingUser));
        }
      }
    } catch (error: unknown) {
      // Log non-WebSocket errors, silently handle WebSocket context errors
      if (error instanceof Error && !error.message.includes('WebSocket')) {
        console.warn('Failed to fetch user data:', error.message);
      }
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);

      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error.message);
        setLoading(false);
        return { error: error.message };
      }

      if (data.user && data.session) {
        console.log('✅ Authentication successful for:', email);

        setUser(data.user);

        await fetchUserData(data.user);

        setLoading(false);
        return {};
      }

      setLoading(false);
      return { error: "Authentication failed" };
    } catch (error) {
      console.error("Sign in error:", error);
      setLoading(false);
      return { error: "Network error occurred" };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.signUp({
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
      localStorage.clear();
      sessionStorage.clear();

      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);

      console.log('🔐 Logout completed');
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      try {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (session?.user && session.expires_at) {
            const expirationTime = new Date(session.expires_at * 1000);
            const now = new Date();

            if (expirationTime > now) {
              setUser(session.user);
              await fetchUserData(session.user);
            } else {
              await supabase.auth.signOut();
              setUser(null);
              setUserProfile(null);
            }
          } else {
            setUser(null);
            setUserProfile(null);
          }
        } catch (wsError: unknown) {
          // Silently handle WebSocket insecure context errors in development
          if (wsError instanceof Error && !wsError.message.includes('WebSocket')) {
            console.error('Session error:', wsError.message);
          }
        }

        setLoading(false);

      } catch (error) {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    };

    initializeSession();

    let subscription: any = null;
    let userChannel: any = null;

    try {
      const authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setLoading(false);
          } else if (event === 'INITIAL_SESSION' && session) {
            fetchUserData(session.user);
          } else if (event === 'SIGNED_IN' && session) {
            setUser(session.user);
            await fetchUserData(session.user);
            setLoading(false);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            setUser(session.user);
            await fetchUserData(session.user);
            setLoading(false);
          } else if (event === 'INITIAL_SESSION') {
            setLoading(false);
          }
        } catch (e) {
          // Silently handle event errors
        }
      });
      subscription = authSubscription.data?.subscription;
    } catch (e) {
      // Silently handle WebSocket insecure context errors
    }

    try {
      userChannel = supabase
        .channel('user_profile_changes')
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'bank_users' },
          async (payload: any) => {
            if (user) {
              await fetchUserData(user);
            }
          }
        )
        .subscribe();
    } catch (e) {
      // Silently handle realtime subscription errors
    }

    return () => {
      try {
        subscription?.unsubscribe();
      } catch (e) {}
      try {
        supabase.removeChannel(userChannel);
      } catch (e) {}
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