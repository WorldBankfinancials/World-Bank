import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

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

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth session on mount
  useEffect(() => {
    console.log('🔍 AuthContext: Checking for existing session...');
    
    // Check for existing session from localStorage (set by login)
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.id && parsedUser?.email) {
          console.log('✅ AuthContext: Restoring session from localStorage', { email: parsedUser.email });
          setUser(parsedUser);
          // Store JWT token for API calls
          localStorage.setItem('jwt_token', storedToken);
        }
      } catch (e) {
        console.error('❌ AuthContext: Failed to parse stored user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('jwt_token');
      }
    }

    setLoading(false);
  }, []);

  const fetchUserData = useCallback(async (authUser: User) => {
    if (!authUser?.id) {
      console.warn('⚠️ AuthContext: No user ID provided to fetchUserData');
      return;
    }
    try {
      const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ AuthContext: No token available for API call');
        return;
      }

      console.log('📥 AuthContext: Fetching user profile...');
      const response = await fetch(`/api/users/${authUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.warn(`⚠️ AuthContext: Failed to fetch user profile (${response.status})`);
        return;
      }

      const profile = await response.json();
      if (profile && typeof profile === 'object') {
        console.log('✅ AuthContext: User profile loaded');
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('❌ AuthContext: Failed to fetch user profile:', error);
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);
      console.log('🔐 AuthContext: Signing in user:', email);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        console.error('❌ AuthContext: Login failed:', errorData);
        setLoading(false);
        return { error: errorData.error || `Login failed (${response.status})` };
      }

      const data = await response.json();

      if (!data || data.error) {
        console.error('❌ AuthContext: Invalid login response:', data);
        setLoading(false);
        return { error: data?.error || 'Login failed' };
      }

      // CRITICAL: Validate token is Supabase JWT (3 parts: header.payload.signature)
      if (!data.token || !data.token.includes('.')) {
        console.error('❌ AuthContext: Invalid token format - not a JWT');
        setLoading(false);
        return { error: 'Invalid authentication token format' };
      }

      if (data.token && data.user) {
        console.log('✅ AuthContext: Login successful, storing Supabase JWT');
        // Store Supabase JWT token for API calls
        localStorage.setItem('jwt_token', data.token);
        // Keep backwards compatibility
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('refresh_token', data.refreshToken || '');
        
        const userObj: User = { 
          id: data.user.id, 
          email: data.user.email,
          role: data.user.role 
        };
        setUser(userObj);
        
        // Fetch full user profile
        await fetchUserData(userObj);
        
        setLoading(false);
        return {};
      }

      setLoading(false);
      return { error: 'Authentication failed - invalid response' };
    } catch (error: any) {
      console.error('❌ AuthContext: Login exception:', error);
      setLoading(false);
      return { error: error?.message || 'Network error' };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any): Promise<{ error?: string }> => {
    try {
      console.log('📝 AuthContext: Registering new user:', email);
      const response = await fetch('/api/auth/register-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password,
          firstName: metadata?.firstName || email.split('@')[0],
          lastName: metadata?.lastName || 'User',
          phone: metadata?.phone || '',
          dateOfBirth: metadata?.dateOfBirth || '',
          address: metadata?.address || '',
          city: metadata?.city || '',
          state: metadata?.state || '',
          country: metadata?.country || '',
          postalCode: metadata?.postalCode || '',
          profession: metadata?.profession || '',
          annualIncome: metadata?.annualIncome || '',
          idType: metadata?.idType || '',
          idNumber: metadata?.idNumber || '',
          transferPin: metadata?.transferPin || '0192'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Signup failed' }));
        console.error('❌ AuthContext: Signup failed:', errorData);
        return { error: errorData?.error || `Signup failed (${response.status})` };
      }

      const data = await response.json();
      if (data?.error) {
        console.error('❌ AuthContext: Signup error:', data.error);
        return { error: data.error };
      }

      console.log('✅ AuthContext: Signup successful');
      return {};
    } catch (error: any) {
      console.error('❌ AuthContext: Signup exception:', error);
      return { error: error?.message || 'Signup failed' };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 AuthContext: Signing out user');
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setUserProfile(null);
      console.log('✅ AuthContext: Signed out successfully');
    } catch (error) {
      console.error('❌ AuthContext: Signout error:', error);
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
