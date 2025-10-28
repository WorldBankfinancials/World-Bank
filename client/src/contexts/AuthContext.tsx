import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from '../lib/supabase';
// Removed fallback auth - using only real Supabase authentication
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
      if (!supabaseUser) {
        console.log('⚠️ No Supabase user provided to fetchUserData');
        return;
      }

      console.log('🔍 Fetching user data for:', supabaseUser.email);

      // Fetch user from banking system using Supabase UUID
      const response = await fetch(`/api/users/supabase/${supabaseUser.id}`);
      
      if (response.ok) {
        const bankingUser = await response.json();
        
        const userProfile: UserProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
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
          avatarUrl: bankingUser.avatarUrl || supabaseUser.user_metadata?.avatar_url,
          balance: bankingUser.balance
        };

        console.log('✅ User profile loaded');
        setUserProfile(userProfile);
      } else {
        console.log('ℹ️ User not in banking system, needs registration');
        // Set minimal profile for new users
        const minimalProfile: UserProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          fullName: supabaseUser.user_metadata?.full_name || 'New User',
          role: 'customer',
          isVerified: false,
          isActive: false,
          isOnline: true
        };
        setUserProfile(minimalProfile);
      }
    } catch (error) {
      console.error('❌ Failed to fetch user data:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);

      // Clear any existing session first
      await supabase.auth.signOut();
      
      // Use real Supabase authentication
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
        
        // Store session data
        setUser(data.user);
        
        // Fetch user profile data
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
      // Clear all session data for maximum security
      localStorage.removeItem('worldbank_session');
      localStorage.removeItem('worldbank_user_profile');
      localStorage.removeItem('worldbank_auth_timestamp');
      sessionStorage.clear();

      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);

      console.log('🔐 Secure logout completed - all session data cleared');
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  useEffect(() => {
    const initializeSecureSession = async () => {
      try {
        console.log('🔐 Initializing banking session');

        // Check for valid Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session?.user && session.expires_at) {
          // Check if session is still valid
          const expirationTime = new Date(session.expires_at * 1000);
          const now = new Date();

          if (expirationTime > now) {
            console.log('✅ Valid session found for:', session.user.email);
            setUser(session.user);
            await fetchUserData(session.user);
          } else {
            console.log('⏰ Session expired');
            await supabase.auth.signOut();
            setUser(null);
            setUserProfile(null);
          }
        } else {
          console.log('ℹ️ No active session');
          setUser(null);
          setUserProfile(null);
        }

        setLoading(false);

      } catch (error) {
        console.error('Session initialization error:', error);
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    };

    initializeSecureSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in');
        setUser(session.user);
        await fetchUserData(session.user);
        setLoading(false);

      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 User signed out');
        setUser(null);
        setUserProfile(null);
        setLoading(false);

      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token refreshed');
        setUser(session.user);
        setLoading(false);

      } else if (event === 'INITIAL_SESSION') {
        // Don't clear data on initial session check
        console.log('ℹ️ Initial session check');
        setLoading(false);
      }
    });

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