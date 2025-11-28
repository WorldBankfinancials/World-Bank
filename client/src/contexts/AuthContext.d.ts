import React from "react";
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
    signIn: (email: string, password: string) => Promise<{
        error?: string;
    }>;
    signUp: (email: string, password: string, metadata?: any) => Promise<{
        error?: string;
    }>;
    signOut: () => Promise<void>;
    loading: boolean;
    fetchUserData: () => Promise<void>;
}
export declare function AuthProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare const useAuth: () => AuthContextType;
export {};
