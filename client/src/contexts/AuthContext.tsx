import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

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
  fetchUserData: (supabaseUser?: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (supabaseUser?: User) => {
    if (!supabaseUser) return;
    try {
      const response = await fetch(`/api/users/supabase/${supabaseUser.id}`);
      if (response.ok) {
        const bankingUser = await response.json();
        setUserProfile({ id: supabaseUser.id, email: supabaseUser.email || "", ...bankingUser });
      } else {
        // Create user if not exists
        const createResponse = await fetch("/api/users/create-supabase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabaseUserId: supabaseUser.id,
            email: supabaseUser.email,
            fullName: supabaseUser.user_metadata?.full_name || "Banking Customer",
          }),
        });
        if (createResponse.ok) {
          const newBankingUser = await createResponse.json();
          setUserProfile({ id: supabaseUser.id, email: supabaseUser.email || "", ...newBankingUser });
        }
      }
    } catch (error) {
      console.error("Fetch user data error:", error);
      setUserProfile({
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split("@")[0] || "User",
        role: "customer",
        isVerified: true,
        isActive: true,
        isOnline: true,
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        setUser(data.user);
        await fetchUserData(data.user);
        return {};
      }
      return { error: "Authentication failed" };
    } catch (err: any) {
      return { error: err.message || "Network error" };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
      if (error) return { error: error.message };
      if (data.user) {
        setUser(data.user);
        await fetchUserData(data.user);
        return {};
      }
      return { error: "Sign-up failed" };
    } catch (err: any) {
      return { error: err.message || "Network error" };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        fetchUserData(data.session.user);
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserData(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, signIn, signUp, signOut, loading, fetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
