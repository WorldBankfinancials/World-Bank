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
  role: string;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session token
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Verify token with backend
          const response = await fetch('/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
            await fetchUserData(userData.user);
          } else {
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const fetchUserData = useCallback(async (authUser: User) => {
    try {
      if (!authUser?.id) return;

      const response = await fetch(`/api/users/supabase/${authUser.id}`);
      if (response.ok) {
        const profile = await response.json();
        setUserProfile({
          id: authUser.id,
          email: authUser.email,
          fullName: profile?.fullName || authUser.user_metadata?.full_name,
          username: profile?.username,
          phone: profile?.phone,
          role: profile?.role,
          balance: profile?.balance,
          isVerified: profile?.isVerified,
          isActive: profile?.isActive,
          profession: profile?.profession,
          accountId: profile?.accountId,
          accountNumber: profile?.accountNumber,
        });
      } else {
        setUserProfile({
          id: authUser.id,
          email: authUser.email,
          fullName: authUser.user_metadata?.full_name,
        });
      }
    } catch (error) {
      console.error('Fetch user data error:', error);
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);

      if (!supabase) {
        return { error: 'Authentication service unavailable' };
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Supabase auth error:', error.message);
          return { error: error.message };
        }

        if (data.user && data.session) {
          setUser(data.user);
          await fetchUserData(data.user);
          setLoading(false);
          return {};
        }

        setLoading(false);
        return { error: 'Authentication failed' };
      } catch (supabaseError: any) {
        console.error('Supabase connection error:', supabaseError);
        
        // Fallback to backend login if Supabase fails
        console.log('Attempting backend login fallback...');
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          const errorData = await response.json();
          return { error: errorData.error || 'Login failed' };
        }

        const loginData = await response.json();
        setUser({ 
          id: loginData.user.id, 
          email: loginData.user.email,
          app_metadata: { role: loginData.user.role },
          user_metadata: {},
          aud: '',
          created_at: new Date().toISOString()
        } as any);
        
        setLoading(false);
        return {};
      }
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      return { error: 'Network error occurred' };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any): Promise<{ error?: string }> => {
    try {
      if (!supabase) {
        return { error: 'Authentication service unavailable' };
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Signup failed' };
    }
  };

  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
        setUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Sign out error:', error);
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
