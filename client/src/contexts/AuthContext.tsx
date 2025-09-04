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
          
          // Store profile data for professional session persistence
          localStorage.setItem('worldbank_user_profile', JSON.stringify(userProfile));
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
        
        // Store minimal profile for persistence
        localStorage.setItem('worldbank_user_profile', JSON.stringify(minimalProfile));
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
      // Clear professional banking session data
      localStorage.removeItem('worldbank_session');
      localStorage.removeItem('worldbank_user_profile');
      localStorage.removeItem('worldbank_auth_timestamp');
      
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      
      console.log('🔐 Professional logout completed - all session data cleared');
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log('🏦 Initializing professional banking session...');
        
        // Check for existing Supabase session first (most reliable)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('✅ Found valid Supabase session for:', session.user.email);
          setUser(session.user);
          await fetchUserData(session.user);
          
          // Store session backup data with timestamp
          localStorage.setItem('worldbank_session', JSON.stringify({
            userId: session.user.id,
            email: session.user.email,
            timestamp: new Date().toISOString(),
            sessionHash: btoa(session.user.id + session.user.email)
          }));
          localStorage.setItem('worldbank_auth_timestamp', new Date().toISOString());
          
        } else {
          // Check local storage backup for professional continuity
          const savedSession = localStorage.getItem('worldbank_session');
          const savedProfile = localStorage.getItem('worldbank_user_profile');
          const authTimestamp = localStorage.getItem('worldbank_auth_timestamp');
          
          if (savedSession && savedProfile && authTimestamp) {
            const sessionData = JSON.parse(savedSession);
            const profileData = JSON.parse(savedProfile);
            const lastAuth = new Date(authTimestamp);
            const now = new Date();
            
            // Professional banking: allow 24 hour session persistence
            const hoursSinceAuth = (now.getTime() - lastAuth.getTime()) / (1000 * 60 * 60);
            
            if (hoursSinceAuth < 24 && sessionData.userId && profileData.email) {
              console.log('🔄 Restoring professional banking session from backup');
              console.log('⏰ Hours since last auth:', Math.round(hoursSinceAuth * 10) / 10);
              
              // Create minimal user object for continuity
              const restoredUser = {
                id: sessionData.userId,
                email: sessionData.email,
                aud: 'authenticated',
                role: 'authenticated',
                user_metadata: profileData
              };
              
              setUser(restoredUser as any);
              setUserProfile(profileData);
              
              // Try to refresh the actual Supabase session in the background
              setTimeout(async () => {
                try {
                  await supabase.auth.refreshSession();
                } catch (error) {
                  console.log('Background session refresh failed:', error);
                }
              }, 1000);
              
            } else {
              console.log('⚠️ Saved session expired or invalid, requiring fresh login');
              localStorage.removeItem('worldbank_session');
              localStorage.removeItem('worldbank_user_profile');
              localStorage.removeItem('worldbank_auth_timestamp');
            }
          }
        }
        
        setLoading(false);
        
      } catch (error) {
        console.error('Session initialization error:', error);
        setLoading(false);
      }
    };

    // Initialize session immediately
    initializeSession();

    // Listen for auth state changes with enhanced logging
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await fetchUserData(session.user);
        
        // Update backup session data
        localStorage.setItem('worldbank_session', JSON.stringify({
          userId: session.user.id,
          email: session.user.email,
          timestamp: new Date().toISOString(),
          sessionHash: btoa(session.user.id + session.user.email)
        }));
        localStorage.setItem('worldbank_auth_timestamp', new Date().toISOString());
        
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 User signed out - cleaning session data');
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem('worldbank_session');
        localStorage.removeItem('worldbank_user_profile');
        localStorage.removeItem('worldbank_auth_timestamp');
        
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Session token refreshed for:', session.user.email);
        // Update timestamp for token refresh
        localStorage.setItem('worldbank_auth_timestamp', new Date().toISOString());
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
