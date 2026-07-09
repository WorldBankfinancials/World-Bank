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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedProfile = localStorage.getItem('userProfile');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.id && parsedUser?.email) {
          setUser(parsedUser);
          if (storedProfile) { try { setUserProfile(JSON.parse(storedProfile)); } catch (e) {} }
        }
      } catch (e) { localStorage.clear(); }
    }
    setLoading(false);
  }, []);

  const fetchUserData = useCallback(async (authUser: User) => {
    if (!authUser?.id) return;
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/user`);
      if (!response.ok) return;
      const profile = await response.json();
      if (profile && typeof profile === 'object') setUserProfile(profile);
    } catch (error: any) {}
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
      if (!data || data.error) { setLoading(false); return { error: data?.error || 'Login failed' }; }
      if (!data.token || !data.token.includes('.')) { setLoading(false); return { error: 'Invalid authentication token format' }; }
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('refresh_token', data.refreshToken || '');
        const userObj: User = { id: data.user.id, email: data.user.email, role: data.user.role };
        setUser(userObj);
        const cacheProfile: UserProfile = { id: data.user.id, email: data.user.email, fullName: data.user.fullName || data.user.email.split('@')[0], phone: data.user.phone || '', role: data.user.role || 'customer', balance: data.user.balance || '0', isVerified: true, isActive: true, profession: data.user.profession || '', accountId: data.user.accountId || '', accountNumber: data.user.accountNumber || '****1234' };
        setUserProfile(cacheProfile);
        localStorage.setItem('userProfile', JSON.stringify(cacheProfile));
        setLoading(false);
        return {};
      }
      setLoading(false);
      return { error: 'Authentication failed - invalid response' };
    } catch (error: any) {
      setLoading(false);
      return { error: error?.message || 'Network error' };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any): Promise<{ error?: string }> => {
    try {
      const response = await fetch('/api/auth/register-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName: metadata?.firstName || email.split('@')[0], lastName: metadata?.lastName || 'User', phone: metadata?.phone || '', dateOfBirth: metadata?.dateOfBirth || '', address: metadata?.address || '', city: metadata?.city || '', state: metadata?.state || '', country: metadata?.country || '', postalCode: metadata?.postalCode || '', profession: metadata?.profession || '', annualIncome: metadata?.annualIncome || '', idType: metadata?.idType || '', idNumber: metadata?.idNumber || '', transferPin: metadata?.transferPin || '0192' })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Signup failed' }));
        return { error: errorData?.error || `Signup failed (${response.status})` };
      }
      const data = await response.json();
      if (data?.error) return { error: data.error };
      return {};
    } catch (error: any) {
      return { error: error?.message || 'Signup failed' };
    }
  };

  const signOut = async () => {
    try {
      try {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        await authenticatedFetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).catch(() => {});
      } catch (e) {}
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setUserProfile(null);
      try { const { queryClient } = await import('@/lib/queryClient'); queryClient.clear(); } catch (e) {}
      window.location.replace('/login');
    } catch (error) {
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setUserProfile(null);
      window.location.replace('/login');
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
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
