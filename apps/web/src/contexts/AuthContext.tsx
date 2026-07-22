import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authenticatedFetch, queryClient } from '@/lib/queryClient';
import { clearAvatarCache } from '@/components/Avatar';

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

interface SignUpMetadata {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  profession?: string;
  annualIncome?: string;
  idType?: string;
  idNumber?: string;
  transferPin?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, metadata?: SignUpMetadata) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  fetchUserData: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!storedToken || !storedUser) {
        if (!cancelled) setLoading(false);
        return;
      }

      let parsedUser: User;
      try {
        parsedUser = JSON.parse(storedUser);
        if (!parsedUser?.id || !parsedUser?.email) throw new Error('invalid');
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('refresh_token');
        if (!cancelled) setLoading(false);
        return;
      }

      setUser(parsedUser);

      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile);
          if (!cancelled) setUserProfile(parsedProfile);
        } catch { /* ignore */ }
      }

      try {
        const response = await authenticatedFetch('/api/user');
        if (response.ok) {
          const profile = await response.json();
          if (!cancelled && profile && typeof profile === 'object') {
            setUserProfile(profile);
            localStorage.setItem('userProfile', JSON.stringify(profile));
          }
        } else if (response.status === 401) {
          if (!cancelled) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userProfile');
            localStorage.removeItem('refresh_token');
            setUser(null);
            setUserProfile(null);
          }
        }
      } catch {
        // Network error - keep cached profile, user stays logged in
      }

      if (!cancelled) setLoading(false);
    }

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  const fetchUserData = useCallback(async (authUser: User) => {
    if (!authUser?.id) return;
    try {
      const response = await authenticatedFetch(`/api/user`);
      if (!response.ok) return;
      const profile = await response.json();
      if (profile && typeof profile === 'object') {
        setUserProfile(profile);
      }
    } catch (error) { console.error('Auth error:', error); }
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
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        setLoading(false);
        return { error: errorData.error || `Login failed (${response.status})` };
      }

      const data = await response.json();

      if (!data || data.error) {
        setLoading(false);
        return { error: data?.error || 'Login failed' };
      }

      if (!data.token || data.token.split('.').length !== 3) {
        setLoading(false);
        return { error: 'Invalid authentication token format' };
      }

      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('refresh_token', data.refreshToken || '');

        const userObj: User = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role
        };
        setUser(userObj);

        const cacheProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.fullName || data.user.email.split('@')[0],
          phone: data.user.phone || '',
          role: data.user.role || 'customer',
          balance: data.user.balance || '0',
          isVerified: data.user?.isVerified || false,
          isActive: data.user?.isActive !== undefined ? data.user.isActive : true,
          profession: data.user.profession || '',
          accountId: data.user.accountId || '',
          accountNumber: data.user.accountNumber || ''
        };
        setUserProfile(cacheProfile);
        localStorage.setItem('userProfile', JSON.stringify(cacheProfile));

        setLoading(false);
        return {};
      }

      setLoading(false);
      return { error: 'Authentication failed - invalid response' };
    } catch (error) {
      setLoading(false);
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  };

  const signUp = async (email: string, password: string, metadata?: SignUpMetadata): Promise<{ error?: string }> => {
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
          transferPin: metadata?.transferPin || ""
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
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Signup failed' };
    }
  };

  const signOut = async () => {
    const clearAll = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('bank_chat_messages_v2');
      clearAvatarCache();
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_session');
      setUser(null);
      setUserProfile(null);
    };

    try {
      await authenticatedFetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {});
    } catch { /* ignore */ }

    clearAll();

    try {
      queryClient.clear();
    } catch { /* ignore */ }

    window.location.replace('/login');
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
