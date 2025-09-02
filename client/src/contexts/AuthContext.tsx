import React, { createContext, useContext, useEffect, useState } from 'react';
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
      if (!supabaseUser) {
        setUserProfile(null);
        return;
      }
      
      console.log('🔍 Fetching user data for:', supabaseUser.email);
      
      // Try to fetch from Supabase user_profiles table directly
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      console.log('📊 Profile fetch result:', { profileData, error: error?.message });

      if (profileData && !error) {
        console.log('✅ Found user profile in database:', profileData);
        setUserProfile({
          id: profileData.id,
          email: supabaseUser.email || '',
          fullName: profileData.full_name || supabaseUser.email?.split('@')[0] || 'User',
          phone: profileData.phone_number,
          role: 'customer',
          isVerified: profileData.email_verified || false,
          isActive: true,
          isOnline: true,
          country: profileData.country,
          city: profileData.city,
          state: profileData.state
        });
      } else if (error?.message?.includes('PGRST116')) {
        console.log('📝 No profile found, creating one in database');
        // Try to create a profile in the database
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: supabaseUser.id,
            full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
            email_verified: supabaseUser.email_confirmed_at ? true : false,
            country: 'United States',
            preferred_language: 'en'
          })
          .select()
          .single();

        if (newProfile && !insertError) {
          console.log('✅ Created new user profile:', newProfile);
          setUserProfile({
            id: newProfile.id,
            email: supabaseUser.email || '',
            fullName: newProfile.full_name,
            role: 'customer',
            isVerified: newProfile.email_verified || false,
            isActive: true,
            isOnline: true,
            country: newProfile.country
          });
        } else {
          console.log('⚠️ Failed to create profile, using fallback:', insertError?.message);
          // Fallback to basic profile without database
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
      } else {
        console.log('📝 Database table may not exist, using fallback profile');
        // Create a basic profile for when database isn't set up yet
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
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📋 Initial session check:', !!session?.user, session?.user?.email);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, !!session?.user);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user).finally(() => setLoading(false));
      } else {
        setUserProfile(null);
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