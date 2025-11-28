import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check localStorage on mount with proper error handling
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser?.id && parsedUser?.email) {
          setUser(parsedUser);
        } else {
          throw new Error('Invalid user format');
        }
      } catch (e) {
        console.error('❌ Auth init error:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const fetchUserData = useCallback(async (user: User) => {
    if (!user?.id) {
      console.error('❌ Invalid user for fetchUserData');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const profile = await response.json();
      if (profile && typeof profile === 'object') {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('❌ Fetch user data error:', error);
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        setLoading(false);
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        return { error: errorData.error || `Login failed (${response.status})` };
      }

      const data = await response.json();

      if (!data || data.error) {
        setLoading(false);
        return { error: data?.error || 'Login failed' };
      }

      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser({ id: data.user.id, email: data.user.email } as User);
        setLoading(false);
        return {};
      }

      setLoading(false);
      return { error: 'Authentication failed - invalid response' };
    } catch (error: any) {
      setLoading(false);
      console.error('❌ Sign in error:', error);
      return { error: error?.message || 'Network error' };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any): Promise<{ error?: string }> => {
    try {
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
          transferPin: metadata?.transferPin || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Signup failed' }));
        return { error: errorData?.error || `Signup failed (${response.status})` };
      }

      const data = await response.json();
      if (data?.error) {
        return { error: data.error };
      }

      return {};
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      return { error: error?.message || 'Signup failed' };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('❌ Sign out error:', error);
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
