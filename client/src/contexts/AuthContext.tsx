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
      if (!supabaseUser) return;
      
      console.log('🔍 Fetching user data for:', supabaseUser.email);
      
      // Try to fetch existing user from your banking system using Supabase UUID
      try {
        const response = await fetch(`/api/users/supabase/${supabaseUser.id}`);
        if (response.ok) {
          const bankingUser = await response.json();
          
          // User exists in banking system - use real data
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
          
          console.log('✅ User profile loaded from banking system');
          setUserProfile(userProfile);
          return;
        }
      } catch (error) {
        console.log('User not found in banking system, creating new profile...');
      }
      
      // User doesn't exist in banking system - create new banking profile
      try {
        const response = await fetch('/api/users/create-supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supabaseUserId: supabaseUser.id,
            email: supabaseUser.email,
            fullName: supabaseUser.user_metadata?.full_name || 'Banking Customer'
          })
        });
        
        if (response.ok) {
          const newBankingUser = await response.json();
          const userProfile: UserProfile = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            fullName: newBankingUser.fullName,
            phone: newBankingUser.phone,
            accountNumber: newBankingUser.accountNumber,
            accountId: newBankingUser.accountId,
            profession: newBankingUser.profession,
            dateOfBirth: newBankingUser.dateOfBirth,
            address: newBankingUser.address,
            city: newBankingUser.city,
            state: newBankingUser.state,
            country: newBankingUser.country,
            postalCode: newBankingUser.postalCode,
            annualIncome: newBankingUser.annualIncome,
            idType: newBankingUser.idType,
            idNumber: newBankingUser.idNumber,
            transferPin: newBankingUser.transferPin,
            role: newBankingUser.role,
            isVerified: newBankingUser.isVerified,
            isOnline: newBankingUser.isOnline,
            isActive: newBankingUser.isActive,
            avatarUrl: newBankingUser.avatarUrl || supabaseUser.user_metadata?.avatar_url,
            balance: newBankingUser.balance
          };
          
          console.log('✅ New banking profile created');
          setUserProfile(userProfile);
        }
      } catch (error) {
        console.error('Failed to create banking profile:', error);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // Set minimal profile from Supabase user
      if (supabaseUser) {
        const minimalProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          role: 'customer',
          isVerified: true,
          isActive: true,
          isOnline: true
        };
        setUserProfile(minimalProfile);
      }
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);
      
      // Use real Supabase authentication only
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error.message);
        return { error: error.message };
      }

      if (data.user) {
        // CHECK FOR ADMIN APPROVAL BEFORE ALLOWING ACCESS
        const approvalStatus = data.user.user_metadata?.approval_status;
        const isApproved = data.user.user_metadata?.is_approved;
        
        if (approvalStatus === 'pending' || isApproved === false) {
          // Sign out the user immediately
          await supabase.auth.signOut();
          console.log('❌ User not approved yet:', email);
          return { 
            error: 'Your registration is pending admin approval. Please wait for approval email before logging in.' 
          };
        }
        
        setUser(data.user);
        await fetchUserData(data.user);
        return {};
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
        console.log('🔐 Initializing secure banking session - strict security mode');
        
        // Clear any old session data on app start for maximum security
        localStorage.removeItem('worldbank_session');
        localStorage.removeItem('worldbank_user_profile');
        localStorage.removeItem('worldbank_auth_timestamp');
        sessionStorage.clear();
        
        // Only check for valid Supabase session - no backup restoration
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user && session.expires_at) {
          // Check if session is still valid and not expired
          const expirationTime = new Date(session.expires_at * 1000);
          const now = new Date();
          
          if (expirationTime > now) {
            console.log('✅ Found valid active Supabase session for:', session.user.email);
            console.log('⏰ Session expires at:', expirationTime.toLocaleString());
            
            setUser(session.user);
            await fetchUserData(session.user);
          } else {
            console.log('🔐 Session expired - forcing fresh login');
            await supabase.auth.signOut();
            setUser(null);
            setUserProfile(null);
          }
        } else {
          console.log('🔐 No valid session found - user must login');
          setUser(null);
          setUserProfile(null);
        }
        
        setLoading(false);
        
      } catch (error) {
        console.error('Secure session initialization error:', error);
        // On any error, force clean state
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    };

    // Initialize secure session immediately
    initializeSecureSession();

    // Listen for auth state changes with strict security
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Secure auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in - establishing secure session');
        setUser(session.user);
        await fetchUserData(session.user);
        
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 User signed out - clearing all data');
        setUser(null);
        setUserProfile(null);
        localStorage.clear();
        sessionStorage.clear();
        
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token refreshed - maintaining secure session');
        // Keep session active but don't store backup data
        
      } else {
        // Any other event or invalid session - clear everything
        console.log('🔐 Invalid session state - forcing logout');
        setUser(null);
        setUserProfile(null);
        localStorage.clear();
        sessionStorage.clear();
      }
      
      setLoading(false);
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
